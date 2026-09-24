"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Header, Footer } from "@/components/layout";
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription, Badge, Table, type Column } from "@/components/ui";
import { calculateAll, ResultItem } from "@/lib/result-calculator";

interface SubjectUI {
  code: string;
  name: string;
  maxInternalMarks: number;
  internalMarks: number;
  maxExternalMarks: number;
  externalMarks: number;
  maxMarks: number;
  marksObtained: number;
  grade: string;
  gradePoint: number;
  credits: number;
  isHalfCredit: boolean;
  remark: string;
}

function ResultContent() {
  const searchParams = useSearchParams();
  const [result, setResult] = useState<any | null>(null);
  const [prevResults, setPrevResults] = useState<Record<number, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [printing, setPrinting] = useState(false);
  const [studentPrn, setStudentPrn] = useState<string | null>(null);

  const router = useRouter();
  const semesterParam = searchParams.get("semester");

  useEffect(() => {
    const fetchResult = async () => {
      setLoading(true);
      setError(null);

      // Always get authenticated student's PRN
      let effectivePrn: string | null = null;
      try {
        const meRes = await fetch('/api/student/me');
        if (!meRes.ok) {
          // Not authenticated or not a student
          router.push('/student/login');
          return;
        }
        const meData = await meRes.json();
        effectivePrn = meData.prn;
        setStudentPrn(effectivePrn);
      } catch {
        router.push('/student/login');
        return;
      }

      let effectiveSemester = semesterParam ? parseInt(semesterParam, 10) : null;
      if (!effectiveSemester) {
        effectiveSemester = 5;
      }

      try {
        const res = await fetch(`/api/result/${effectivePrn}/${effectiveSemester}`);
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to fetch result");
        }
        const data = await res.json();
        setResult(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }

      try {
        const prevRes = await fetch(`/api/result/previous/${effectivePrn}`);
        if (prevRes.ok) {
          const prevData = await prevRes.json();
          setPrevResults(prevData.semesters || {});
        }
      } catch {}
    };

    fetchResult();
  }, [semesterParam, router]);

  const handlePrint = () => {
    setPrinting(true);
    window.print();
    setTimeout(() => setPrinting(false), 1000);
  };

  const handleDownload = async () => {
    const effectivePrn = studentPrn;
    const effectiveSemester = semesterParam ? parseInt(semesterParam, 10) : 5;
    if (!effectivePrn) return;
    setPrinting(true);
    try {
      const res = await fetch(`/api/result/${effectivePrn}/${effectiveSemester}/pdf`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `CSIBER_Result_${effectivePrn}_Sem_${effectiveSemester}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        alert('Failed to generate PDF');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to generate PDF');
    } finally {
      setPrinting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">Fetching your result...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center section">
          <div className="container text-center">
            <Card variant="elevated" padding="xl" className="max-w-md mx-auto">
              <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mx-auto w-fit mb-4">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Result Not Found</h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">{error || "Unable to fetch result. Please try again."}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/search">
                  <Button variant="primary" className="w-full sm:w-auto">Search Again</Button>
                </Link>
                <Link href="/">
                  <Button variant="outline" className="w-full sm:w-auto">Back to Home</Button>
                </Link>
              </div>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const firstRes = result.results[0];
  const effectivePrn = studentPrn || firstRes?.prn || "";

  const student = {
    name: firstRes?.student?.name || "Unknown",
    prn: effectivePrn,
    course: firstRes?.student?.department || "BCA",
    branch: firstRes?.student?.department || "Computer Applications",
    semester: result.semester,
    academicYear: "2025-26",
  };

  const subjects: (SubjectUI & { uniqueKey: string })[] = result.results.map((r: any, idx: number) => ({
    code: r.subject?.code || "",
    name: r.subject?.name || "",
    maxInternalMarks: r.maxInternalMarks ?? 25,
    internalMarks: r.internalMarks ?? 0,
    maxExternalMarks: r.maxExternalMarks ?? 75,
    externalMarks: r.externalMarks ?? 0,
    maxMarks: r.maxMarks ?? 100,
    marksObtained: r.marksObtained,
    grade: r.grade || "F",
    gradePoint: r.gradePoint ?? 0,
    credits: r.subject?.credits ?? 0,
    isHalfCredit: r.subject?.isHalfCredit ?? false,
    remark: r.remark || (r.grade === 'F' ? 'FAIL' : 'PASS'),
    uniqueKey: r.subject?.code || `subject-${idx}`,
  }));

  const calcItems: ResultItem[] = subjects.map(s => ({
    internalMarks: s.internalMarks,
    externalMarks: s.externalMarks,
    marksObtained: s.marksObtained,
    maxMarks: s.maxMarks,
    maxInternalMarks: s.maxInternalMarks,
    maxExternalMarks: s.maxExternalMarks,
    grade: s.grade,
    gradePoint: s.gradePoint,
    credits: s.credits,
    isHalfCredit: s.isHalfCredit,
  }));
  const { totalMarks, maxMarks, totalCredits, percentage, sgpa, backlogCount, status, subjects: calcSubjects } = calculateAll(calcItems);

  const statusColors = {
    PASS: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800",
    FAIL: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
    ATKT: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    UNRESOLVED: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  };

  const gradeColors: Record<string, string> = {
    "O": "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
    "A+": "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    "A": "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
    "B+": "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
    "B": "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
    "C": "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400",
    "P": "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
    "F": "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
  };

  const columns: Column<SubjectUI>[] = [
    { key: "code", header: "Subject Code", className: "font-mono font-medium text-sm" },
    { key: "name", header: "Subject Name", className: "text-sm" },
    { key: "maxInternalMarks", header: "Max Int.", className: "text-center text-sm", headerClassName: "text-center text-sm" },
    { key: "internalMarks", header: "Int. Obt.", className: "text-center font-medium text-sm", headerClassName: "text-center text-sm" },
    { key: "maxExternalMarks", header: "Max Ext.", className: "text-center text-sm", headerClassName: "text-center text-sm" },
    { key: "externalMarks", header: "Ext. Obt.", className: "text-center font-medium text-sm", headerClassName: "text-center text-sm" },
    { key: "maxMarks", header: "Max Total", className: "text-center text-sm", headerClassName: "text-center text-sm" },
    { key: "marksObtained", header: "Total Obt.", className: "text-center font-semibold text-sm", headerClassName: "text-center text-sm" },
    {
      key: "grade",
      header: "Grade",
      headerClassName: "text-center text-sm",
      className: "text-center",
      render: (row) => (
        <Badge variant="outline" className={gradeColors[row.grade] || "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"}>
          {row.grade}
        </Badge>
      ),
    },
    { key: "gradePoint", header: "Gr. Pt.", className: "text-center font-mono text-sm", headerClassName: "text-center text-sm" },
    { key: "credits", header: "Credits", className: "text-center text-sm", headerClassName: "text-center text-sm" },
    { key: "remark", header: "Remark", className: "text-center text-sm", headerClassName: "text-center text-sm",
      render: (row) => (
        <Badge variant={row.remark === 'PASS' ? 'success' : 'danger'} size="sm">
          {row.remark}
        </Badge>
      ),
    },
  ];

  const allSemesterResults = Object.entries(prevResults).map(([semNum, resArr]) => {
    const sem = parseInt(semNum, 10);
    const calcItems: ResultItem[] = resArr.map((r: any) => ({
      internalMarks: r.internalMarks,
      externalMarks: r.externalMarks,
      marksObtained: r.marksObtained,
      maxMarks: r.maxMarks,
      maxInternalMarks: r.maxInternalMarks,
      maxExternalMarks: r.maxExternalMarks,
      grade: r.grade ?? undefined,
      gradePoint: r.gradePoint ?? undefined,
      credits: r.subject?.credits ?? undefined,
      isHalfCredit: r.subject?.isHalfCredit ?? undefined,
    }));
    const { totalMarks: total, maxMarks: max, percentage: pct, sgpa: semSgpa, totalCredits: totCredits, backlogCount, status: semStatus } = calculateAll(calcItems);
    return { semester: sem, academicYear: "2025-26", totalMarks: total, maxMarks: max, totalCredits: totCredits, percentage: pct, sgpa: semSgpa, status: semStatus, backlogCount };
  }).sort((a,b)=>a.semester-b.semester);

  const showCompleteMarksheet = allSemesterResults.length > 1;

  const handleDownloadComplete = async () => {
    const effectivePrn = studentPrn;
    if (!effectivePrn) return;
    setPrinting(true);
    try {
      const res = await fetch(`/api/result/${effectivePrn}/pdf`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `CSIBER_Complete_Marksheet_${effectivePrn}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        alert('Failed to generate complete marksheet PDF');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to generate complete marksheet PDF');
    } finally {
      setPrinting(false);
    }
  };

  const resultSummary = {
    totalMarks,
    maxMarks,
    totalCredits,
    percentage,
    sgpa,
    status,
    backlogCount,
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="page-header no-print">
          <div className="container">
            <div className="max-w-4xl">
              <nav className="flex items-center gap-2 text-sm text-primary-100 mb-4" aria-label="Breadcrumb">
                <Link href="/" className="hover:text-white transition-colors">Home</Link>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                <Link href="/search" className="hover:text-white transition-colors">Search</Link>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                <span className="text-white">Result</span>
              </nav>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold">Semester {student.semester} Result</h1>
                  <p className="text-primary-100 mt-1">{student.course} • {student.branch} • Academic Year {student.academicYear}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className={statusColors[resultSummary.status as keyof typeof statusColors] || "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"} size="lg">
                    {resultSummary.status}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container section print-only result-header-print">
          <div className="text-center border-b-2 border-slate-900 pb-6 mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white font-bold text-xl">C</div>
              <div>
                <div className="text-2xl font-bold">CSIBER Institute, Kolhapur</div>
                <div className="text-sm">Chhatrapati Shahu Institute of Business Education and Research</div>
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2">Semester {student.semester} Result - {student.academicYear}</h1>
            <p className="text-slate-600">{student.course} • {student.branch}</p>
          </div>
        </div>

        <div className="container section">
          <div className="max-w-6xl mx-auto">
            <Card variant="elevated" padding="lg" className="mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-2xl font-bold">
                  {student.name.charAt(0)}{student.name.split(' ')[1]?.charAt(0) || ''}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">{student.name}</h2>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-600 dark:text-slate-400">
                    <span><strong>PRN:</strong> {student.prn}</span>
                    <span><strong>Course:</strong> {student.course} - {student.branch}</span>
                    <span><strong>Semester:</strong> {student.semester}</span>
                    <span><strong>Academic Year:</strong> {student.academicYear}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Link href="/search" className="no-print">
                    <Button variant="outline">Back to Search</Button>
                  </Link>
                  <Button variant="outline" onClick={handlePrint} className="no-print">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                    Print
                  </Button>
                  <Button variant="primary" onClick={handleDownload} className="no-print">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Download PDF
                  </Button>
                  {showCompleteMarksheet && (
                    <Button variant="secondary" onClick={handleDownloadComplete} className="no-print">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      Download Complete Marksheet
                    </Button>
                  )}
                </div>
              </div>
            </Card>

            <Card variant="default" padding="lg" className="mb-6">
              <CardHeader>
                <CardTitle>Subject-wise Marks</CardTitle>
                <CardDescription>Internal Assessment (Max 25) + End-Semester Exam (Max 75) = Total (Max 100)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table
                    columns={columns}
                    data={subjects}
                    keyExtractor={(row) => row.uniqueKey}
                    striped
                    hoverable
                    caption={`Semester ${student.semester} Marks for ${student.name} (${student.prn})`}
                  />
                </div>
              </CardContent>
            </Card>

            <Card variant="outlined" padding="lg" className="mb-6">
              <CardHeader>
                <CardTitle>Semester Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-center">
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalMarks} / {maxMarks}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Total Marks</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-center">
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{percentage.toFixed(2)}%</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Percentage</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-center">
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{sgpa !== null ? sgpa.toFixed(2) : "—"}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">SGPA</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-center">
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalCredits}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Total Credits</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-center">
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{backlogCount}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Backlogs</p>
                  </div>
<div className={`p-4 rounded-xl text-center border-2 ${
                    status === "PASS" ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800" :
                    status === "FAIL" ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800" :
                    status === "ATKT" ? "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800" :
                    "bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700"
                  }`}>
                    <span className={`text-2xl font-bold ${
                      status === "PASS" ? "text-green-700 dark:text-green-400" :
                      status === "FAIL" ? "text-red-700 dark:text-red-400" :
                      status === "ATKT" ? "text-amber-700 dark:text-amber-400" :
                      "text-slate-700 dark:text-slate-300"
                    }`}>
                      {status}
                    </span>
                    <p className={`text-sm mt-1 ${
                      status === "PASS" ? "text-green-600 dark:text-green-400" :
                      status === "FAIL" ? "text-red-600 dark:text-red-400" :
                      status === "ATKT" ? "text-amber-600 dark:text-amber-400" :
                      "text-slate-600 dark:text-slate-400"
                    }`}>
                      {backlogCount === 0 ? "No backlogs" : `${backlogCount} backlog${backlogCount > 1 ? 's' : ''}`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="outlined" padding="lg" className="mb-6">
              <CardHeader>
                <CardTitle>CSIBER Grading System Reference</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="px-4 py-2 text-center font-semibold text-slate-700 dark:text-slate-300">Grade</th>
                        <th className="px-4 py-2 text-center font-semibold text-slate-700 dark:text-slate-300">Grade Point</th>
                        <th className="px-4 py-2 text-center font-semibold text-slate-700 dark:text-slate-300">Marks Range (%)</th>
                        <th className="px-4 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Description</th>
                        <th className="px-4 py-2 text-center font-semibold text-slate-700 dark:text-slate-300">Half Credit<br/>Grade Point</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {[
                        { grade: "O", point: 10, range: "80-100", desc: "Outstanding", halfPoint: 10 },
                        { grade: "A+", point: 9, range: "70-79", desc: "Excellent", halfPoint: 9 },
                        { grade: "A", point: 8, range: "60-69", desc: "Very Good", halfPoint: 8 },
                        { grade: "B+", point: 7, range: "55-59", desc: "Good", halfPoint: 7 },
                        { grade: "B", point: 6, range: "50-54", desc: "Above Average", halfPoint: 6 },
                        { grade: "C", point: 5, range: "45-49", desc: "Average", halfPoint: 5 },
                        { grade: "P", point: 4, range: "40-44", desc: "Pass", halfPoint: 4 },
                        { grade: "F", point: 0, range: "0-39", desc: "Fail", halfPoint: 0 },
                      ].map((g) => (
                        <tr key={g.grade} className={g.grade === 'F' ? 'bg-red-50 dark:bg-red-900/20' : ''}>
                          <td className="px-4 py-2 text-center">
                            <Badge variant="outline" className={gradeColors[g.grade] || "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"}>
                              {g.grade}
                            </Badge>
                          </td>
                          <td className="px-4 py-2 text-center font-mono font-semibold">{g.point}</td>
                          <td className="px-4 py-2 text-center">{g.range}%</td>
                          <td className="px-4 py-2 text-slate-600 dark:text-slate-400">{g.desc}</td>
                          <td className="px-4 py-2 text-center font-mono">{g.halfPoint}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card variant="default" padding="lg" className="mb-6">
              <CardHeader>
                <CardTitle>SGPA & CGPA Formula</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm">
                  <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 font-mono">
                    <p className="font-semibold">SGPA = Σ (Cᵢ × Gᵢ) / Σ Cᵢ</p>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                      Where Cᵢ = Credit of i-th subject, Gᵢ = Grade Point of i-th subject
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 font-mono">
                    <p className="font-semibold">CGPA = Σ (Cᵢ × Gᵢ) / Σ Cᵢ (across all semesters)</p>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                      Cumulative Grade Point Average calculated over all completed semesters
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="default" padding="lg">
              <CardHeader>
                <CardTitle>All Semester Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Semester</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Academic Year</th>
                        <th className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">Total Credits</th>
                        <th className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">SGPA</th>
                        <th className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">Percentage</th>
                        <th className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">Status</th>
                        <th className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">Backlogs</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {allSemesterResults.map((sem) => (
                        <tr key={sem.semester} className={sem.semester === student.semester ? "bg-primary-50 dark:bg-primary-900/20" : ""}>
                          <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">Semester {sem.semester}</td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{sem.academicYear}</td>
                          <td className="px-4 py-3 text-center font-mono text-slate-900 dark:text-white">{sem.totalCredits}</td>
                          <td className="px-4 py-3 text-center font-mono font-semibold text-slate-900 dark:text-white">{sem.sgpa !== null ? sem.sgpa.toFixed(2) : "—"}</td>
                          <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">{sem.percentage.toFixed(2)}%</td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant={
                              sem.status === "PASS" ? "success" :
                              sem.status === "FAIL" ? "danger" :
                              sem.status === "ATKT" ? "warning" : "outline"
                            } size="sm">
                              {sem.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">{sem.backlogCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400 no-print">
              <p>This is a computer-generated marksheet for demo purposes.</p>
              <p className="mt-1">For official grade card, contact the Examination Cell, CSIBER Institute, Kolhapur.</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">Fetching your result...</p>
          </div>
        </main>
        <Footer />
      </div>
    }>
      <ResultContent />
    </Suspense>
  );
}
