"use client";

import { useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Header, Footer } from "@/components/layout";
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui";

function StudentLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [prn, setPrn] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const redirect = searchParams.get("redirect") || "/student";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const normalizedPrn = prn.trim().toUpperCase();
    if (!normalizedPrn || !password) {
      setError("PRN and password are required");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/student/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prn: normalizedPrn, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid credentials");
        setIsLoading(false);
        return;
      }

      router.push(redirect);
      router.refresh();
    } catch {
      setError("Login failed. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Header />
      <main id="main-content" className="flex-1 flex items-center justify-center section">
        <div className="container">
          <div className="max-w-md mx-auto">
            <Card variant="elevated" padding="xl">
              <CardHeader className="text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white font-bold text-xl mx-auto mb-4">
                  S
                </div>
                <CardTitle>Student Login</CardTitle>
                <CardDescription>Enter your PRN and password to access your results</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {error && (
                  <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm" role="alert">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  <Input
                    label="PRN"
                    placeholder="Enter your PRN (e.g., DEMO-BCA-001)"
                    value={prn}
                    onChange={(e) => {
                      setPrn(e.target.value.toUpperCase());
                      setError("");
                    }}
                    autoComplete="username"
                    required
                    autoFocus
                    disabled={isLoading}
                  />

                  <Input
                    label="Password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    autoComplete="current-password"
                    required
                    disabled={isLoading}
                  />

                  <Button type="submit" className="w-full" size="lg" loading={isLoading}>
                    Sign In
                  </Button>
                </form>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                  <Link href="/" className="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium">
                    ← Back to Home
                  </Link>
                  <Link href="/admin/login" className="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium">
                    Admin Login →
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

export default function StudentLoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center section">
          <div className="container text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">Loading login page...</p>
          </div>
        </main>
        <Footer />
      </div>
    }>
      <StudentLoginContent />
    </Suspense>
  );
}
