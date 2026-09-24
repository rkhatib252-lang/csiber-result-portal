export interface ResultItem {
  internalMarks?: number | null;
  externalMarks?: number | null;
  marksObtained: number;
  maxMarks: number;
  maxInternalMarks?: number | null;
  maxExternalMarks?: number | null;
  grade?: string | null;
  gradePoint?: number | null;
  credits?: number | null;
  isHalfCredit?: boolean;
  subject?: { credits?: number | null; isHalfCredit?: boolean } | null;
}

export interface CalculationResult {
  totalMarks: number;
  maxMarks: number;
  totalCredits: number;
  percentage: number;
  sgpa: number | null;
  backlogCount: number;
  status: 'PASS' | 'ATKT' | 'FAIL' | 'UNRESOLVED';
  subjects: Array<{
    internalMarks: number;
    externalMarks: number;
    marksObtained: number;
    maxMarks: number;
    maxInternalMarks: number;
    maxExternalMarks: number;
    grade: string;
    gradePoint: number;
    credits: number;
    isHalfCredit: boolean;
    remark: string;
  }>;
}

export interface GradeMapping {
  minPercentage: number;
  maxPercentage: number;
  grade: string;
  gradePoint: number;
  description: string;
}

/*
   OFFICIAL CSIBER BCA GRADING (from current BCA 2024-25 syllabus)
   https://www.siberindia.edu.in/uploads/bca/20250510.090854~BCA-2024-25.pdf
   Confirmed: <40 = F, 40-50 = C, 51-60 = B, 61-70 = B+, 71-80 = A, 81-90 = A+, 91-100 = O
*/
const CSIBER_OFFICIAL_FULL_CREDIT_GRADES: GradeMapping[] = [
  { minPercentage: 91, maxPercentage: 100, grade: 'O',  gradePoint: 10.0, description: 'Outstanding' },
  { minPercentage: 81, maxPercentage: 90,  grade: 'A+', gradePoint: 9.0,  description: 'Excellent' },
  { minPercentage: 71, maxPercentage: 80,  grade: 'A',  gradePoint: 8.0,  description: 'Very Good' },
  { minPercentage: 61, maxPercentage: 70,  grade: 'B+', gradePoint: 7.0,  description: 'Good' },
  { minPercentage: 51, maxPercentage: 60,  grade: 'B',  gradePoint: 6.0,  description: 'Above Average' },
  { minPercentage: 40, maxPercentage: 50,  grade: 'C',  gradePoint: 5.0,  description: 'Average' },
  { minPercentage: 0,  maxPercentage: 39,  grade: 'F',  gradePoint: 0.0,  description: 'Fail' },
];

const CSIBER_OFFICIAL_HALF_CREDIT_GRADES: GradeMapping[] = CSIBER_OFFICIAL_FULL_CREDIT_GRADES;

/*
   MARKSHEET GRADE TABLE (as printed on the supplied CSIBER marksheet)
   CONFIRMED FROM MARKSHEET ONLY — NOT FROM CURRENT OFFICIAL SYLLABUS.
   Kept for PDF reproduction.
*/
export const CSIBER_MARKSHEET_GRADE_TABLE = [
  { grade: 'S+', gradePoint: 10.0, minPct: 90, maxPct: 100, description: 'Outstanding' },
  { grade: 'S',  gradePoint: 9.5,  minPct: 85, maxPct: 89,  description: 'Excellent' },
  { grade: 'E+', gradePoint: 9.0,  minPct: 80, maxPct: 84,  description: 'Very Good' },
  { grade: 'E',  gradePoint: 8.5,  minPct: 75, maxPct: 79,  description: 'Very Good' },
  { grade: 'O+', gradePoint: 8.0,  minPct: 70, maxPct: 74,  description: 'Good' },
  { grade: 'O',  gradePoint: 7.5,  minPct: 65, maxPct: 69,  description: 'Good' },
  { grade: 'A+', gradePoint: 7.0,  minPct: 60, maxPct: 64,  description: 'Above Average' },
  { grade: 'A',  gradePoint: 6.5,  minPct: 55, maxPct: 59,  description: 'Above Average' },
  { grade: 'B+', gradePoint: 6.0,  minPct: 50, maxPct: 54,  description: 'Average' },
  { grade: 'B',  gradePoint: 5.5,  minPct: 45, maxPct: 49,  description: 'Average' },
  { grade: 'C+', gradePoint: 5.0,  minPct: 40, maxPct: 44,  description: 'Pass' },
  { grade: 'C',  gradePoint: 4.5,  minPct: 35, maxPct: 39,  description: 'Pass' },
  { grade: 'F',  gradePoint: 0.0,  minPct: 0,  maxPct: 34,  description: 'Fail' },
];

export function getOfficialGradeMapping(isHalfCredit: boolean): GradeMapping[] {
  return isHalfCredit ? CSIBER_OFFICIAL_HALF_CREDIT_GRADES : CSIBER_OFFICIAL_FULL_CREDIT_GRADES;
}

export function calculateGradeFromMarks(obtained: number, max: number, isHalfCredit: boolean = false): string {
  if (max <= 0) return 'F';
  const pct = (obtained / max) * 100;
  const mapping = getOfficialGradeMapping(isHalfCredit);
  for (const g of mapping) {
    if (pct >= g.minPercentage && pct <= g.maxPercentage) return g.grade;
  }
  return 'F';
}

export function calculateGradePointFromGrade(grade: string, isHalfCredit: boolean = false): number {
  const mapping = getOfficialGradeMapping(isHalfCredit);
  const found = mapping.find(g => g.grade === grade);
  return found?.gradePoint ?? 0;
}

export function calculateGradePointFromMarks(obtained: number, max: number, isHalfCredit: boolean = false): number {
  const grade = calculateGradeFromMarks(obtained, max, isHalfCredit);
  return calculateGradePointFromGrade(grade, isHalfCredit);
}

export function calculateTotalMarks(results: ResultItem[]): number {
  return results.reduce((sum, r) => sum + (r.marksObtained ?? 0), 0);
}

export function calculateMaxMarks(results: ResultItem[]): number {
  return results.reduce((sum, r) => sum + (r.maxMarks ?? 0), 0);
}

export function calculateTotalCredits(results: ResultItem[]): number {
  return results.reduce((sum, r) => {
    const credits = r.subject?.credits ?? r.credits ?? 0;
    return sum + credits;
  }, 0);
}

export function calculatePercentage(totalMarks: number, maxMarks: number): number {
  if (maxMarks <= 0) return 0;
  const pct = (totalMarks / maxMarks) * 100;
  return Math.round(pct * 100) / 100;
}

export function calculateSGPA(results: ResultItem[]): number | null {
  let totalGradePoints = 0;
  let totalCredits = 0;

  for (const r of results) {
    const credits = r.subject?.credits ?? r.credits ?? 0;
    if (credits <= 0) continue;

    const isHalfCredit = r.subject?.isHalfCredit ?? r.isHalfCredit ?? false;
    let gradePoint = r.gradePoint;

    if (gradePoint === undefined || gradePoint === null) {
      gradePoint = calculateGradePointFromMarks(r.marksObtained ?? 0, r.maxMarks ?? 100, isHalfCredit);
    }

    if (isNaN(gradePoint) || !isFinite(gradePoint)) continue;

    totalGradePoints += credits * gradePoint;
    totalCredits += credits;
  }

  if (totalCredits <= 0) return null;
  const sgpa = totalGradePoints / totalCredits;
  return Math.round(sgpa * 100) / 100; // round to 2 dp
}

export function calculateBacklogs(results: ResultItem[]): number {
  return results.filter(r => {
    const grade = r.grade ?? calculateGradeFromMarks(r.marksObtained ?? 0, r.maxMarks ?? 100, r.isHalfCredit ?? false);
    return grade === 'F';
  }).length;
}

/*
   PASS / ATKT / FAIL — NOT OFFICIALLY CONFIRMED FOR CURRENT BCA BATCH.
   Official syllabus states: "Rules extended by University regarding ATKT will be applicable."
   Therefore we return UNRESOLVED and do NOT hard‑code 0/1‑2/>2 as official.
*/
export function calculateResultStatus(backlogCount: number): 'PASS' | 'ATKT' | 'FAIL' | 'UNRESOLVED' {
  // Placeholder – replace when official rule is confirmed.
  return 'UNRESOLVED';
}

export function calculateRemark(grade: string): string {
  return grade === 'F' ? 'FAIL' : 'PASS';
}

export function calculateAll(results: ResultItem[]): CalculationResult {
  const totalMarks = calculateTotalMarks(results);
  const maxMarks = calculateMaxMarks(results);
  const percentage = calculatePercentage(totalMarks, maxMarks);
  const totalCredits = calculateTotalCredits(results);
  const sgpa = calculateSGPA(results);
  const backlogCount = calculateBacklogs(results);
  const status = calculateResultStatus(backlogCount);

  const subjects = results.map(r => {
    const credits = r.subject?.credits ?? r.credits ?? 0;
    const isHalfCredit = r.subject?.isHalfCredit ?? r.isHalfCredit ?? false;
    let grade = r.grade;
    let gradePoint = r.gradePoint;

    if (!grade) {
      grade = calculateGradeFromMarks(r.marksObtained ?? 0, r.maxMarks ?? 100, isHalfCredit);
    }
    if (gradePoint === undefined || gradePoint === null) {
      gradePoint = calculateGradePointFromGrade(grade, isHalfCredit);
    }

    return {
      internalMarks: r.internalMarks ?? 0,
      externalMarks: r.externalMarks ?? 0,
      marksObtained: r.marksObtained ?? 0,
      maxMarks: r.maxMarks ?? 100,
      maxInternalMarks: r.maxInternalMarks ?? 25,
      maxExternalMarks: r.maxExternalMarks ?? 75,
      grade,
      gradePoint,
      credits,
      isHalfCredit,
      remark: calculateRemark(grade),
    };
  });

  return {
    totalMarks,
    maxMarks,
    totalCredits,
    percentage,
    sgpa,
    backlogCount,
    status,
    subjects,
  };
}
