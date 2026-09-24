import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, handleAuthError } from '@/lib/admin-auth';
import { parseFile, validateRows, ParsedRow, ValidationError } from '@/lib/import-utils';

const ALLOWED_MIME = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
  'text/csv',
  'application/csv',
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

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
    return NextResponse.json({ success: false, error: 'Unsupported file type. Use .xlsx, .xls, or .csv' }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ success: false, error: 'File too large (max 5 MB)' }, { status: 413 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  let rows: ParsedRow[];
  try {
    rows = parseFile(buffer, file.type);
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to parse file' }, { status: 400 });
  }

  if (rows.length === 0) {
    return NextResponse.json({ success: false, error: 'File contains no data rows' }, { status: 400 });
  }

  const { validRows, errors, invalidRowCount } = validateRows(rows);

  return NextResponse.json({
    success: true,
    totalRows: rows.length,
    validRows: validRows.length,
    invalidRows: invalidRowCount,
    errors,
    preview: validRows.map((r, i) => ({ row: i + 1, ...r })),
  });
}