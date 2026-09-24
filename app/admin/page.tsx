"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Header, Footer } from "@/components/layout";
import { recentActivities } from "@/lib/data/demo-data";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Table,
  StatCard,
  BarChart,
  LineChart,
  DoughnutChart,
  Input,
  Select,
  type Column,
} from "@/components/ui";

interface AdminResult {
  id: string;
  prn: string;
  student: { name: string; department: string | null; email: string | null };
  subject: { code: string; name: string; credits: number };
  semester: { number: number; name: string };
  marksObtained: number;
  maxMarks: number;
  grade: string | null;
  gradePoint: number | null;
  remark: string | null;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "results" | "analytics" | "upload" | "settings">("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCourse, setFilterCourse] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSemester, setFilterSemester] = useState("");
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Results data state
  const [results, setResults] = useState<AdminResult[]>([]);
  const [loadingResults, setLoadingResults] = useState(true);
  const [resultsError, setResultsError] = useState<string | null>(null);

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    const allowed = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'application/csv'];
    if (!allowed.includes(file.type)) {
      setError('Unsupported file type. Use .xlsx, .xls, or .csv');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large (max 5 MB)');
      return;
    }
    setSelectedFile(file);
    setError('');
    setPreviewData(null);
    setImportResult(null);
  };

  const handleValidate = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError('');
    const formData = new FormData();
    formData.append('file', selectedFile);
    try {
      const res = await fetch('/api/admin/results/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Validation failed');
      setPreviewData(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    setImportLoading(true);
    setImportResult(null);
    const formData = new FormData();
    formData.append('file', selectedFile);
    try {
      const res = await fetch('/api/admin/results/import', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');
      setImportResult({ success: true, ...data });
      // refresh stats after import
      fetch('/api/admin/stats')
        .then(r => r.ok && r.json())
        .then(d => setStats(d));
    } catch (e: any) {
      setImportResult({ success: false, error: e.message });
    } finally {
      setImportLoading(false);
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setPreviewData(null);
    setError('');
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const downloadTemplate = () => {
    const headers = [
      'PRN','Student Name','Course','Semester','Subject Code','Subject Name',
      'Max Marks','Marks Obtained','Internal Marks','External Marks',
      'Max Internal Marks','Max External Marks','Credits','Grade','Grade Point','Half Credit'
    ];
    const rows = [
      ['DEMO-BCA-001','Demo Student','BCA','5','BCAS01','Database Management Systems','100','70','18','52','25','75','3','B+','8','FALSE'],
    ];
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'results_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const fetchResults = async () => {
    setLoadingResults(true);
    setResultsError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (filterSemester) params.set('semester', filterSemester);
      if (filterCourse) params.set('department', filterCourse);
      params.set('limit', '100');

      const res = await fetch(`/api/admin/results?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch results');
      const data = await res.json();
      setResults(data.results || []);
    } catch (e: any) {
      setResultsError(e.message);
    } finally {
      setLoadingResults(false);
    }
  };

  useEffect(() => {
    fetch("/api/admin/stats")
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => { setStats(data); setLoadingStats(false); })
      .catch(() => setLoadingStats(false));
  }, []);

  useEffect(() => {
    fetchResults();
  }, [searchQuery, filterCourse, filterStatus, filterSemester]);

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
    )},
    { id: "results" as const, label: "Results Management", icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
    )},
    { id: "analytics" as const, label: "Analytics", icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
    )},
    { id: "upload" as const, label: "Upload Results", icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
    )},
    { id: "settings" as const, label: "Settings", icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
    )},
  ];

  const courseOptions = [
    { value: "", label: "All Courses" },
    { value: "BCA", label: "BCA" },
    { value: "BCom", label: "BCom" },
    { value: "BBA", label: "BBA" },
  ];

  const statusOptions = [
    { value: "", label: "All Statuses" },
    { value: "Published", label: "Published" },
    { value: "Draft", label: "Draft" },
    { value: "Pending", label: "Pending" },
  ];

  const semesterOptions = [
    { value: "", label: "All Semesters" },
    ...Array.from({ length: 6 }, (_, i) => i + 1).map((s) => ({ value: String(s), label: `Semester ${s}` })),
  ];

  // Transform results for display - group by student/semester for summary view
  const getResultSummary = (results: AdminResult[]) => {
    const summaryMap = new Map<string, {
      id: string;
      prn: string;
      name: string;
      course: string;
      semester: number;
      status: string;
      publishedDate: string;
      totalStudents: number;
      passPercent: number;
    }>();

    results.forEach(r => {
      const key = `${r.prn}-${r.semester.number}`;
      if (!summaryMap.has(key)) {
        summaryMap.set(key, {
          id: r.id,
          prn: r.prn,
          name: r.student.name,
          course: r.student.department || "Unknown",
          semester: r.semester.number,
          status: r.remark === "PASS" ? "Published" : r.remark === "FAIL" ? "Published" : "Draft",
          publishedDate: new Date(r.createdAt).toLocaleDateString('en-IN'),
          totalStudents: 0,
          passPercent: 0,
        });
      }
    });

    return Array.from(summaryMap.values());
  };

  const displayResults = getResultSummary(results);

  const filteredResults = displayResults.filter((r) => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.prn.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCourse = !filterCourse || r.course === filterCourse;
    const matchesStatus = !filterStatus || r.status === filterStatus;
    const matchesSemester = !filterSemester || r.semester === parseInt(filterSemester);
    return matchesSearch && matchesCourse && matchesStatus && matchesSemester;
  });

  const statusColors: Record<string, string> = {
    Published: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800",
    Draft: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    Pending: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  };

  const resultColumns: Column<typeof displayResults[0]>[] = [
    { key: "id", header: "Result ID", className: "font-mono font-medium" },
    { key: "prn", header: "PRN", className: "font-mono text-sm" },
    { key: "name", header: "Student Name" },
    { key: "course", header: "Course", render: (row) => <Badge variant="outline">{row.course}</Badge> },
    { key: "semester", header: "Semester", className: "text-center", headerClassName: "text-center", render: (row) => `Sem ${row.semester}` },
    { key: "status", header: "Status", className: "text-center", headerClassName: "text-center",
      render: (row) => <Badge variant="outline" className={statusColors[row.status]}>{row.status}</Badge> },
    { key: "publishedDate", header: "Published Date", className: "text-center", headerClassName: "text-center" },
    { key: "actions", header: "Actions", className: "text-center", headerClassName: "text-center",
      render: (row) => (
        <div className="flex items-center justify-center gap-1">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label={`View ${row.id}`}>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7z" /></svg>
          </Button>
        </div>
      ) },
  ];

  // Compute chart data from real results
  const courseDistribution = results.reduce((acc, r) => {
    const course = r.student.department || "Unknown";
    acc[course] = (acc[course] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const barChartData = Object.entries(courseDistribution).map(([label, value], index) => ({
    label,
    value,
    color: ["#2563eb", "#059669", "#d97706", "#7c3aed", "#dc2626", "#0891b2"][index % 6],
  }));

  const passFailData = [
    { label: "Pass", value: stats?.passed ?? 0, color: "#22c55e" },
    { label: "ATKT", value: stats?.atkt ?? 0, color: "#f59e0b" },
    { label: "Fail", value: stats?.failed ?? 0, color: "#ef4444" },
  ];

  // Compute semester-wise pass percentage from results
  const semesterPassData = results.reduce((acc, r) => {
    const sem = r.semester.number;
    if (!acc[sem]) acc[sem] = { pass: 0, total: 0 };
    acc[sem].total++;
    if (r.remark === 'PASS' || r.grade === 'O' || r.grade === 'A+' || r.grade === 'A' || r.grade === 'B+' || r.grade === 'B' || r.grade === 'C' || r.grade === 'P') {
      acc[sem].pass++;
    }
    return acc;
  }, {} as Record<number, { pass: number; total: number }>);

  const semesterTrendData = Array.from({ length: 6 }, (_, i) => i + 1).map(sem => {
    const data = semesterPassData[sem];
    const value = data && data.total > 0 ? Math.round((data.pass / data.total) * 1000) / 10 : 0;
    return { label: `Sem ${sem}`, value };
  });

  const lineChartData = semesterTrendData.map(d => ({ label: d.label, value: d.value }));

  const quickActions = [
    { label: "Publish Results", description: "Release semester results to students", icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    ), href: "#", variant: "primary" as const },
    { label: "Upload Excel/CSV", description: "Bulk import results from spreadsheet", icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
    ), href: "/admin?tab=upload", variant: "outline" as const },
    { label: "Add New Student", description: "Register a new student in the system", icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
    ), href: "#", variant: "outline" as const },
    { label: "Generate Reports", description: "Create academic performance reports", icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
    ), href: "#", variant: "outline" as const },
    { label: "Revaluation Setup", description: "Configure revaluation applications", icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
    ), href: "#", variant: "outline" as const },
    { label: "Backup Database", description: "Create system backup", icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
    ), href: "#", variant: "outline" as const },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-900">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Header />
      <main id="main-content" className="flex-1">
        <div className="page-header">
          <div className="container">
            <div className="max-w-7xl">
              <nav className="flex items-center gap-2 text-sm text-primary-100 mb-4" aria-label="Breadcrumb">
                <Link href="/" className="hover:text-white transition-colors">Home</Link>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                <span className="text-white">Admin Portal</span>
              </nav>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold">Admin Dashboard</h1>
                  <p className="text-primary-100 mt-1">Manage results, students, and analytics</p>
                </div>
                <Badge variant="outline" className="bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-800">
                  Demo Mode
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="container section">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-200 dark:border-slate-700" role="tablist" aria-label="Admin sections">
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
                    label="Total Students"
                    value={stats?.totalStudents?.toLocaleString() ?? "—"}
                    change="+12 this month"
                    changeType="positive"
                    icon={<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                    variant="primary"
                  />
                  <StatCard
                    label="Results Published"
                    value={stats?.resultsPublished ?? 0}
                    change={stats?.resultsPublished > 10 ? "On track" : "Needs attention"}
                    changeType={stats?.resultsPublished > 10 ? "positive" : "negative"}
                    icon={<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                    variant="success"
                  />
                  <StatCard
                    label="Pending / Draft"
                    value={0}
                    change="Data from DB not available"
                    changeType="neutral"
                    icon={<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    variant="warning"
                  />
                  <StatCard
                    label="Overall Pass Rate"
                    value={stats?.totalStudents ? `${((stats.passed / stats.totalStudents) * 100).toFixed(1)}%` : "—"}
                    change={stats ? `Pass: ${stats.passed} | ATKT: ${stats.atkt} | Fail: ${stats.failed}` : "—"}
                    changeType="positive"
                    icon={<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
                    variant="info"
                  />
                </div>

                <div className="grid lg:grid-cols-2 gap-6 mb-8">
                  <Card variant="elevated" padding="lg">
                    <CardHeader>
                      <CardTitle>Pass / Fail / ATKT Overview</CardTitle>
                      <CardDescription>Current semester result distribution</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-center gap-8">
                        <DoughnutChart data={passFailData} size={200} strokeWidth={16} showLegend />
                      </div>
                    </CardContent>
                  </Card>

                  <Card variant="elevated" padding="lg">
                    <CardHeader>
                      <CardTitle>Monthly Result Publications</CardTitle>
                      <CardDescription>Results published per month (2025)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <BarChart data={barChartData} height={220} showValues maxValue={1400} />
                    </CardContent>
                  </Card>
                </div>

                <div className="grid lg:grid-cols-3 gap-6 mb-8">
                  <Card variant="elevated" padding="lg" className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>Semester-wise Pass Percentage Trend</CardTitle>
                      <CardDescription>Average pass percentage across semesters</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <LineChart data={semesterTrendData} height={220} color="#2563eb" showArea showPoints />
                    </CardContent>
                  </Card>

                  <Card variant="elevated" padding="lg">
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {quickActions.map((action, index) => (
                        <Link key={index} href={action.href} className="block">
                          <Button variant={action.variant} className="w-full justify-start gap-3">
                            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700">{action.icon}</div>
                            <div className="text-left">
                              <p className="font-medium text-slate-900 dark:text-white">{action.label}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{action.description}</p>
                            </div>
                          </Button>
                        </Link>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                <Card variant="elevated" padding="lg">
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest administrative actions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivities.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                          <div className={`flex-shrink-0 p-3 rounded-xl ${activity.type === "success" ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" : activity.type === "warning" ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"}`}>
                            {activity.type === "success" && <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                            {activity.type === "warning" && <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
                            {activity.type === "info" && <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 dark:text-white">{activity.action}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{activity.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "results" && (
              <div id="results-panel" role="tabpanel" aria-labelledby="results-tab" className="animate-fade-in">
                <div className="mb-6">
                  <Card variant="outlined" padding="md">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Input
                        label="Search"
                        placeholder="Search by name, PRN..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1"
                      />
                      <Select
                        label="Course"
                        options={courseOptions}
                        value={filterCourse}
                        onChange={(e) => setFilterCourse(e.target.value)}
                        className="w-full sm:w-48"
                      />
                      <Select
                        label="Status"
                        options={statusOptions}
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full sm:w-48"
                      />
                      <Select
                        label="Semester"
                        options={semesterOptions}
                        value={filterSemester}
                        onChange={(e) => setFilterSemester(e.target.value)}
                        className="w-full sm:w-48"
                      />
                      <Button variant="outline" onClick={() => { setSearchQuery(""); setFilterCourse(""); setFilterStatus(""); setFilterSemester(""); }}>
                        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        Clear Filters
                      </Button>
                    </div>
                  </Card>
                </div>

                <Card variant="elevated" padding="none">
                  <CardContent className="p-0">
                    {loadingResults ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent" />
                        <span className="sr-only">Loading results...</span>
                      </div>
                    ) : resultsError ? (
                      <div className="p-8 text-center text-red-600 dark:text-red-400">
                        <p>Failed to load results: {resultsError}</p>
                        <Button variant="outline" className="mt-4" onClick={fetchResults}>Retry</Button>
                      </div>
                    ) : filteredResults.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                        <svg className="h-12 w-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="font-medium text-slate-900 dark:text-white mb-1">No results found</p>
                        <p className="text-sm">Try adjusting your filters or search query</p>
                      </div>
                    ) : (
                      <Table
                        columns={resultColumns}
                        data={filteredResults}
                        keyExtractor={(row) => row.id}
                        striped
                        hoverable
                        caption={`Showing ${filteredResults.length} of ${displayResults.length} result summaries`}
                        emptyMessage="No results match your filters"
                      />
                    )}
                  </CardContent>
                </Card>

                <div className="mt-6 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                  <span>Showing {filteredResults.length} of {displayResults.length} result summaries</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled>Previous</Button>
                    <Button variant="outline" size="sm" disabled>Next</Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "analytics" && (
              <div id="analytics-panel" role="tabpanel" aria-labelledby="analytics-tab" className="animate-fade-in">
                <div className="grid lg:grid-cols-2 gap-6 mb-8">
                  <Card variant="elevated" padding="lg">
                    <CardHeader>
                      <CardTitle>Course-wise Student Distribution</CardTitle>
                      <CardDescription>Total enrolled students per course</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <BarChart data={barChartData} height={280} showValues maxValue={1400} />
                    </CardContent>
                  </Card>

                  <Card variant="elevated" padding="lg">
                    <CardHeader>
                      <CardTitle>Result Status Distribution</CardTitle>
                      <CardDescription>Overall pass/fail/ATKT ratio</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-center gap-8">
                        <DoughnutChart data={passFailData} size={240} strokeWidth={16} showLegend />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid lg:grid-cols-2 gap-6 mb-8">
                  <Card variant="elevated" padding="lg" className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>Year-over-Year Performance Trend</CardTitle>
                      <CardDescription>Average pass percentage by academic year</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <LineChart data={lineChartData} height={280} color="#2563eb" showArea showPoints />
                    </CardContent>
                  </Card>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                  <Card variant="elevated" padding="lg">
                    <CardHeader>
                      <CardTitle>Top Performing Courses</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {Object.entries(
                        results.reduce((acc, r) => {
                          const course = r.student.department || "Unknown";
                          if (!acc[course]) acc[course] = { pass: 0, total: 0, sgpaSum: 0, sgpaCount: 0 };
                          acc[course].total++;
                          if (r.remark === 'PASS' || r.grade === 'O' || r.grade === 'A+' || r.grade === 'A' || r.grade === 'B+' || r.grade === 'B' || r.grade === 'C' || r.grade === 'P') {
                            acc[course].pass++;
                          }
                          if (r.gradePoint) {
                            acc[course].sgpaSum += Number(r.gradePoint);
                            acc[course].sgpaCount++;
                          }
                          return acc;
                        }, {} as Record<string, { pass: number; total: number; sgpaSum: number; sgpaCount: number }>)
                      ).map(([course, data]) => {
                        const passRate = data.total > 0 ? Math.round((data.pass / data.total) * 1000) / 10 : 0;
                        const avgSGPA = data.sgpaCount > 0 ? Math.round((data.sgpaSum / data.sgpaCount) * 100) / 100 : 0;
                        return (
                          <div key={course} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-900 dark:text-white">{course}</span>
                              <Badge variant="outline" className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                                {passRate}%
                              </Badge>
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Avg SGPA: {avgSGPA}</div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>

                  <Card variant="elevated" padding="lg">
                    <CardHeader>
                      <CardTitle>Semester-wise Performance</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {semesterTrendData.map((s, i) => (
                        <div key={i} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-900 dark:text-white">{s.label}</span>
                            <span className="font-bold text-primary-600 dark:text-primary-400">{s.value}%</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-2">
                            <div className="bg-primary-600 h-2 rounded-full" style={{ width: `${s.value}%` }} />
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card variant="elevated" padding="lg">
                    <CardHeader>
                      <CardTitle>Key Metrics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {[
                        { label: "Total Results Processed", value: stats?.totalResults?.toLocaleString() ?? "—", trend: stats?.semesterStats?.[0] ? `+${stats.semesterStats[0].count}` : "—" },
                        { label: "Total Students", value: stats?.totalStudents?.toLocaleString() ?? "—", trend: "—" },
                        { label: "Total Subjects", value: stats?.totalSubjects?.toLocaleString() ?? "—", trend: "—" },
                        { label: "Active Semesters", value: stats?.totalSemesters?.toString() ?? "—", trend: "—" },
                      ].map((m, i) => (
                        <div key={i} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                          <p className="text-sm text-slate-500 dark:text-slate-400">{m.label}</p>
                          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{m.value}</p>
                          <p className="text-xs text-green-600 dark:text-green-400 mt-1">{m.trend}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {activeTab === "upload" && (
              <div id="upload-panel" role="tabpanel" aria-labelledby="upload-tab" className="animate-fade-in">
                <div className="grid lg:grid-cols-2 gap-6">
                  <Card variant="elevated" padding="lg" className="lg:col-span-1">
                    <CardHeader>
                      <CardTitle>Upload Results</CardTitle>
                      <CardDescription>Upload Excel/CSV files to bulk import results</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl p-8 text-center hover:border-primary-400 dark:hover:border-primary-500 transition-colors cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-primary-400'); }}
                        onDragLeave={(e) => { e.currentTarget.classList.remove('border-primary-400'); }}
                        onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-primary-400'); if (e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]); }}
                      >
                        <svg className="h-12 w-12 mx-auto text-slate-400 dark:text-slate-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                        <p className="text-lg font-medium text-slate-900 dark:text-white mb-1">Drag & drop Excel/CSV file here</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">or click to browse</p>
                        <Button variant="outline" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>Choose File</Button>
                        <input type="file" ref={fileInputRef} accept=".xlsx,.xls,.csv" className="hidden" id="file-upload" onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
                      </div>

                      {selectedFile && (
                        <div className="space-y-4">
                          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                            <p className="font-medium text-slate-900 dark:text-white">{selectedFile.name}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                          </div>
                          {!previewData && (
                            <Button className="w-full" size="lg" onClick={handleValidate} loading={loading}>
                              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              Validate & Preview
                            </Button>
                          )}
                          {error && (
                            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm" role="alert">
                              {error}
                            </div>
                          )}
                        </div>
                      )}

                      {previewData && (
                        <div className="space-y-4 border-t border-slate-200 dark:border-slate-700 pt-4">
                          <h4 className="font-medium text-slate-900 dark:text-white">Validation Summary</h4>
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800">
                              <p className="text-2xl font-bold text-slate-900 dark:text-white">{previewData.totalRows}</p>
                              <p className="text-xs text-slate-500">Total Rows</p>
                            </div>
                            <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20">
                              <p className="text-2xl font-bold text-green-700 dark:text-green-400">{previewData.validRows}</p>
                              <p className="text-xs text-green-600">Valid</p>
                            </div>
                            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20">
                              <p className="text-2xl font-bold text-red-700 dark:text-red-400">{previewData.invalidRows}</p>
                              <p className="text-xs text-red-600">Invalid</p>
                            </div>
                          </div>

                          {previewData.errors.length > 0 && (
                            <div className="max-h-60 overflow-y-auto border border-red-200 dark:border-red-800 rounded-xl">
                              <h5 className="p-3 font-medium text-red-700 dark:text-red-300 border-b border-red-200 dark:border-red-800">Errors</h5>
                              <ul className="p-3 space-y-2 max-h-48 overflow-y-auto">
                                {previewData.errors.slice(0, 20).map((err: {row:number; field:string; message:string}, idx: number) => (
                                  <li key={idx} className="text-sm text-red-600 dark:text-red-400">
                                    Row {err.row} – {err.field}: {err.message}
                                  </li>
                                ))}
                                {previewData.errors.length > 20 && (
                                  <li className="text-xs text-slate-500">…and {previewData.errors.length - 20} more</li>
                                )}
                              </ul>
                            </div>
                          )}

                          <div className="flex gap-3">
                            <Button variant="outline" onClick={resetUpload}>Cancel</Button>
                            <Button className="flex-1" size="lg" onClick={handleImport} loading={importLoading} disabled={previewData.invalidRows > 0}>
                              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                              Confirm Import
                            </Button>
                          </div>
                          {importResult && (
                            <div className={`p-4 rounded-xl ${importResult.success ? 'bg-green-50 dark:bg-green-900/20 border border-green-200' : 'bg-red-50 dark:bg-red-900/20 border border-red-200'}`}>
                              <h5 className="font-medium mb-2">{importResult.success ? 'Import Successful' : 'Import Failed'}</h5>
                              {importResult.success && (
                                <ul className="text-sm space-y-1">
                                  <li>Students created: {importResult.studentsCreated}</li>
                                  <li>Students updated: {importResult.studentsUpdated}</li>
                                  <li>Subjects created: {importResult.subjectsCreated}</li>
                                  <li>Results created: {importResult.resultsCreated}</li>
                                  <li>Results updated: {importResult.resultsUpdated}</li>
                                  <li>Marks imported: {importResult.marksImported}</li>
                                </ul>
                              )}
                              {importResult.error && <p className="text-sm">{importResult.error}</p>}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card variant="elevated" padding="lg">
                    <CardHeader>
                      <CardTitle>Required Format</CardTitle>
                      <CardDescription>Excel/CSV template structure</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-700">
                              <th className="px-4 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Column</th>
                              <th className="px-4 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Description</th>
                              <th className="px-4 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Example</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {[
                              { col: "PRN", desc: "Student PRN", example: "DEMO-BCA-001" },
                              { col: "Student Name", desc: "Full name of student", example: "Rehan Khatib" },
                              { col: "Course", desc: "Course name", example: "BCA" },
                              { col: "Semester", desc: "Semester number", example: "5" },
                              { col: "Subject Code", desc: "Subject code", example: "BCAS01" },
                              { col: "Subject Name", desc: "Subject name", example: "Database Management Systems" },
                              { col: "Max Marks", desc: "Maximum total marks", example: "100" },
                              { col: "Marks Obtained", desc: "Total marks obtained", example: "70" },
                              { col: "Internal Marks", desc: "Internal assessment marks", example: "18" },
                              { col: "External Marks", desc: "End-semester exam marks", example: "52" },
                              { col: "Max Internal Marks", desc: "Max internal marks", example: "25" },
                              { col: "Max External Marks", desc: "Max external marks", example: "75" },
                              { col: "Credits", desc: "Subject credits", example: "3" },
                              { col: "Grade", desc: "Letter grade (optional)", example: "B+" },
                              { col: "Grade Point", desc: "Grade point 0-10 (optional)", example: "8" },
                              { col: "Half Credit", desc: "Half credit course (optional)", example: "FALSE" },
                            ].map((c, i) => (
                              <tr key={i} className="bg-slate-50/50 dark:bg-slate-800/50">
                                <td className="px-4 py-2 font-mono text-slate-900 dark:text-white">{c.col}</td>
                                <td className="px-4 py-2 text-slate-600 dark:text-slate-400">{c.desc}</td>
                                <td className="px-4 py-2 font-mono text-primary-600 dark:text-primary-400">{c.example}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <Button variant="outline" className="w-full" onClick={downloadTemplate}>
                        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        Download Template (CSV)
                      </Button>

                      <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                        <h5 className="font-medium text-amber-800 dark:text-amber-200 mb-2">Important Notes</h5>
                        <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                          <li>• Ensure PRNs exist in the student database</li>
                          <li>• Marks cannot exceed maximum values</li>
                          <li>• Duplicate entries will be skipped</li>
                          <li>• Grade calculation is automatic</li>
                          <li>• Preview data before publishing</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card variant="elevated" padding="lg" className="mt-6">
                  <CardHeader>
                    <CardTitle>Upload History</CardTitle>
                    <CardDescription>Recent bulk upload activities</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                      <svg className="h-12 w-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      <p>No upload history available. Upload a file to get started.</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "settings" && (
              <div id="settings-panel" role="tabpanel" aria-labelledby="settings-tab" className="animate-fade-in">
                <div className="grid lg:grid-cols-3 gap-6">
                  <Card variant="elevated" padding="lg" className="lg:col-span-1">
                    <CardHeader>
                      <CardTitle>Settings Menu</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {[
                        { label: "General Settings", icon: (
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        )},
                        { label: "Result Publishing", icon: (
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        )},
                        { label: "Grade Configuration", icon: (
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        )},
                        { label: "Email Templates", icon: (
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        )},
                        { label: "User Management", icon: (
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        )},
                        { label: "System Logs", icon: (
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                        )},
                        { label: "Backup & Restore", icon: (
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        )},
                      ].map((item, i) => (
                        <button
                          key={i}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                            activeTab === "settings" ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                          }`}
                        >
                          <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700">{item.icon}</div>
                          <span className="font-medium">{item.label}</span>
                        </button>
                      ))}
                    </CardContent>
                  </Card>

                  <Card variant="elevated" padding="lg" className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>General Settings</CardTitle>
                      <CardDescription>Configure portal-wide settings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <h4 className="font-medium text-slate-900 dark:text-white mb-4">Institute Information</h4>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <Input label="Institute Name" defaultValue="CSIBER Institute Kolhapur" />
                          <Input label="Short Name" defaultValue="CSIBER" />
                          <Input label="Website" defaultValue="https://csiber.edu.in" type="url" />
                          <Input label="Contact Email" defaultValue="exam@csiber.edu.in" type="email" />
                        </div>
                      </div>

                      <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                        <h4 className="font-medium text-slate-900 dark:text-white mb-4">Result Portal Settings</h4>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-slate-900 dark:text-white">Enable Student Portal</p>
                              <p className="text-sm text-slate-500 dark:text-slate-400">Allow students to view their results</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" defaultChecked className="sr-only peer" />
                              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-primary-600"></div>
                            </label>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-slate-900 dark:text-white">Auto-calculate Grades</p>
                              <p className="text-sm text-slate-500 dark:text-slate-400">Automatically compute grades from marks</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" defaultChecked className="sr-only peer" />
                              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-primary-600"></div>
                            </label>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-slate-900 dark:text-white">Email Notifications</p>
                              <p className="text-sm text-slate-500 dark:text-slate-400">Send emails on result publication</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" defaultChecked className="sr-only peer" />
                              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-primary-600"></div>
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                        <h4 className="font-medium text-slate-900 dark:text-white mb-4">Grading Scale</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-slate-200 dark:border-slate-700">
                                <th className="px-4 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Grade</th>
                                <th className="px-4 py-2 text-center font-semibold text-slate-700 dark:text-slate-300">Range</th>
                                <th className="px-4 py-2 text-center font-semibold text-slate-700 dark:text-slate-300">Points</th>
                                <th className="px-4 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Description</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                              {[
                                { grade: "A+", range: "90-100", point: 10, desc: "Outstanding" },
                                { grade: "A", range: "80-89", point: 9, desc: "Excellent" },
                                { grade: "B+", range: "70-79", point: 8, desc: "Very Good" },
                                { grade: "B", range: "60-69", point: 7, desc: "Good" },
                                { grade: "C+", range: "50-59", point: 6, desc: "Above Average" },
                                { grade: "C", range: "40-49", point: 5, desc: "Average" },
                                { grade: "D", range: "30-39", point: 4, desc: "Below Average" },
                                { grade: "F", range: "Below 30", point: 0, desc: "Fail" },
                              ].map((g) => (
                                <tr key={g.grade}>
                                  <td className="px-4 py-2 font-medium text-slate-900 dark:text-white">{g.grade}</td>
                                  <td className="px-4 py-2 text-center text-slate-600 dark:text-slate-400">{g.range}%</td>
                                  <td className="px-4 py-2 text-center font-mono text-slate-900 dark:text-white">{g.point}</td>
                                  <td className="px-4 py-2 text-slate-600 dark:text-slate-400">{g.desc}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <Button variant="outline">Cancel</Button>
                        <Button variant="primary">Save Changes</Button>
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
