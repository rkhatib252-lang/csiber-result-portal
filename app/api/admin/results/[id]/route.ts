import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, handleAuthError } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';
import { calculateAll, ResultItem } from '@/lib/result-calculator';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(_req);
  } catch (e) {
    return handleAuthError(e);
  }

  const { id } = await params;
  const result = await prisma.result.findUnique({
    where: { id },
    include: { student: true, subject: true, semester: true },
  });
  if (!result) {
    return NextResponse.json({ error: 'Result not found' }, { status: 404 });
  }
  // compute using calculator
  const calcItem: ResultItem = {
    internalMarks: result.internalMarks ?? 0,
    externalMarks: result.externalMarks ?? 0,
    marksObtained: result.marksObtained,
    maxMarks: result.maxMarks,
    maxInternalMarks: result.maxInternalMarks ?? 25,
    maxExternalMarks: result.maxExternalMarks ?? 75,
    grade: result.grade ?? undefined,
    gradePoint: result.gradePoint !== null && result.gradePoint !== undefined ? Number(result.gradePoint) : undefined,
    credits: result.subject?.credits ?? undefined,
    isHalfCredit: result.subject?.isHalfCredit ?? undefined,
  };
  const calc = calculateAll([calcItem]);
  return NextResponse.json({ result, calculation: calc });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
  } catch (e) {
    return handleAuthError(e);
  }

  const { id } = await params;
  const body = await request.json();
  const {
    internalMarks,
    externalMarks,
    maxInternalMarks,
    maxExternalMarks,
    maxMarks,
    credits,
    grade,
    gradePoint,
    remark,
  } = body;

  // validation
  if (internalMarks !== undefined && (internalMarks < 0)) {
    return NextResponse.json({ error: 'Internal marks cannot be negative' }, { status: 400 });
  }
  if (externalMarks !== undefined && (externalMarks < 0)) {
    return NextResponse.json({ error: 'External marks cannot be negative' }, { status: 400 });
  }
  if (maxInternalMarks !== undefined && maxInternalMarks <= 0) {
    return NextResponse.json({ error: 'Max internal marks must be positive' }, { status: 400 });
  }
  if (maxExternalMarks !== undefined && maxExternalMarks <= 0) {
    return NextResponse.json({ error: 'Max external marks must be positive' }, { status: 400 });
  }
  if (maxMarks !== undefined && maxMarks <= 0) {
    return NextResponse.json({ error: 'Max marks must be positive' }, { status: 400 });
  }
  if (credits !== undefined && credits < 0) {
    return NextResponse.json({ error: 'Credits cannot be negative' }, { status: 400 });
  }
  if (gradePoint !== undefined && (gradePoint < 0 || gradePoint > 10)) {
    return NextResponse.json({ error: 'Grade point out of range' }, { status: 400 });
  }

  const existing = await prisma.result.findUnique({ where: { id }, include: { subject: true } });
  if (!existing) {
    return NextResponse.json({ error: 'Result not found' }, { status: 404 });
  }

  const intMarks = internalMarks ?? existing.internalMarks ?? 0;
  const extMarks = externalMarks ?? existing.externalMarks ?? 0;
  const maxInt = maxInternalMarks ?? existing.maxInternalMarks ?? 25;
  const maxExt = maxExternalMarks ?? existing.maxExternalMarks ?? 75;
  const maxTot = maxMarks ?? existing.maxMarks ?? (maxInt + maxExt);
  const obtained = intMarks + extMarks;
  if (obtained > maxTot) {
    return NextResponse.json({ error: 'Obtained marks exceed max marks' }, { status: 400 });
  }

  const isHalf = existing.subject?.isHalfCredit ?? false;
  const calcGrade = grade ?? existing.grade ?? '';
  const calcGradePoint = gradePoint !== undefined ? gradePoint : (calcGrade ? Number(calcGrade) : null); // fallback compute later

  // We'll let calculator recompute grade/gradePoint if not provided
  const updated = await prisma.result.update({
    where: { id },
    data: {
      internalMarks: intMarks,
      externalMarks: extMarks,
      marksObtained: obtained,
      maxMarks: maxTot,
      maxInternalMarks: maxInt,
      maxExternalMarks: maxExt,

      grade: grade ?? existing.grade,
      gradePoint: gradePoint ?? existing.gradePoint,
      remark: remark ?? existing.remark,
    },
    include: { student: true, subject: true, semester: true },
  });

  // recompute with calculator to ensure consistency
  const calcItem: ResultItem = {
    internalMarks: updated.internalMarks ?? 0,
    externalMarks: updated.externalMarks ?? 0,
    marksObtained: updated.marksObtained,
    maxMarks: updated.maxMarks,
    maxInternalMarks: updated.maxInternalMarks ?? 25,
    maxExternalMarks: updated.maxExternalMarks ?? 75,
    grade: updated.grade ?? undefined,
    gradePoint: updated.gradePoint !== null && updated.gradePoint !== undefined ? Number(updated.gradePoint) : undefined,
    credits: updated.subject?.credits ?? undefined,
    isHalfCredit: updated.subject?.isHalfCredit ?? undefined,
  };
  const calc = calculateAll([calcItem]);

  return NextResponse.json({ result: updated, calculation: calc });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(_req);
  } catch (e) {
    return handleAuthError(e);
  }

  const { id } = await params;
  const existing = await prisma.result.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Result not found' }, { status: 404 });
  }
  await prisma.result.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
