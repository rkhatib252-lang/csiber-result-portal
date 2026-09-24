import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, handleAuthError } from '@/lib/admin-auth';
import { parseFile, validateRows, ParsedRow } from '@/lib/import-utils';
import prisma from '@/lib/prisma';
import { calculateGradeFromMarks, calculateGradePointFromGrade } from '@/lib/result-calculator';

const ALLOWED_MIME = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
  'application/csv',
];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
  } catch (e) {
    return handleAuthError(e);
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
  }
  if (!ALLOWED_MIME.includes(file.type)) {
    return NextResponse.json({ success: false, error: 'Unsupported file type' }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ success: false, error: 'File too large' }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let rows: ParsedRow[];
  try {
    rows = parseFile(buffer, file.type);
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to parse file' }, { status: 400 });
  }

  const { validRows, errors } = validateRows(rows);
  if (errors.length > 0) {
    return NextResponse.json({ success: false, error: 'Validation failed', errors }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      let studentsCreated = 0, studentsUpdated = 0;
      let subjectsCreated = 0;
      let semestersCreated = 0;
      let resultsCreated = 0, resultsUpdated = 0;

      for (const row of validRows) {
        // Semester
        let semester = await tx.semester.findUnique({ where: { number: row.semester } });
        if (!semester) {
          semester = await tx.semester.create({
            data: { number: row.semester, name: `Semester ${row.semester}` },
          });
          semestersCreated++;
        }

        // Subject
        let subject = await tx.subject.findUnique({ where: { code: row.subjectCode } });
        if (!subject) {
          subject = await tx.subject.create({
            data: {
              id: row.subjectCode,
              code: row.subjectCode,
              name: row.subjectName,
              credits: row.credits ?? 4,
              isHalfCredit: row.isHalfCredit ?? false,
              semesterId: semester.id,
            },
          });
          subjectsCreated++;
        } else {
          if (subject.semesterId !== semester.id) {
            await tx.subject.update({
              where: { id: subject.id },
              data: { semesterId: semester.id },
            });
          }
        }

        // Student
        let student = await tx.student.findUnique({ where: { prn: row.prn } });
        if (!student) {
          student = await tx.student.create({
            data: {
              prn: row.prn,
              name: row.studentName,
              email: null,
              batch: null,
            },
          });
          studentsCreated++;
        } else {
          if (student.name !== row.studentName) {
            await tx.student.update({
              where: { prn: student.prn },
              data: { name: row.studentName },
            });
            studentsUpdated++;
          }
        }

        // Compute total marks if not supplied
        const internal = row.internalMarks ?? 0;
        const external = row.externalMarks ?? 0;
        const marksObtained = row.marksObtained ?? (internal + external);
        const maxInternal = row.maxInternalMarks ?? 25;
        const maxExternal = row.maxExternalMarks ?? 75;
        const maxMarks = row.maxMarks ?? (maxInternal + maxExternal);

        const isHalfCredit = row.isHalfCredit ?? false;
        const grade = row.grade ?? calculateGradeFromMarks(marksObtained, maxMarks, isHalfCredit);
        const gradePoint = row.gradePoint ?? calculateGradePointFromGrade(grade, isHalfCredit);
        const remark = row.remark ?? (grade === 'F' ? 'FAIL' : 'PASS');

        const existingResult = await tx.result.findUnique({
          where: { prn_subjectId_semesterId: { prn: student.prn, subjectId: subject.id, semesterId: semester.id } },
        });

        if (existingResult) {
          await tx.result.update({
            where: { id: existingResult.id },
            data: {
              internalMarks: internal,
              externalMarks: external,
              marksObtained,
              maxMarks,
              maxInternalMarks: maxInternal,
              maxExternalMarks: maxExternal,
              grade,
              gradePoint,
              remark,
            },
          });
          resultsUpdated++;
        } else {
          await tx.result.create({
            data: {
              prn: student.prn,
              subjectId: subject.id,
              semesterId: semester.id,
              internalMarks: internal,
              externalMarks: external,
              marksObtained,
              maxMarks,
              maxInternalMarks: maxInternal,
              maxExternalMarks: maxExternal,
              grade,
              gradePoint,
              remark,
            },
          });
          resultsCreated++;
        }
      }

      return {
        studentsCreated,
        studentsUpdated,
        subjectsCreated,
        semestersCreated,
        resultsCreated,
        resultsUpdated,
        marksImported: validRows.length,
      };
    });

    return NextResponse.json({ success: true, ...result });
  } catch (e) {
    console.error('Import transaction failed', e);
    return NextResponse.json({ success: false, error: 'Import failed' }, { status: 500 });
  }
}