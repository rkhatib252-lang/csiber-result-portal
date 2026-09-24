"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header, Footer } from "@/components/layout";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, StatCard, Table, type Column } from "@/components/ui";
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

function StudentDashboardPageContent() {
  const [student, setStudent] = useState<any>(null);
  const [prevResults, setPrevResults] = useState<Record<number, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "results" | "profile">("overview");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const stuRes = await fetch(`/api/student/me`);
        if (!stuRes.ok) {
          if (stuRes.status === 401 || stuRes.status === 403) {
            throw new Error("Unauthorized");
          }
          throw new Error("Student not found");
        }
        const stuData = await stuRes.json();
        setStudent(stuData);

        const prevRes = await fetch(`/api/result/previous/${stuData.prn}`);
        if (prevRes.ok) {
          const prevData = await prevRes.json();
          setPrevResults(prevData.semesters || {});
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // compute overall stats from real database data using centralized calculator
  const allSemesters = Object.entries(prevResults).map(([semNum, resArr]) => {
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
    const { totalMarks, maxMarks, totalCredits, percentage, sgpa, backlogCount, status } = calculateAll(calcItems);
    return { semester: sem, academicYear: "2025-26", totalMarks, maxMarks, totalCredits, percentage, sgpa, status, backlogCount };
  }).sort((a,b)=>a.semester-b.semester);

  // Get current semester from student data or latest available
  const currentSemesterNum = student?.results?.[0]?.semester?.number || (allSemesters.length > 0 ? allSemesters[allSemesters.length - 1].semester : 1);
  const currentSemester = allSemesters.find(s => s.semester === currentSemesterNum);

  // Overall stats across semesters
  // Combine all semester results for CGPA (credit-weighted across all semesters)
  const allCalcItems: ResultItem[] = Object.entries(prevResults).flatMap(([, resArr]) =>
    resArr.map((r: any) => ({
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
    }))
  );
  const overallCalc = calculateAll(allCalcItems);
  const overallPercentage = allSemesters.length ? Math.round(allSemesters.reduce((sum, s) => sum + s.percentage, 0) / allSemesters.length) : 0;
  const overallCgpa = overallCalc.sgpa; // credit-weighted across all semesters
  const totalBacklogs = allSemesters.reduce((sum, s) => sum + s.backlogCount, 0);
  const passedSemesters = allSemesters.filter(s => s.status === "PASS").length;

  const overviewIcon = (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
  const resultsIcon = (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
  const profileIcon = (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: overviewIcon },
    { id: "results" as const, label: "Results", icon: resultsIcon },
    { id: "profile" as const, label: "Profile", icon: profileIcon },
  ];

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

  const subjectsColumns: Column<SubjectUI>[] = [
    { key: "code", header: "Code", className: "font-mono font-medium text-sm" },
    { key: "name", header: "Subject", className: "text-sm" },
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

  const router = useRouter();

  useEffect(() => {
    if (error === "Unauthorized" || error === "Student not found") {
      router.push("/student/login");
    }
  }, [error, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">Loading dashboard...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !student) {
    // Redirect to login on auth errors, show error for other cases
    if (error === "Unauthorized" || error === "Student not found") {
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
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Session Expired</h2>
                <p className="text-slate-600 dark:text-slate-400 mb-6">Please log in again to access your dashboard.</p>
              </Card>
            </div>
          </main>
          <Footer />
        </div>
      );
    }
    // Show error for non-auth errors
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
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Error</h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">{error || "Failed to load dashboard"}</p>
</Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Transform current semester results to subject list for table using real DB data
  const currentSemesterResults = prevResults[currentSemesterNum] || [];
  const demoSubjects: SubjectUI[] = currentSemesterResults.map((r: any) => ({
    code: r.subject?.code || "",
    name: r.subject?.name || "",
    maxInternalMarks: r.maxInternalMarks ?? 25,
    internalMarks: r.internalMarks ?? 0,
    maxExternalMarks: r.maxExternalMarks ?? 75,
    externalMarks: r.externalMarks ?? 0,
    maxMarks: r.maxMarks || 100,
    marksObtained: r.marksObtained,
    grade: r.grade || "F",
    gradePoint: r.gradePoint ?? 0,
    credits: r.subject?.credits || 0,
    isHalfCredit: r.subject?.isHalfCredit ?? false,
    remark: r.remark || (r.grade === 'F' ? 'FAIL' : 'PASS'),
  }));

  // Centralized calculation for current semester
  const calcItems: ResultItem[] = demoSubjects.map(s => ({
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
  const { totalMarks: currentTotalMarks, maxMarks: currentMaxMarks, totalCredits: currentTotalCredits, percentage: currentPercentage, sgpa: currentSgpa, backlogCount: currentBacklogCount, status: currentStatus } = calculateAll(calcItems);

  // Build UI student object from real database data
  const uiStudent = {
    ...student,
    course: student.department || "BCA",
    branch: student.department || "Computer Science",
    semester: currentSemesterNum,
    academicYear: student.academicYear || "2025-26",
    email: student.email || "student@csiber.edu",
    phone: student.phone || "ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â",
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="page-header">
          <div className="container">
            <div className="max-w-6xl">
              <nav className="flex items-center gap-2 text-sm text-primary-100 mb-4" aria-label="Breadcrumb">
                <Link href="/" className="hover:text-white transition-colors">Home</Link>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                <span className="text-white">Student Dashboard</span>
              </nav>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold">Student Dashboard</h1>
                  <p className="text-primary-100 mt-1">Welcome back, {uiStudent.name}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-800">
                    {uiStudent.course} - Semester {uiStudent.semester}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container section">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-200 dark:border-slate-700" role="tablist" aria-label="Dashboard sections">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`${tab.id}-panel`}
                  id={`${tab.id}-tab`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-t-xl text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border-b-2 border-primary-600 -mb-px"
                      : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === "overview" && (
              <div id="overview-panel" role="tabpanel" aria-labelledby="overview-tab" className="animate-fade-in">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <StatCard
                    label="Current SGPA"
                    value={currentSemester?.sgpa !== null && currentSemester?.sgpa !== undefined ? currentSemester.sgpa.toFixed(2) : "ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â"}
                    change={`Semester ${uiStudent.semester}`}
                    icon={<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    variant="primary"
                  />
                  <StatCard
                    label="Overall Percentage"
                    value={`${overallPercentage}%`}
                    change={`Across ${passedSemesters}/${allSemesters.length} semesters`}
                    changeType="positive"
                    icon={<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
                    variant="success"
                  />
                  <StatCard
                    label="Overall CGPA"
                    value={overallCgpa !== null ? overallCgpa.toFixed(2) : "ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â"}
                    change="Cumulative"
                    icon={<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
                    variant="info"
                  />
                  <StatCard
                    label="Backlogs"
                    value={totalBacklogs}
                    change={totalBacklogs === 0 ? "All clear!" : "Pending"}
                    changeType={totalBacklogs === 0 ? "positive" : "negative"}
                    icon={<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
                    variant={totalBacklogs === 0 ? "success" : "warning"}
                  />
                </div>

                <div className="grid lg:grid-cols-3 gap-6 mb-8">
                  <Card variant="elevated" padding="lg" className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>Current Semester Result</CardTitle>
                      <CardDescription>Semester {uiStudent.semester} ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ {uiStudent.academicYear}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {currentSemester && demoSubjects.length > 0 ? (
                        <Table
                          columns={subjectsColumns}
                          data={demoSubjects}
                          keyExtractor={(row) => row.code}
                          striped
                          hoverable
                          compact
                        />
                      ) : (
                        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                          <svg className="h-12 w-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p>Detailed subject marks for current semester</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card variant="elevated" padding="lg">
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Link href={`/result?prn=${student.prn}&semester=${currentSemesterNum}`}>
                        <Button variant="outline" className="w-full justify-start gap-3">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          View Current Result
                        </Button>
                      </Link>
                      <Link href="/search">
                        <Button variant="outline" className="w-full justify-start gap-3">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                          Check Another Semester
                        </Button>
                      </Link>
                      <Link href={`/result?prn=${student.prn}&semester=${currentSemesterNum}`}>
                        <Button variant="outline" className="w-full justify-start gap-3">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                          Download Result PDF
                        </Button>
                      </Link>
                      <Link href="#">
                        <Button variant="outline" className="w-full justify-start gap-3">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.035-.586 1.414L2 17h5v5a2 2 0 002 2h10a2 2 0 002-2v-5h5z" /></svg>
                          Apply for Revaluation
                        </Button>
                      </Link>
                      <Link href="#">
                        <Button variant="outline" className="w-full justify-start gap-3">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                          Request Transcript
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </div>

                <Card variant="default" padding="lg">
                  <CardHeader>
                    <CardTitle>Academic Progress</CardTitle>
                    <CardDescription>Your semester-wise performance overview</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-700">
                            <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Semester</th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Academic Year</th>
                            <th className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">SGPA</th>
                            <th className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">Percentage</th>
                            <th className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">Status</th>
                            <th className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">Backlogs</th>
                            <th className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                          {allSemesters.map((sem) => (
                            <tr key={sem.semester} className={sem.semester === uiStudent.semester ? "bg-primary-50 dark:bg-primary-900/20" : ""}>
                              <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">Semester {sem.semester}</td>
                              <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{sem.academicYear}</td>
                              <td className="px-4 py-3 text-center font-mono font-semibold text-slate-900 dark:text-white">{sem.sgpa !== null ? sem.sgpa.toFixed(2) : "ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â"}</td>
                              <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">{sem.percentage}%</td>
                              <td className="px-4 py-3 text-center">
                                <Badge variant={
                                  sem.status === "PASS" ? "success" :
                                  sem.status === "FAIL" ? "danger" : "warning"
                                } size="sm">
                                  {sem.status}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">{sem.backlogCount}</td>
                              <td className="px-4 py-3 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <Link href={`/result?prn=${student.prn}&semester=${sem.semester}`}>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label={`View Semester ${sem.semester} result`}>
                                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7z" /></svg>
                                    </Button>
                                  </Link>
                                  <Link href={`/api/result/${student.prn}/${sem.semester}/pdf`}>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label={`Download Semester ${sem.semester} result`}>
                                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                    </Button>
                                  </Link>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "results" && (
              <div id="results-panel" role="tabpanel" aria-labelledby="results-tab" className="animate-fade-in">
                <div className="grid lg:grid-cols-3 gap-6">
                  <Card variant="elevated" padding="lg" className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>Current Semester Marks Detail</CardTitle>
                      <CardDescription>Semester {uiStudent.semester} - {uiStudent.academicYear}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table
                        columns={subjectsColumns}
                        data={demoSubjects}
                        keyExtractor={(row) => row.code}
                        striped
                        hoverable
                      />
                    </CardContent>
                  </Card>

                  <Card variant="elevated" padding="lg">
                    <CardHeader>
                      <CardTitle>Result Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Total Marks</span>
                          <span className="font-bold text-lg text-slate-900 dark:text-white">{currentTotalMarks} / {currentMaxMarks}</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <div className="bg-primary-600 h-2 rounded-full transition-all duration-500" style={{ width: `${currentPercentage}%` }} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-center">
                          <p className="text-3xl font-bold text-slate-900 dark:text-white">{currentPercentage}%</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Percentage</p>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-center">
                          <p className="text-3xl font-bold text-slate-900 dark:text-white">{currentSgpa !== null ? currentSgpa.toFixed(2) : "ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â"}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">SGPA</p>
                        </div>
                      </div>
                      <div className={`p-4 rounded-xl text-center border-2 ${
                        currentStatus === "PASS" ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800" :
                        currentStatus === "FAIL" ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800" :
                        "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800"
                      }`}>
                        <span className={`text-2xl font-bold ${
                          currentStatus === "PASS" ? "text-green-700 dark:text-green-400" :
                          currentStatus === "FAIL" ? "text-red-700 dark:text-red-400" :
                          "text-amber-700 dark:text-amber-400"
                        }`}>
                          {currentStatus}
                        </span>
                        <p className={`text-sm mt-1 ${
                          currentStatus === "PASS" ? "text-green-600 dark:text-green-400" :
                          currentStatus === "FAIL" ? "text-red-600 dark:text-red-400" :
                          "text-amber-600 dark:text-amber-400"
                        }`}>
                          {currentBacklogCount === 0 ? "No backlogs" : `${currentBacklogCount} backlog${currentBacklogCount > 1 ? 's' : ''}`}
                        </p>
                      </div>
                      <Link href={`/result?prn=${student.prn}&semester=${currentSemesterNum}`}>
                        <Button className="w-full" size="lg">View Full Result</Button>
                      </Link>
                    </CardContent>
                  </Card>
                </div>

                <div className="mt-8">
                  <Card variant="default" padding="lg">
                    <CardHeader>
                      <CardTitle>All Semester Results</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-700">
                              <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Semester</th>
                              <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Academic Year</th>
                              <th className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">SGPA</th>
                              <th className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">Percentage</th>
                              <th className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">Status</th>
                              <th className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">Backlogs</th>
                              <th className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">View</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {allSemesters.map((sem) => (
                              <tr key={sem.semester} className={sem.semester === uiStudent.semester ? "bg-primary-50 dark:bg-primary-900/20" : ""}>
                                <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">Semester {sem.semester}</td>
                                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{sem.academicYear}</td>
                                <td className="px-4 py-3 text-center font-mono font-semibold text-slate-900 dark:text-white">{sem.sgpa !== null ? sem.sgpa.toFixed(2) : "ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â"}</td>
                                <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">{sem.percentage}%</td>
                                <td className="px-4 py-3 text-center">
                                  <Badge variant={
                                    sem.status === "PASS" ? "success" :
                                    sem.status === "FAIL" ? "danger" : "warning"
                                  } size="sm">
                                    {sem.status}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">{sem.backlogCount}</td>
                                <td className="px-4 py-3 text-center">
                                  <Link href={`/result?prn=${student.prn}&semester=${sem.semester}`}>
                                    <Button variant="outline" size="sm">View</Button>
                                  </Link>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {activeTab === "profile" && (
              <div id="profile-panel" role="tabpanel" aria-labelledby="profile-tab" className="animate-fade-in">
                <div className="grid lg:grid-cols-3 gap-6">
                  <Card variant="elevated" padding="lg" className="lg:col-span-1">
                    <div className="text-center">
                      <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-4xl font-bold mx-auto mb-4">
                        {uiStudent.name.charAt(0)}{uiStudent.name.split(' ')[1]?.charAt(0) || ''}
                      </div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">{uiStudent.name}</h2>
                      <p className="text-slate-500 dark:text-slate-400 mt-1">{uiStudent.course} - {uiStudent.branch}</p>
                      <div className="mt-4 flex flex-wrap justify-center gap-2">
                        <Badge variant="outline">Semester {uiStudent.semester}</Badge>
                        <Badge variant="outline">{uiStudent.academicYear}</Badge>
                      </div>
                    </div>
                    <div className="mt-6 border-t border-slate-200 dark:border-slate-700 pt-6 space-y-4">
                      <div>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">PRN</p>
                        <p className="font-mono text-slate-900 dark:text-white">{uiStudent.prn}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email</p>
                        <p className="text-slate-600 dark:text-slate-400">{uiStudent.email}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Phone</p>
                        <p className="text-slate-600 dark:text-slate-400">{uiStudent.phone}</p>
                      </div>
                    </div>
                  </Card>

                  <Card variant="elevated" padding="lg" className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>Academic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="grid sm:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Course Details</h3>
                        <dl className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <dt className="text-slate-600 dark:text-slate-400">Program</dt>
                            <dd className="font-medium text-slate-900 dark:text-white">{uiStudent.course}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-slate-600 dark:text-slate-400">Branch</dt>
                            <dd className="font-medium text-slate-900 dark:text-white">{uiStudent.branch}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-slate-600 dark:text-slate-400">Current Semester</dt>
                            <dd className="font-medium text-slate-900 dark:text-white">Semester {uiStudent.semester}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-slate-600 dark:text-slate-400">Academic Year</dt>
                            <dd className="font-medium text-slate-900 dark:text-white">{uiStudent.academicYear}</dd>
                          </div>
                        </dl>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Performance Summary</h3>
                        <dl className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <dt className="text-slate-600 dark:text-slate-400">Semesters Completed</dt>
                            <dd className="font-medium text-slate-900 dark:text-white">{passedSemesters} / {allSemesters.length}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-slate-600 dark:text-slate-400">Cumulative SGPA</dt>
                            <dd className="font-medium text-slate-900 dark:text-white">{overallCgpa !== null ? overallCgpa.toFixed(2) : "ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â"}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-slate-600 dark:text-slate-400">Overall Percentage</dt>
                            <dd className="font-medium text-slate-900 dark:text-white">{overallPercentage}%</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-slate-600 dark:text-slate-400">Total Backlogs</dt>
                            <dd className={`font-medium ${totalBacklogs === 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                              {totalBacklogs}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function StudentDashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">Loading dashboard...</p>
          </div>
        </main>
        <Footer />
      </div>
    }>
      <StudentDashboardPageContent />
    </Suspense>
  );
}
