import * as XLSX from '@keep-lts/xlsx';

export interface ParsedRow {
  prn: string;
  studentName: string;
  course: string;
  semester: number;
  examSession?: string;
  seatNo?: string;
  subjectCode: string;
  subjectName: string;
  maxInternalMarks?: number | null;
  internalMarks?: number | null;
  maxExternalMarks?: number | null;
  externalMarks?: number | null;
  maxMarks?: number | null;
  marksObtained?: number | null;
  credits?: number | null;
  grade?: string;
  gradePoint?: number | null;
  remark?: string;
  isHalfCredit?: boolean;
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export interface ParseResult {
  rows: ParsedRow[];
  errors: ValidationError[];
  duplicateRows: number[];
}

function normalizeString(val: unknown): string {
  return String(val ?? '').trim();
}

function parseNumber(val: unknown): number | null {
  if (val === undefined || val === null || val === '') return null;
  const num = Number(val);
  return isNaN(num) ? null : num;
}

function parseInteger(val: unknown): number | null {
  const num = parseNumber(val);
  return num !== null && Number.isInteger(num) ? num : null;
}

function parseDecimal(val: unknown): number | null {
  const num = parseNumber(val);
  return num;
}

function parseBoolean(val: unknown): boolean | undefined {
  if (val === undefined || val === null || val === '') return undefined;
  const str = String(val).toLowerCase().trim();
  if (str === 'true' || str === 'yes' || str === '1' || str === 'y') return true;
  if (str === 'false' || str === 'no' || str === '0' || str === 'n') return false;
  return undefined;
}

export function parseFile(buffer: Buffer, mimeType: string): ParsedRow[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  if (workbook.SheetNames.length === 0) {
    throw new Error('File contains no sheets');
  }
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const json: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  if (json.length === 0) {
    return [];
  }
  const rows: ParsedRow[] = [];
  for (let i = 0; i < json.length; i++) {
    const r = json[i];
    const row: ParsedRow = {
      prn: normalizeString(r['PRN'] ?? r['Prn'] ?? r['prn']),
      studentName: normalizeString(r['Student Name'] ?? r['StudentName'] ?? r['student_name']),
      course: normalizeString(r['Course'] ?? r['course']),
      semester: parseInteger(r['Semester'] ?? r['semester']) ?? 0,
      examSession: normalizeString(r['Exam Session'] ?? r['ExamSession'] ?? r['exam_session']) || undefined,
      seatNo: normalizeString(r['Seat No'] ?? r['SeatNo'] ?? r['seat_no']) || undefined,
      subjectCode: normalizeString(r['Subject Code'] ?? r['SubjectCode'] ?? r['subject_code']),
      subjectName: normalizeString(r['Subject Name'] ?? r['SubjectName'] ?? r['subject_name']),
      maxInternalMarks: parseNumber(r['Max Internal Marks'] ?? r['MaxInternalMarks'] ?? r['max_internal_marks']),
      internalMarks: parseNumber(r['Internal Marks'] ?? r['InternalMarks'] ?? r['internal_marks']),
      maxExternalMarks: parseNumber(r['Max External Marks'] ?? r['MaxExternalMarks'] ?? r['max_external_marks']),
      externalMarks: parseNumber(r['External Marks'] ?? r['ExternalMarks'] ?? r['external_marks']),
      maxMarks: parseNumber(r['Max Total Marks'] ?? r['MaxTotalMarks'] ?? r['Max Marks'] ?? r['MaxMarks'] ?? r['max_marks']),
      marksObtained: parseNumber(r['Total Marks'] ?? r['Marks Obtained'] ?? r['MarksObtained'] ?? r['marks_obtained']),
      credits: parseNumber(r['Credits'] ?? r['Paper Credit'] ?? r['PaperCredit'] ?? r['credits']),
      grade: normalizeString(r['Grade'] ?? r['grade']) || undefined,
      gradePoint: parseDecimal(r['Grade Point'] ?? r['GradePoint'] ?? r['grade_point']),
      remark: normalizeString(r['Remark'] ?? r['remark']) || undefined,
      isHalfCredit: parseBoolean(r['Half Credit'] ?? r['HalfCredit'] ?? r['is_half_credit'] ?? r['IsHalfCredit']),
    };
    rows.push(row);
  }
  return rows;
}

export function validateRows(rows: ParsedRow[]): { validRows: ParsedRow[]; errors: ValidationError[]; duplicateIndices: number[]; invalidRowCount: number } {
  const errors: ValidationError[] = [];
  const seen = new Map<string, number>();
  const duplicateIndices: number[] = [];
  const validRows: ParsedRow[] = [];
  const rowsWithErrors = new Set<number>();

  rows.forEach((row, idx) => {
    const rowNum = idx + 2; // header row = 1
    let rowValid = true;

    if (!row.prn) {
      errors.push({ row: rowNum, field: 'PRN', message: 'PRN is required' });
      rowValid = false;
    }
    if (!row.studentName) {
      errors.push({ row: rowNum, field: 'Student Name', message: 'Student Name is required' });
      rowValid = false;
    }
    if (!row.course) {
      errors.push({ row: rowNum, field: 'Course', message: 'Course is required' });
      rowValid = false;
    }
    if (!row.semester || row.semester < 1 || row.semester > 10) {
      errors.push({ row: rowNum, field: 'Semester', message: 'Semester must be an integer between 1 and 10' });
      rowValid = false;
    }
    if (!row.subjectCode) {
      errors.push({ row: rowNum, field: 'Subject Code', message: 'Subject Code is required' });
      rowValid = false;
    }
    if (!row.subjectName) {
      errors.push({ row: rowNum, field: 'Subject Name', message: 'Subject Name is required' });
      rowValid = false;
    }

    // Marks validation – missing marks are NOT defaulted to zero
    if (row.maxInternalMarks === null || row.maxInternalMarks === undefined) {
      errors.push({ row: rowNum, field: 'Max Internal Marks', message: 'Max Internal Marks is required' });
      rowValid = false;
    } else if (row.maxInternalMarks <= 0) {
      errors.push({ row: rowNum, field: 'Max Internal Marks', message: 'Max Internal Marks must be > 0' });
      rowValid = false;
    }

    if (row.internalMarks === null || row.internalMarks === undefined) {
      errors.push({ row: rowNum, field: 'Internal Marks', message: 'Internal Marks is required' });
      rowValid = false;
    } else if (row.internalMarks < 0) {
      errors.push({ row: rowNum, field: 'Internal Marks', message: 'Internal Marks cannot be negative' });
      rowValid = false;
    } else if (row.maxInternalMarks !== null && row.maxInternalMarks !== undefined && row.internalMarks > row.maxInternalMarks) {
      errors.push({ row: rowNum, field: 'Internal Marks', message: 'Internal Marks cannot exceed Max Internal Marks' });
      rowValid = false;
    }

    if (row.maxExternalMarks === null || row.maxExternalMarks === undefined) {
      errors.push({ row: rowNum, field: 'Max External Marks', message: 'Max External Marks is required' });
      rowValid = false;
    } else if (row.maxExternalMarks <= 0) {
      errors.push({ row: rowNum, field: 'Max External Marks', message: 'Max External Marks must be > 0' });
      rowValid = false;
    }

    if (row.externalMarks === null || row.externalMarks === undefined) {
      errors.push({ row: rowNum, field: 'External Marks', message: 'External Marks is required' });
      rowValid = false;
    } else if (row.externalMarks < 0) {
      errors.push({ row: rowNum, field: 'External Marks', message: 'External Marks cannot be negative' });
      rowValid = false;
    } else if (row.maxExternalMarks !== null && row.maxExternalMarks !== undefined && row.externalMarks > row.maxExternalMarks) {
      errors.push({ row: rowNum, field: 'External Marks', message: 'External Marks cannot exceed Max External Marks' });
      rowValid = false;
    }

    // Total marks – if supplied, must be consistent; if missing, we can compute = internal+external
    if (row.marksObtained !== null && row.marksObtained !== undefined) {
      if (row.marksObtained < 0) {
        errors.push({ row: rowNum, field: 'Total Marks', message: 'Total Marks cannot be negative' });
        rowValid = false;
      }
    }

    if (row.maxMarks !== null && row.maxMarks !== undefined) {
      if (row.maxMarks <= 0) {
        errors.push({ row: rowNum, field: 'Max Total Marks', message: 'Max Total Marks must be > 0' });
        rowValid = false;
      }
    }

    if (row.credits !== undefined && row.credits !== null) {
      if (row.credits < 0) {
        errors.push({ row: rowNum, field: 'Credits', message: 'Credits cannot be negative' });
        rowValid = false;
      }
    }

    if (row.gradePoint !== undefined && row.gradePoint !== null) {
      if (row.gradePoint < 0 || row.gradePoint > 10) {
        errors.push({ row: rowNum, field: 'Grade Point', message: 'Grade Point must be between 0 and 10' });
        rowValid = false;
      }
    }

    // Duplicate detection within file: key = prn|semester|subjectCode
    if (row.prn && row.semester && row.subjectCode) {
      const dupKey = `${row.prn}|${row.semester}|${row.subjectCode}`;
      if (seen.has(dupKey)) {
        duplicateIndices.push(rowNum);
        errors.push({ row: rowNum, field: 'Duplicate', message: `Duplicate row for PRN ${row.prn}, Semester ${row.semester}, Subject ${row.subjectCode}` });
        rowValid = false;
      } else {
        seen.set(dupKey, rowNum);
      }
    }

    if (!rowValid) {
      rowsWithErrors.add(rowNum);
    } else {
      validRows.push(row);
    }
  });

  return { validRows, errors, duplicateIndices, invalidRowCount: rowsWithErrors.size };
}
