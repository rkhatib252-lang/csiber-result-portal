"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Header, Footer } from "@/components/layout";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  Table,
  type Column,
  Input,
  Select,
  type SelectOption,
} from "@/components/ui";

interface Student {
  prn: string;
  name: string;
  email: string | null;
  batch: string | null;
  classYear: {
    id: string;
    name: string;
    year: number;
    course: {
      id: string;
      code: string;
      name: string;
      department: {
        id: string;
        code: string;
        name: string;
      } | null;
    } | null;
  } | null;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  } | null;
  createdBy: string | null;
  createdAt: string;
  changedBy: string | null;
  changedAt: string | null;
  resultCount: number;
}

interface Department {
  id: string;
  code: string;
  name: string;
}

interface Course {
  id: string;
  code: string;
  name: string;
  departmentId: string;
}

interface ClassYear {
  id: string;
  name: string;
  year: number;
  courseId: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

function StudentManagementContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [students, setStudents] = useState<Student[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [classYears, setClassYears] = useState<ClassYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });

  const [filters, setFilters] = useState({
    search: "",
    departmentId: "",
    courseId: "",
    classYearId: "",
    admissionYear: "",
    useRegex: false,
    caseSensitive: false,
  });

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState<Student | null>(null);
  const [showViewDialog, setShowViewDialog] = useState<Student | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Student | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    prn: "",
    email: "",
    batch: "",
    departmentId: "",
    courseId: "",
    classYearId: "",
  });

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/departments");
      if (res.ok) {
        const data = await res.json();
        setDepartments(data.departments || []);
      }
    } catch {
      // ignore
    }
  }, []);

  const fetchCourses = useCallback(async (departmentId?: string) => {
    try {
      const url = departmentId
        ? `/api/admin/courses?departmentId=${departmentId}`
        : "/api/admin/courses";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses || []);
      }
    } catch {
      // ignore
    }
  }, []);

  const fetchClassYears = useCallback(async (courseId?: string) => {
    try {
      const url = courseId
        ? `/api/admin/class-years?courseId=${courseId}`
        : "/api/admin/class-years";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setClassYears(data.classYears || []);
      }
    } catch {
      // ignore
    }
  }, []);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    params.set("page", String(pagination.page));
    params.set("pageSize", String(pagination.pageSize));

    if (filters.search) params.set("search", filters.search);
    if (filters.useRegex) params.set("regex", "true");
    if (filters.caseSensitive) params.set("caseSensitive", "true");
    if (filters.departmentId) params.set("departmentId", filters.departmentId);
    if (filters.courseId) params.set("courseId", filters.courseId);
    if (filters.classYearId) params.set("classYearId", filters.classYearId);
    if (filters.admissionYear) params.set("admissionYear", filters.admissionYear);

    try {
      const res = await fetch(`/api/admin/students?${params.toString()}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch students");
      }
      const data = await res.json();
      setStudents(data.students || []);
      setPagination((p) => ({ ...p, total: data.pagination.total, totalPages: data.pagination.totalPages }));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, filters]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  useEffect(() => {
    fetchCourses(filters.departmentId || undefined);
  }, [filters.departmentId, fetchCourses]);

  useEffect(() => {
    fetchClassYears(filters.courseId || undefined);
  }, [filters.courseId, fetchClassYears]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setPagination((p) => ({ ...p, page }));
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      departmentId: "",
      courseId: "",
      classYearId: "",
      admissionYear: "",
      useRegex: false,
      caseSensitive: false,
    });
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const openCreateDialog = () => {
    setFormData({ name: "", prn: "", email: "", batch: "", departmentId: "", courseId: "", classYearId: "" });
    setFormError(null);
    setShowCreateDialog(true);
  };

  const openEditDialog = (student: Student) => {
    setFormData({
      name: student.name,
      prn: student.prn,
      email: student.email || "",
      batch: student.batch || "",
      departmentId: student.classYear?.course?.department?.id || "",
      courseId: student.classYear?.course?.id || "",
      classYearId: student.classYear?.id || "",
    });
    setFormError(null);
    setShowEditDialog(student);
  };

  const openViewDialog = (student: Student) => {
    setShowViewDialog(student);
  };

  const openDeleteConfirm = (student: Student) => {
    setShowDeleteConfirm(student);
  };

  const closeDialogs = () => {
    setShowCreateDialog(false);
    setShowEditDialog(null);
    setShowViewDialog(null);
    setShowDeleteConfirm(null);
    setFormError(null);
  };

  const handleFormChange = (key: string, value: string) => {
    setFormData((f) => ({ ...f, [key]: value }));
    setFormError(null);
  };

  const handleFormDepartmentChange = (departmentId: string) => {
    setFormData((f) => ({ ...f, departmentId, courseId: "", classYearId: "" }));
    fetchCourses(departmentId || undefined);
  };

  const handleFormCourseChange = (courseId: string) => {
    setFormData((f) => ({ ...f, courseId, classYearId: "" }));
    fetchClassYears(courseId || undefined);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    const { name, prn, email, batch, classYearId } = formData;

    if (!name.trim() || !prn.trim() || !batch.trim() || !classYearId) {
      setFormError("All required fields must be filled");
      setSubmitting(false);
      return;
    }

    try {
      const url = showEditDialog ? `/api/admin/students/${showEditDialog.prn}` : "/api/admin/students";
      const method = showEditDialog ? "PUT" : "POST";
      const body = showEditDialog
        ? { name: name.trim(), email: email.trim() || null, batch: batch.trim(), classYearId }
        : { name: name.trim(), prn: prn.trim().toUpperCase(), email: email.trim() || null, batch: batch.trim(), classYearId };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Operation failed");
      }

      closeDialogs();
      fetchStudents();
    } catch (e: any) {
      setFormError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!showDeleteConfirm) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/admin/students/${showDeleteConfirm.prn}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Delete failed");
      }

      closeDialogs();
      fetchStudents();
    } catch (e: any) {
      setFormError(e.message);
      setShowDeleteConfirm(null);
    } finally {
      setSubmitting(false);
    }
  };

  const studentColumns: Column<Student>[] = [
    {
      key: "name",
      header: "Student Name",
      render: (row) => (
        <div>
          <p className="font-medium">{row.name}</p>
          {row.user && <p className="text-xs text-slate-500 dark:text-slate-400">User: {row.user.email}</p>}
        </div>
      ),
    },
    {
      key: "prn",
      header: "PRN",
      className: "font-mono text-sm",
    },
    {
      key: "batch",
      header: "Admission Year",
      className: "text-center",
      headerClassName: "text-center",
      render: (row) => <span className="font-mono">{row.batch || "â€”"}</span>,
    },
    {
      key: "course",
      header: "Course",
      render: (row) =>
        row.classYear?.course ? (
          <Badge variant="outline">{row.classYear.course.name}</Badge>
        ) : (
          <span className="text-slate-400">â€”</span>
        ),
    },
    {
      key: "classYear",
      header: "Class / Year",
      className: "text-center",
      headerClassName: "text-center",
      render: (row) => (row.classYear ? row.classYear.name : "â€”"),
    },
    {
      key: "createdBy",
      header: "Created By",
      className: "text-center",
      headerClassName: "text-center",
      render: (row) => <span className="text-sm">{row.createdBy || "â€”"}</span>,
    },
    {
      key: "createdAt",
      header: "Created On",
      className: "text-center",
      headerClassName: "text-center",
      render: (row) =>
        row.createdAt ? new Date(row.createdAt).toLocaleDateString("en-IN") : "â€”",
    },
    {
      key: "changedBy",
      header: "Changed By",
      className: "text-center",
      headerClassName: "text-center",
      render: (row) => <span className="text-sm">{row.changedBy || "â€”"}</span>,
    },
    {
      key: "changedAt",
      header: "Changed On",
      className: "text-center",
      headerClassName: "text-center",
      render: (row) =>
        row.changedAt ? new Date(row.changedAt).toLocaleDateString("en-IN") : "â€”",
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-center",
      headerClassName: "text-center",
      render: (row) => (
        <div className="flex items-center justify-center gap-1">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openViewDialog(row)} aria-label={`View ${row.name}`}>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7z" /></svg>
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEditDialog(row)} aria-label={`Edit ${row.name}`}>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          </Button>
          {row.resultCount === 0 ? (
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => openDeleteConfirm(row)} aria-label={`Delete ${row.name}`}>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </Button>
          ) : (
            <Badge variant="outline" className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800" size="sm">
              Has Results
            </Badge>
          )}
        </div>
      ),
    },
  ];

  const CreateStudentDialog = () => {
    if (!showCreateDialog) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-labelledby="create-dialog-title">
        <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-lg shadow-xl">
          <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
            <h2 id="create-dialog-title" className="text-lg font-semibold">Create New Student</h2>
            <Button variant="ghost" size="sm" onClick={closeDialogs} aria-label="Close">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </Button>
          </div>
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {formError && <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded">{formError}</div>}
            <div>
              <label htmlFor="create-name" className="block text-sm font-medium mb-1">Student Name *</label>
              <Input id="create-name" value={formData.name} onChange={(e) => handleFormChange("name", e.target.value)} required />
            </div>
            <div>
              <label htmlFor="create-prn" className="block text-sm font-medium mb-1">PRN *</label>
              <Input id="create-prn" value={formData.prn} onChange={(e) => handleFormChange("prn", e.target.value)} required />
            </div>
            <div>
              <label htmlFor="create-email" className="block text-sm font-medium mb-1">Email</label>
              <Input id="create-email" type="email" value={formData.email} onChange={(e) => handleFormChange("email", e.target.value)} />
            </div>
            <div>
              <label htmlFor="create-batch" className="block text-sm font-medium mb-1">Admission Year *</label>
              <Input id="create-batch" value={formData.batch} onChange={(e) => handleFormChange("batch", e.target.value)} required />
            </div>
            <div>
              <label htmlFor="create-department" className="block text-sm font-medium mb-1">Department *</label>
              <Select
                id="create-department"
                placeholder="Select Department"
                options={[{ value: "", label: "Select Department" }, ...departments.map((d) => ({ value: d.id, label: `${d.code} - ${d.name}` }))]}
                value={formData.departmentId}
                onChange={(e) => handleFormDepartmentChange(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="create-course" className="block text-sm font-medium mb-1">Course *</label>
              <Select
                id="create-course"
                placeholder="Select Course"
                options={[{ value: "", label: "Select Course" }, ...courses.map((c) => ({ value: c.id, label: `${c.code} - ${c.name}` }))]}
                value={formData.courseId}
                onChange={(e) => handleFormCourseChange(e.target.value)}
                disabled={courses.length === 0 && !formData.courseId}
                required
              />
            </div>
            <div>
              <label htmlFor="create-classyear" className="block text-sm font-medium mb-1">Class / Year *</label>
              <Select
                id="create-classyear"
                placeholder="Select Class/Year"
                options={[{ value: "", label: "Select Class/Year" }, ...classYears.map((cy) => ({ value: cy.id, label: cy.name }))]}
                value={formData.classYearId}
                onChange={(e) => handleFormChange("classYearId", e.target.value)}
                disabled={classYears.length === 0 && !formData.classYearId}
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t dark:border-slate-700">
              <Button type="button" variant="outline" onClick={closeDialogs} disabled={submitting}>Cancel</Button>
              <Button type="submit" disabled={submitting}>{submitting ? "Creating..." : "Create Student"}</Button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const EditStudentDialog = () => {
    if (!showEditDialog) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-labelledby="edit-dialog-title">
        <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-lg shadow-xl">
          <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
            <h2 id="edit-dialog-title" className="text-lg font-semibold">Edit Student</h2>
            <Button variant="ghost" size="sm" onClick={closeDialogs} aria-label="Close">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </Button>
          </div>
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {formError && <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded">{formError}</div>}
            <div>
              <label htmlFor="edit-name" className="block text-sm font-medium mb-1">Student Name</label>
              <Input id="edit-name" value={formData.name} onChange={(e) => handleFormChange("name", e.target.value)} required />
            </div>
            <div>
              <label htmlFor="edit-prn" className="block text-sm font-medium mb-1">PRN (read-only)</label>
              <Input id="edit-prn" value={formData.prn} readOnly className="bg-slate-100 dark:bg-slate-700" />
            </div>
            <div>
              <label htmlFor="edit-email" className="block text-sm font-medium mb-1">Email</label>
              <Input id="edit-email" type="email" value={formData.email} onChange={(e) => handleFormChange("email", e.target.value)} />
            </div>
            <div>
              <label htmlFor="edit-batch" className="block text-sm font-medium mb-1">Admission Year</label>
              <Input id="edit-batch" value={formData.batch} onChange={(e) => handleFormChange("batch", e.target.value)} required />
            </div>
            <div>
              <label htmlFor="edit-department" className="block text-sm font-medium mb-1">Department</label>
              <Select
                id="edit-department"
                placeholder="Select Department"
                options={[{ value: "", label: "Select Department" }, ...departments.map((d) => ({ value: d.id, label: `${d.code} - ${d.name}` }))]}
                value={formData.departmentId}
                onChange={(e) => handleFormDepartmentChange(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="edit-course" className="block text-sm font-medium mb-1">Course</label>
              <Select
                id="edit-course"
                placeholder="Select Course"
                options={[{ value: "", label: "Select Course" }, ...courses.map((c) => ({ value: c.id, label: `${c.code} - ${c.name}` }))]}
                value={formData.courseId}
                onChange={(e) => handleFormCourseChange(e.target.value)}
                disabled={courses.length === 0 && !formData.courseId}
              />
            </div>
            <div>
              <label htmlFor="edit-classyear" className="block text-sm font-medium mb-1">Class / Year</label>
              <Select
                id="edit-classyear"
                placeholder="Select Class/Year"
                options={[{ value: "", label: "Select Class/Year" }, ...classYears.map((cy) => ({ value: cy.id, label: cy.name }))]}
                value={formData.classYearId}
                onChange={(e) => handleFormChange("classYearId", e.target.value)}
                disabled={classYears.length === 0 && !formData.classYearId}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t dark:border-slate-700">
              <Button type="button" variant="outline" onClick={closeDialogs} disabled={submitting}>Cancel</Button>
              <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : "Save Changes"}</Button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const ViewStudentDialog = () => {
    const [viewData, setViewData] = useState<{
      academicSummary: { resultCount: number; semesterCount: number; hasAcademicRecords: boolean } | null;
      loading: boolean;
      error: string | null;
    }>({ academicSummary: null, loading: true, error: null });

    useEffect(() => {
      if (!showViewDialog?.prn) return;

      let mounted = true;
      const fetchViewData = async () => {
        try {
          const res = await fetch(`/api/admin/students/${showViewDialog.prn}`);
          if (!res.ok) throw new Error("Failed to fetch student details");
          const data = await res.json();
          if (mounted) setViewData({ academicSummary: data.academicSummary, loading: false, error: null });
        } catch (e: any) {
          if (mounted) setViewData({ academicSummary: null, loading: false, error: e.message });
        }
      };
      fetchViewData();
      return () => { mounted = false; };
    }, [showViewDialog?.prn]);

    if (!showViewDialog) return null;

    const s = showViewDialog;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-labelledby="view-dialog-title">
        <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-lg shadow-xl max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
            <h2 id="view-dialog-title" className="text-lg font-semibold">Student Details</h2>
            <Button variant="ghost" size="sm" onClick={closeDialogs} aria-label="Close">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </Button>
          </div>
          <div className="p-4 space-y-3">
            {viewData.loading ? (
              <div className="flex items-center justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent" /></div>
            ) : viewData.error ? (
              <div className="text-red-600 dark:text-red-400 text-center">Failed to load: {viewData.error}</div>
            ) : (
              <>
                <dl className="space-y-3 text-sm">
                  <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
                    <dt className="font-medium text-slate-500 dark:text-slate-400">Student Name</dt>
                    <dd className="font-medium">{s.name}</dd>
                    <dt className="font-medium text-slate-500 dark:text-slate-400">PRN</dt>
                    <dd className="font-mono">{s.prn}</dd>
                    <dt className="font-medium text-slate-500 dark:text-slate-400">Email</dt>
                    <dd>{s.email || "â€”"}</dd>
                    <dt className="font-medium text-slate-500 dark:text-slate-400">Admission Year</dt>
                    <dd className="font-mono">{s.batch || "â€”"}</dd>
                    <dt className="font-medium text-slate-500 dark:text-slate-400">Department</dt>
                    <dd>{s.classYear?.course?.department?.name || "â€”"}</dd>
                    <dt className="font-medium text-slate-500 dark:text-slate-400">Course</dt>
                    <dd>{s.classYear?.course?.name || "â€”"}</dd>
                    <dt className="font-medium text-slate-500 dark:text-slate-400">Class / Year</dt>
                    <dd>{s.classYear?.name || "â€”"}</dd>
                    <dt className="font-medium text-slate-500 dark:text-slate-400">Created By</dt>
                    <dd>{s.createdBy || "â€”"}</dd>
                    <dt className="font-medium text-slate-500 dark:text-slate-400">Created On</dt>
                    <dd>{s.createdAt ? new Date(s.createdAt).toLocaleDateString("en-IN") : "â€”"}</dd>
                    <dt className="font-medium text-slate-500 dark:text-slate-400">Changed By</dt>
                    <dd>{s.changedBy || "â€”"}</dd>
                    <dt className="font-medium text-slate-500 dark:text-slate-400">Changed On</dt>
                    <dd>{s.changedAt ? new Date(s.changedAt).toLocaleDateString("en-IN") : "â€”"}</dd>
                  </div>
                </dl>
                {viewData.academicSummary && (
                  <div className="pt-4 border-t dark:border-slate-700 space-y-2">
                    <h3 className="font-medium">Academic Summary</h3>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <dt className="text-slate-500 dark:text-slate-400">Result Count</dt>
                      <dd className="font-medium">{viewData.academicSummary.resultCount}</dd>
                      <dt className="text-slate-500 dark:text-slate-400">Semester Count</dt>
                      <dd className="font-medium">{viewData.academicSummary.semesterCount}</dd>
                      <dt className="text-slate-500 dark:text-slate-400">Has Academic Records</dt>
                      <dd className="font-medium">{viewData.academicSummary.hasAcademicRecords ? "Yes" : "No"}</dd>
                    </dl>
                  </div>
                )}
              </>
            )}
            <div className="flex justify-end pt-4 border-t dark:border-slate-700">
              <Button variant="outline" onClick={closeDialogs}>Close</Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const DeleteConfirmDialog = () => {
    if (!showDeleteConfirm) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-labelledby="delete-dialog-title">
        <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-lg shadow-xl">
          <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
            <h2 id="delete-dialog-title" className="text-lg font-semibold">Confirm Delete</h2>
            <Button variant="ghost" size="sm" onClick={closeDialogs} aria-label="Close">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </Button>
          </div>
          <div className="p-4 space-y-4">
            <p className="text-slate-700 dark:text-slate-300">Are you sure you want to delete this student?</p>
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
              <p className="font-medium text-red-700 dark:text-red-400">{showDeleteConfirm.name}</p>
              <p className="text-sm font-mono text-red-600 dark:text-red-500">{showDeleteConfirm.prn}</p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                <strong>Warning:</strong> Deletion is blocked when academic result records exist for this student.
                {showDeleteConfirm.resultCount > 0 && (
                  <span className="block mt-1 font-medium">This student has {showDeleteConfirm.resultCount} result record(s) and cannot be deleted.</span>
                )}
              </p>
            </div>
            {formError && <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded">{formError}</div>}
            <div className="flex justify-end gap-2 pt-2 border-t dark:border-slate-700">
              <Button variant="outline" onClick={closeDialogs} disabled={submitting || showDeleteConfirm.resultCount > 0}>Cancel</Button>
              <Button variant="danger" onClick={handleDelete} disabled={submitting || showDeleteConfirm.resultCount > 0}>
                {submitting ? "Deleting..." : "Delete Student"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-900">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Header />
      <main id="main-content" className="flex-1">
        <div className="page-header">
          <div className="container">
            <div className="max-w-7xl">
              <nav className="flex items-center gap-2 text-sm text-primary-100 mb-4" aria-label="Breadcrumb">
                <Link href="/admin" className="hover:text-white transition-colors">Admin</Link>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                <span className="text-white">Student Management</span>
              </nav>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold">Student Management</h1>
                  <p className="text-primary-100 mt-1">Manage student master records</p>
                </div>
                <Button onClick={openCreateDialog}>
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                  New Student
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container section">
          <div className="max-w-7xl mx-auto">
            <Card variant="outlined" padding="md" className="mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <Select
                  label="Department"
                  placeholder="All Departments"
                  options={[{ value: "", label: "All Departments" }, ...departments.map((d) => ({ value: d.id, label: `${d.code} - ${d.name}` }))]}
                  value={filters.departmentId}
                  onChange={(e) => handleFilterChange("departmentId", e.target.value)}
                />
                <Select
                  label="Course"
                  placeholder="All Courses"
                  options={[{ value: "", label: "All Courses" }, ...courses.map((c) => ({ value: c.id, label: `${c.code} - ${c.name}` }))]}
                  value={filters.courseId}
                  onChange={(e) => handleFilterChange("courseId", e.target.value)}
                  disabled={courses.length === 0 && !filters.courseId}
                />
                <Select
                  label="Class / Year"
                  placeholder="All Classes"
                  options={[{ value: "", label: "All Classes" }, ...classYears.map((cy) => ({ value: cy.id, label: cy.name }))]}
                  value={filters.classYearId}
                  onChange={(e) => handleFilterChange("classYearId", e.target.value)}
                  disabled={classYears.length === 0 && !filters.classYearId}
                />
                <Input
                  label="Admission Year"
                  placeholder="e.g., 2024"
                  value={filters.admissionYear}
                  onChange={(e) => handleFilterChange("admissionYear", e.target.value)}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    label="Search"
                    placeholder="Search by name or PRN..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange("search", e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap items-end gap-4">
                  <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={filters.useRegex}
                      onChange={(e) => handleFilterChange("useRegex", String(e.target.checked))}
                      className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    />
                    Regex
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={filters.caseSensitive}
                      onChange={(e) => handleFilterChange("caseSensitive", String(e.target.checked))}
                      className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    />
                    Case Sensitive
                  </label>
                  <Button variant="outline" onClick={resetFilters} disabled={loading}>
                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    Clear Filters
                  </Button>
                </div>
              </div>
            </Card>

            <Card variant="elevated" padding="none">
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent" />
                    <span className="sr-only">Loading students...</span>
                  </div>
                ) : error ? (
                  <div className="p-8 text-center text-red-600 dark:text-red-400">
                    <p>Failed to load students: {error}</p>
                    <Button variant="outline" className="mt-4" onClick={fetchStudents}>Retry</Button>
                  </div>
                ) : students.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                    <svg className="h-12 w-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    <p className="font-medium text-slate-900 dark:text-white mb-1">No students found</p>
                    <p className="text-sm">Try adjusting your filters or add a new student</p>
                  </div>
                ) : (
                  <>
                    <Table
                      columns={studentColumns}
                      data={students}
                      keyExtractor={(row) => row.prn}
                      striped
                      hoverable
                      compact
                      caption={`Showing ${students.length} of ${pagination.total} students`}
                    />
                    {pagination.totalPages > 1 && (
                      <CardFooter className="flex items-center justify-between">
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          Page {pagination.page} of {pagination.totalPages} Â· {pagination.total} students
                        </span>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1 || loading}>
                            Previous
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.totalPages || loading}>
                            Next
                          </Button>
                        </div>
                      </CardFooter>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
</main>
      <Footer />
      {CreateStudentDialog()}
      {EditStudentDialog()}
      {ViewStudentDialog()}
      {DeleteConfirmDialog()}
    </div>
  );
}

export default function StudentManagementPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-900">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">Loading...</p>
          </div>
        </main>
        <Footer />
      </div>
    }>
      <StudentManagementContent />
    </Suspense>
  );
}