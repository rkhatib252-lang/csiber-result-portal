"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Header, Footer } from "@/components/layout";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Input } from "@/components/ui";

export default function VerifyPage() {
  const [prn, setPrn] = useState("");
  const [semester, setSemester] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-fill from query params (e.g., QR code)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qPrn = params.get('prn');
    const qSem = params.get('semester');
    if (qPrn && qSem) {
      setPrn(qPrn.toUpperCase());
      setSemester(qSem);
      const form = document.getElementById('verify-form') as HTMLFormElement;
      if (form) form.dispatchEvent(new Event('submit'));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/result/verify?prn=${encodeURIComponent(prn)}&semester=${encodeURIComponent(semester)}`);
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 404) {
          setResult({ found: false });
        } else {
          throw new Error(data.error || "Verification failed");
        }
      } else {
        setResult(data);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPrn("");
    setSemester("");
    setResult(null);
    setError(null);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center section">
        <div className="container">
          <div className="max-w-xl mx-auto">
            <Card variant="elevated" padding="xl">
              <CardHeader className="text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white font-bold text-xl mx-auto mb-4">V</div>
                <CardTitle>CSIBER Result Verification</CardTitle>
                <CardDescription>Enter PRN and Semester to verify a result record</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form id="verify-form" onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    label="PRN"
                    placeholder="e.g. DEMO-BCA-001"
                    value={prn}
                    onChange={(e) => setPrn(e.target.value.toUpperCase())}
                    required
                    disabled={loading}
                    autoComplete="username"
                    autoFocus
                  />
                  <Input
                    label="Semester"
                    type="number"
                    min={1}
                    max={10}
                    placeholder="e.g. 5"
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    required
                    disabled={loading}
                    autoComplete="off"
                  />
                  <div className="flex gap-3">
                    <Button type="submit" className="flex-1" size="lg" loading={loading}>
                      Verify Result
                    </Button>
                    <Button type="button" variant="outline" className="flex-1" onClick={handleReset} disabled={loading}>
                      Clear
                    </Button>
                  </div>
                </form>

                {error && (
                  <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm" role="alert">
                    {error}
                  </div>
                )}

                {result !== null && !loading && (
                  <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700 animate-fade-in">
                    {result.found ? (
                      <>
                        <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                          <p className="font-medium text-green-800 dark:text-green-200 flex items-center justify-center gap-2">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Result record found
                          </p>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2 text-sm">
                          <div>
                            <p className="font-medium text-slate-500 dark:text-slate-400">Student Name</p>
                            <p className="text-slate-900 dark:text-white">{result.student.name}</p>
                          </div>
                          <div>
                            <p className="font-medium text-slate-500 dark:text-slate-400">PRN</p>
                            <p className="font-mono text-slate-900 dark:text-white">{result.student.prn}</p>
                          </div>
                          <div>
                            <p className="font-medium text-slate-500 dark:text-slate-400">Course</p>
                            <p className="text-slate-900 dark:text-white">{result.student.course}</p>
                          </div>
                          <div>
                            <p className="font-medium text-slate-500 dark:text-slate-400">Department</p>
                            <p className="text-slate-900 dark:text-white">{result.student.department}</p>
                          </div>
                          <div>
                            <p className="font-medium text-slate-500 dark:text-slate-400">Semester</p>
                            <p className="text-slate-900 dark:text-white">{result.semester.name} ({result.semester.number})</p>
                          </div>
                          <div>
                            <p className="font-medium text-slate-500 dark:text-slate-400">Result Status</p>
                            <Badge variant={result.summary.status === "PASS" ? "success" : result.summary.status === "FAIL" ? "danger" : result.summary.status === "ATKT" ? "warning" : "outline"}>
                              {result.summary.status}
                            </Badge>
                          </div>
                          <div>
                            <p className="font-medium text-slate-500 dark:text-slate-400">SGPA</p>
                            <p className="font-mono text-slate-900 dark:text-white">{result.summary.sgpa !== null ? result.summary.sgpa.toFixed(2) : "—"}</p>
                          </div>
                          <div>
                            <p className="font-medium text-slate-500 dark:text-slate-400">Percentage</p>
                            <p className="text-slate-900 dark:text-white">{result.summary.percentage.toFixed(2)}%</p>
                          </div>
                          <div>
                            <p className="font-medium text-slate-500 dark:text-slate-400">Credits</p>
                            <p className="text-slate-900 dark:text-white">{result.summary.credits}</p>
                          </div>
                        </div>
                        <div className="text-center text-xs text-slate-500 dark:text-slate-400">
                          This verification only confirms that a result record exists in the system. It is not an officially issued certificate.
                        </div>
                      </>
                    ) : (
                      <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-center">
                        <p className="font-medium text-red-800 dark:text-red-200 flex items-center justify-center gap-2">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          No result record found for the given PRN and Semester.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="text-center">
                  <Link href="/search">
                    <Button variant="outline">Back to Search</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
