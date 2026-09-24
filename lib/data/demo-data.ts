export interface Student {
  prn: string;
  name: string;
  course: string;
  branch: string;
  semester: number;
  academicYear: string;
  email: string;
  phone: string;
}

export interface Subject {
  code: string;
  name: string;
  internalMarks: number;
  externalMarks: number;
  total: number;
  grade: string;
  status: "PASS" | "FAIL";
  maxInternal: number;
  maxExternal: number;
}

export interface Result {
  student: Student;
  subjects: Subject[];
  totalMarks: number;
  maxMarks: number;
  percentage: number;
  sgpa: number;
  status: "PASS" | "FAIL" | "ATKT";
  backlogCount: number;
}

export interface SemesterResult {
  semester: number;
  academicYear: string;
  sgpa: number;
  percentage: number;
  status: "PASS" | "FAIL" | "ATKT";
  backlogCount: number;
  subjects: Subject[];
}

// Demo student data
export const demoStudent: Student = {
  prn: "DEMO-BCA-001",
  name: "Demo Student",
  course: "BCA",
  branch: "Computer Applications",
  semester: 5,
  academicYear: "2025-26",
  email: "student@example.com",
  phone: "+91 90000 00000",
};

// Demo subjects for Semester 5
export const demoSubjects: Subject[] = [
  {
    code: "BCAS01",
    name: "Database Management Systems",
    internalMarks: 18,
    externalMarks: 52,
    total: 70,
    grade: "B+",
    status: "PASS",
    maxInternal: 25,
    maxExternal: 75,
  },
  {
    code: "BCAS02",
    name: "Java Programming",
    internalMarks: 20,
    externalMarks: 58,
    total: 78,
    grade: "A",
    status: "PASS",
    maxInternal: 25,
    maxExternal: 75,
  },
  {
    code: "BCAS03",
    name: "Computer Networks",
    internalMarks: 17,
    externalMarks: 50,
    total: 67,
    grade: "B",
    status: "PASS",
    maxInternal: 25,
    maxExternal: 75,
  },
  {
    code: "BCAS04",
    name: "Web Technologies",
    internalMarks: 19,
    externalMarks: 56,
    total: 75,
    grade: "A",
    status: "PASS",
    maxInternal: 25,
    maxExternal: 75,
  },
  {
    code: "BCAS05",
    name: "Artificial Intelligence",
    internalMarks: 22,
    externalMarks: 63,
    total: 85,
    grade: "A+",
    status: "PASS",
    maxInternal: 25,
    maxExternal: 75,
  },
];

// Calculate totals
const totalMarks = demoSubjects.reduce((sum, s) => sum + s.total, 0);
const maxMarks = demoSubjects.reduce((sum, s) => sum + s.maxInternal + s.maxExternal, 0);
const percentage = Math.round((totalMarks / maxMarks) * 10000) / 100;

// Grade to point mapping
const gradePoints: Record<string, number> = {
  "A+": 10,
  "A": 9,
  "B+": 8,
  "B": 7,
  "C+": 6,
  "C": 5,
  "D": 4,
  "F": 0,
};

const sgpa = Math.round(
  (demoSubjects.reduce((sum, s) => sum + gradePoints[s.grade] * 3, 0) / (demoSubjects.length * 3)) * 100
) / 100;

export const demoResult: Result = {
  student: demoStudent,
  subjects: demoSubjects,
  totalMarks,
  maxMarks,
  percentage,
  sgpa,
  status: "PASS",
  backlogCount: 0,
};

// All semester results for the student
export const allSemesterResults: SemesterResult[] = [
  {
    semester: 1,
    academicYear: "2023-24",
    sgpa: 8.45,
    percentage: 82.5,
    status: "PASS",
    backlogCount: 0,
    subjects: [],
  },
  {
    semester: 2,
    academicYear: "2023-24",
    sgpa: 8.12,
    percentage: 79.8,
    status: "PASS",
    backlogCount: 0,
    subjects: [],
  },
  {
    semester: 3,
    academicYear: "2024-25",
    sgpa: 7.89,
    percentage: 76.3,
    status: "PASS",
    backlogCount: 0,
    subjects: [],
  },
  {
    semester: 4,
    academicYear: "2024-25",
    sgpa: 8.01,
    percentage: 78.1,
    status: "PASS",
    backlogCount: 0,
    subjects: [],
  },
  {
    semester: 5,
    academicYear: "2025-26",
    sgpa,
    percentage,
    status: "PASS",
    backlogCount: 0,
    subjects: demoSubjects,
  },
];

// Admin dashboard stats
export const adminStats = {
  totalStudents: 2847,
  resultsPublished: 12,
  passed: 2156,
  failed: 189,
  atkt: 502,
};

// Recent activities for admin dashboard
export const recentActivities = [
  { id: 1, action: "Results published for BCA Sem 5", time: "2 hours ago", type: "success" },
  { id: 2, action: "Excel upload completed - BBA Sem 3", time: "5 hours ago", type: "info" },
  { id: 3, action: "New student batch imported", time: "1 day ago", type: "info" },
  { id: 4, action: "Revaluation results updated", time: "2 days ago", type: "warning" },
  { id: 5, action: "System backup completed", time: "3 days ago", type: "success" },
];

// Notices/announcements
export const notices = [
  {
    id: 1,
    title: "BCA Semester 5 Results Declared",
    date: "2025-01-15",
    category: "Results",
    description: "Results for BCA Semester 5 (Regular) have been published. Students can check their results using PRN.",
    priority: "high",
  },
  {
    id: 2,
    title: "Revaluation Application Window Open",
    date: "2025-01-10",
    category: "Revaluation",
    description: "Students can apply for revaluation until 25th January 2025. Fee: ₹500 per subject.",
    priority: "medium",
  },
  {
    id: 3,
    title: "Supplementary Exam Schedule Released",
    date: "2025-01-05",
    category: "Exams",
    description: "Supplementary examinations for failed subjects will commence from 15th February 2025.",
    priority: "high",
  },
  {
    id: 4,
    title: "Grade Card Distribution",
    date: "2025-01-20",
    category: "General",
    description: "Physical grade cards will be available for collection from 1st February 2025 at the exam cell.",
    priority: "low",
  },
];

// How to check result steps
export const howToSteps = [
  {
    step: 1,
    title: "Enter PRN",
    description: "Enter your Permanent Registration Number (PRN) or Roll Number in the search field.",
  },
  {
    step: 2,
    title: "Select Semester",
    description: "Choose the semester for which you want to view the result from the dropdown.",
  },
  {
    step: 3,
    title: "View Result",
    description: "Click the 'View Result' button to fetch and display your marksheet.",
  },
  {
    step: 4,
    title: "Download/Print",
    description: "Use the print or download options to save a copy of your result for future reference.",
  },
];

// Valid demo PRNs
export const validDemoPrns = ["DEMO-BCA-001", "2023BCSA002", "2023BCSA003", "2022BCOM001", "2022BBAM001"];
