import { NextRequest, NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import prisma from '@/lib/prisma';
import { calculateAll, ResultItem } from '@/lib/result-calculator';
import { CSIBER_MARKSHEET_GRADE_TABLE } from '@/lib/result-calculator';
import { getAuthPayload, handleAuthError } from '@/lib/admin-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ prn: string; semester: string }> }
) {
  try {
    const auth = await getAuthPayload(request);
    const { prn, semester } = await params;
    const semNumber = parseInt(semester, 10);

    const semesterRecord = await prisma.semester.findUnique({
      where: { number: semNumber },
    });

    if (!semesterRecord) {
      return NextResponse.json({ error: 'Semester not found' }, { status: 404 });
    }

    // Determine the effective PRN to query
    let effectivePrn = prn.toUpperCase();

    // If student, enforce own PRN only
    if (auth && auth.role === 'STUDENT') {
      if (!auth.prn) {
        return NextResponse.json({ error: 'Student PRN not linked to account' }, { status: 403 });
      }
      effectivePrn = auth.prn;
    }

    const results = await prisma.result.findMany({
      where: {
        prn: effectivePrn,
        semesterId: semesterRecord.id,
      },
      include: {
        subject: true,
        semester: true,
        student: {
          include: {
            classYear: {
              include: {
                course: {
                  include: {
                    department: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (results.length === 0) {
      return NextResponse.json({ error: 'No results found' }, { status: 404 });
    }

    const student = results[0].student;

    const calcResults: ResultItem[] = results.map(r => ({
      internalMarks: r.internalMarks ?? null,
      externalMarks: r.externalMarks ?? null,
      marksObtained: r.marksObtained,
      maxMarks: r.maxMarks,
      maxInternalMarks: r.maxInternalMarks ?? null,
      maxExternalMarks: r.maxExternalMarks ?? null,
      grade: r.grade ?? null,
      gradePoint: r.gradePoint !== null && r.gradePoint !== undefined ? Number(r.gradePoint) : null,
      credits: r.subject?.credits ?? null,
      isHalfCredit: r.subject?.isHalfCredit ?? false,
    }));
    const { totalMarks, maxMarks, totalCredits, percentage, sgpa, backlogCount, status } = calculateAll(calcResults);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verifyUrl = `${baseUrl}/verify?prn=${effectivePrn}&semester=${semNumber}`;
    const qrBuffer = await QRCode.toBuffer(verifyUrl, { width: 120, margin: 1, errorCorrectionLevel: 'M' });

    const pdfDoc = new PDFDocument({ margin: 40, size: 'A4', layout: 'portrait' });
    const buffers: Uint8Array[] = [];
    pdfDoc.on('data', (chunk) => buffers.push(chunk));
    const pdfReady = new Promise<void>((resolve) => pdfDoc.on('end', resolve));

    const pageWidth = pdfDoc.page.width - pdfDoc.page.margins.left - pdfDoc.page.margins.right;
    const startX = pdfDoc.page.margins.left;

    function drawHeader() {
      pdfDoc.fontSize(14).font('Helvetica-Bold').text('CHHATRAPATI SHAHU INSTITUTE OF BUSINESS EDUCATION & RESEARCH, KOLHAPUR', { align: 'center' });
      pdfDoc.fontSize(11).font('Helvetica-Bold').text('(AN AUTONOMOUS INSTITUTE)', { align: 'center' });
      pdfDoc.fontSize(9).font('Helvetica').text('University Road, Kolhapur – 416004, Maharashtra, India.', { align: 'center' });
      pdfDoc.moveDown(0.4);
      pdfDoc.moveTo(startX, pdfDoc.y).lineTo(startX + pageWidth, pdfDoc.y).stroke();
      pdfDoc.moveDown(0.4);
      pdfDoc.fontSize(13).font('Helvetica-Bold').text('STATEMENT SHOWING THE MARKS, GRADE AND GRADE POINTS OBTAINED BY', { align: 'center' });
      pdfDoc.moveDown(0.3);
      pdfDoc.fontSize(12).font('Helvetica-Bold').text(`Semester ${semNumber} Result`, { align: 'center' });
      pdfDoc.moveDown(0.2);
      pdfDoc.moveDown(0.2);
      pdfDoc.moveTo(startX, pdfDoc.y).lineTo(startX + pageWidth, pdfDoc.y).stroke();
      pdfDoc.moveDown(0.6);
    }

    function drawStudentInfo() {
      pdfDoc.font('Helvetica-Bold').fontSize(10);
      pdfDoc.text('Student Information', startX, pdfDoc.y);
      pdfDoc.moveDown(0.2);

      const studentCourse = student.classYear?.course;
      const studentDepartment = studentCourse?.department;
      const details = [
        ['Name', student.name],
        ['PRN', student.prn],
        ['Course', studentCourse?.code || 'BCA'],
        ['Branch', studentDepartment?.name || 'Computer Applications'],
        ['Semester', semNumber.toString()],
        ['Academic Year', '—'],
        ['Exam Session', '—'],
        ['Seat No.', '—'],
        ['Result Date', '—'],
      ];

      details.forEach(([label, value]) => {
        pdfDoc.font('Helvetica-Bold').fontSize(9).text(`${label}: `, { continued: true });
        pdfDoc.font('Helvetica').fontSize(9).text(value);
      });
      pdfDoc.moveDown(0.5);
    }

    function drawSubjectTable() {
      pdfDoc.font('Helvetica-Bold').fontSize(10).text('Subject-wise Marks', startX, pdfDoc.y);
      pdfDoc.moveDown(0.2);
      pdfDoc.fontSize(8).font('Helvetica').text('Int. = Internal Assessment (Max 25)   End = End-Semester Exam (Max 75)   Total = Int.+End (Max 100)', startX, pdfDoc.y);
      pdfDoc.moveDown(0.2);

      const colWidths = [55, 125, 35, 35, 35, 30, 35, 35, 35, 40];
      const headers = ['Sub. Code', 'Subject Name', 'Int.', 'End', 'Total', 'Grade', 'GP', 'Paper Cr.', 'Total Cr.', 'Remark'];
      const totalWidth = colWidths.reduce((a, b) => a + b, 0);

      let y = pdfDoc.y;
      pdfDoc.font('Helvetica-Bold').fontSize(7);
      let x = startX;
      headers.forEach((h, i) => {
        const align = i === 1 ? 'left' : 'center';
        pdfDoc.text(h, x, y, { width: colWidths[i], align });
        x += colWidths[i];
      });
      y += 14;
      pdfDoc.moveTo(startX, y).lineTo(startX + totalWidth, y).stroke();
      y += 4;

      pdfDoc.font('Helvetica').fontSize(7);
      results.forEach((r) => {
        if (y > pdfDoc.page.height - 80) {
          pdfDoc.addPage();
          y = pdfDoc.page.margins.top;
        }
        x = startX;
        const intMarks = r.internalMarks ?? null;
        const endMarks = r.externalMarks ?? null;
        const total = r.marksObtained;
        const grade = r.grade || 'F';
        const gp = (r.gradePoint !== null && r.gradePoint !== undefined ? Number(r.gradePoint) : null);
        const paperCr = (r.subject?.credits ?? null);
        const totalCr = (r.subject?.credits ?? null);
        const remark = r.remark || (grade === 'F' ? 'FAIL' : 'PASS');

        const row = [
          r.subject?.code || '',
          r.subject?.name || '',
          intMarks !== null ? intMarks.toString() : '—',
          endMarks !== null ? endMarks.toString() : '—',
          total.toString(),
          grade,
          gp !== null ? gp.toFixed(1) : '—',
          paperCr !== null ? paperCr.toString() : '—',
          totalCr !== null ? totalCr.toString() : '—',
          remark,
        ];
        row.forEach((val, i) => {
          const align = i === 1 ? 'left' : 'center';
          pdfDoc.text(val, x, y, { width: colWidths[i], align });
          x += colWidths[i];
        });
        y += 12;
      });

      pdfDoc.y = y + 8;
    }

    function drawSummary() {
      pdfDoc.moveDown(0.5);
      pdfDoc.font('Helvetica-Bold').fontSize(10).text('Semester Summary', startX, pdfDoc.y);
      pdfDoc.moveDown(0.3);
      pdfDoc.font('Helvetica').fontSize(9);

      const summaryItems = [
        ['Marks Obtained', `${totalMarks} / ${maxMarks}`],
        ['Percentage', `${percentage.toFixed(2)}%`],
        ['SGPA', sgpa !== null ? sgpa.toFixed(2) : '—'],
        ['Total Credit', totalCredits.toString()],
        ['Backlogs', backlogCount.toString()],
        ['Result', status],
      ];

      summaryItems.forEach(([label, value]) => {
        pdfDoc.font('Helvetica-Bold').text(`${label}: `, { continued: true });
        pdfDoc.font('Helvetica').text(value);
      });
      pdfDoc.moveDown(0.8);
    }

    function drawFormula() {
      pdfDoc.moveTo(startX, pdfDoc.y).lineTo(startX + pageWidth, pdfDoc.y).stroke();
      pdfDoc.moveDown(0.5);
      pdfDoc.font('Helvetica-Bold').fontSize(10).text('SGPA & CGPA Formula', startX, pdfDoc.y);
      pdfDoc.moveDown(0.3);
      pdfDoc.font('Courier').fontSize(9);
      pdfDoc.text('SGPA = Σ (Cᵢ × Gᵢ) / Σ Cᵢ');
      pdfDoc.moveDown(0.2);
      pdfDoc.font('Helvetica').fontSize(8).text('Where Cᵢ = Credit of i-th subject, Gᵢ = Grade Point of i-th subject');
      pdfDoc.moveDown(0.5);
      pdfDoc.font('Courier').fontSize(9);
      pdfDoc.text('CGPA = Σ (Cᵢ × Gᵢ) / Σ Cᵢ (across all semesters)');
      pdfDoc.moveDown(0.2);
      pdfDoc.font('Helvetica').fontSize(8).text('Cumulative Grade Point Average calculated over all completed semesters');
      pdfDoc.moveDown(1);
    }

    function drawFooter() {
      pdfDoc.moveTo(startX, pdfDoc.y).lineTo(startX + pageWidth, pdfDoc.y).stroke();
      pdfDoc.moveDown(0.5);
      pdfDoc.fontSize(7).font('Helvetica-Oblique').text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
      pdfDoc.fontSize(7).font('Helvetica-Oblique').text('Computer Generated Academic Statement. For official grade card, contact the Examination Cell.', { align: 'center' });
      pdfDoc.moveDown(0.5);
      pdfDoc.font('Helvetica').fontSize(9);
      pdfDoc.text('RESULT DATE: ______________________', startX, pdfDoc.y);
      pdfDoc.moveDown(0.3);
      pdfDoc.text('CHECKED BY: ______________________', startX, pdfDoc.y);
      pdfDoc.text('PREPARED BY: ______________________', startX + pageWidth/2, pdfDoc.y);
      pdfDoc.moveDown(0.3);
      pdfDoc.text('CONTROLLER OF EXAMINATIONS: ______________________', startX, pdfDoc.y);
      pdfDoc.text('DIRECTOR: ______________________', startX + pageWidth/2, pdfDoc.y);
      pdfDoc.moveDown(0.5);
      pdfDoc.fontSize(7).font('Helvetica-Oblique');
      const legendLines = [
        'S - Fail',
        'AB - Absent',
        'P - Passed in previous attempt',
        '@ - Higher Class',
        '* - Indicates female candidate',
        'NC - Non Credit Course'
      ];
      legendLines.forEach(line => {
        pdfDoc.text(line, { align: 'center' });
      });
    }

    function drawQRCode() {
      const qrSize = 80;
      const qrX = startX + pageWidth - qrSize;
      const qrY = pdfDoc.y + 10;
      pdfDoc.font('Helvetica-Bold').fontSize(8).text('Scan to Verify This Semester', qrX - 10, qrY - 14, { width: qrSize + 20, align: 'center' });
      pdfDoc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });
    }

    function drawGradeTable() {
      pdfDoc.addPage();
      pdfDoc.fontSize(13).font('Helvetica-Bold').text('CSIBER Grading System (as printed on marksheet)', { align: 'center' });
      pdfDoc.moveDown(0.3);

      // Full Credit Courses
      pdfDoc.fontSize(10).font('Helvetica-Bold').text('Full Credit Courses', { align: 'center' });
      pdfDoc.moveDown(0.2);
      drawGradeTableSection();

      pdfDoc.moveDown(0.5);
      // Half Credit Courses
      pdfDoc.fontSize(10).font('Helvetica-Bold').text('Half Credit Courses', { align: 'center' });
      pdfDoc.moveDown(0.2);
      pdfDoc.fontSize(8).font('Helvetica').text('Same grade point mapping as full credit courses', { align: 'center' });
      pdfDoc.moveDown(0.3);
      drawGradeTableSection();

      pdfDoc.moveDown(1);
      pdfDoc.moveTo(startX, pdfDoc.y).lineTo(startX + pageWidth, pdfDoc.y).stroke();
      pdfDoc.moveDown(0.5);
      pdfDoc.fontSize(7).font('Helvetica-Oblique').text('Note: Minimum 40% marks required to pass each subject.', { align: 'center' });
      pdfDoc.fontSize(7).font('Helvetica-Oblique').text('Grade table reproduced from supplied CSIBER marksheet; official current BCA syllabus may differ.', { align: 'center' });
    }

    function drawGradeTableSection() {
      const colWidths = [50, 50, 80, 150, 80];
      const headers = ['Grade', 'Grade Point', 'Marks Range (%)', 'Description', 'Half Credit GP'];
      const totalWidth = colWidths.reduce((a, b) => a + b, 0);

      let y = pdfDoc.y;
      pdfDoc.font('Helvetica-Bold').fontSize(9);
      let x = startX;
      headers.forEach((h, i) => {
        pdfDoc.text(h, x, y, { width: colWidths[i], align: i === 3 ? 'left' : 'center' });
        x += colWidths[i];
      });
      y += 14;
      pdfDoc.moveTo(startX, y).lineTo(startX + totalWidth, y).stroke();
      y += 4;

      pdfDoc.font('Helvetica').fontSize(9);
      CSIBER_MARKSHEET_GRADE_TABLE.forEach((g) => {
        x = startX;
        const row = [g.grade, g.gradePoint.toFixed(1), `${g.minPct}-${g.maxPct}`, g.description, g.gradePoint.toFixed(1)];
        row.forEach((val, i) => {
          pdfDoc.text(val, x, y, { width: colWidths[i], align: i === 3 ? 'left' : 'center' });
          x += colWidths[i];
        });
        y += 14;
      });
      pdfDoc.y = y;
    }

    // Generate PDF
    drawHeader();
    drawStudentInfo();
    drawSubjectTable();
    drawSummary();
    drawFormula();
    drawFooter();
    drawQRCode();
    drawGradeTable();

    pdfDoc.end();

    await pdfReady;
    const pdfBytes = Buffer.concat(buffers);

    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="CSIBER_Result_${effectivePrn}_Sem_${semNumber}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    return handleAuthError(e);
  }
}