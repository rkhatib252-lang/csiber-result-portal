"use client";

import { useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Header, Footer } from "@/components/layout";
import { Button, Input, Select, Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui";

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [prn, setPrn] = useState("");
  const [semester, setSemester] = useState("5");
  const [prnError, setPrnError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const semesterOptions = Array.from({ length: 6 }, (_, i) => i + 1).map((s) => ({
    value: String(s),
    label: `Semester ${s}`,
  }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPrnError("");

    const normalizedPrn = prn.trim().toUpperCase();
    if (!normalizedPrn) {
      setPrnError("Please enter your PRN / Roll Number");
      return;
    }

    const semNum = parseInt(semester, 10);
    if (!semNum || semNum < 1 || semNum > 6) {
      setPrnError("Please select a valid semester");
      return;
    }

    router.push(`/result?prn=${encodeURIComponent(normalizedPrn)}&semester=${semester}`);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Header />
      <main id="main-content" className="flex-1">
        <div className="page-header">
          <div className="container">
            <div className="max-w-2xl">
              <nav className="flex items-center gap-2 text-sm text-primary-100 mb-4" aria-label="Breadcrumb">
                <Link href="/" className="hover:text-white transition-colors">Home</Link>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                <span className="text-white">Check Result</span>
              </nav>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">View Your Result</h1>
              <p className="text-primary-100 text-lg">Enter your academic details to access your semester marksheet</p>
            </div>
          </div>
        </div>

        <div className="container section">
          <div className="max-w-xl mx-auto">
            <Card variant="elevated" padding="lg">
              <CardHeader className="text-center">
                <CardTitle>Result Search</CardTitle>
                <CardDescription>
                  Enter your PRN and select the semester to view your result
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                  <Input
                    label="PRN / Roll Number"
                    placeholder="Enter your PRN (e.g., DEMO-BCA-001)"
                    value={prn}
                    onChange={(e) => {
                      setPrn(e.target.value.toUpperCase());
                      setPrnError("");
                    }}
                    error={prnError}
                    autoComplete="username"
                    required
                    autoFocus
                    disabled={isSubmitting}
                    helperText="Your Permanent Registration Number as provided by the institute"
                  />

                  <Select
                    label="Semester"
                    options={semesterOptions}
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    placeholder="Select Semester"
                    disabled={isSubmitting}
                  />

                  <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
                    View Result
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="mt-8 grid sm:grid-cols-3 gap-4">
              <Card variant="outlined" padding="md" className="text-center">
                <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mx-auto w-fit mb-3">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Secure Access</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">PRN-based authentication ensures only you can view your results</p>
              </Card>
              <Card variant="outlined" padding="md" className="text-center">
                <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mx-auto w-fit mb-3">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">All Semesters</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Access results for any semester from 1 to 6</p>
              </Card>
              <Card variant="outlined" padding="md" className="text-center">
<div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 mx-auto w-fit mb-3">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 002-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Download & Print</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Save or print your official marksheet for records</p>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center section">
          <div className="container text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">Loading search page...</p>
          </div>
        </main>
        <Footer />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
