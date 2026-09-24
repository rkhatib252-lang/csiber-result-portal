"use client";

import { useState } from "react";
import Link from "next/link";
import { Header, Footer } from "@/components/layout";
import { Button, Input, Select, Card, CardContent, Badge } from "@/components/ui";
import { howToSteps, notices } from "@/lib/data/demo-data";

export default function HomePage() {
  const [prn, setPrn] = useState("");
  const [semester, setSemester] = useState("5");
  const [prnError, setPrnError] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prn.trim()) {
      setPrnError("Please enter your PRN / Roll Number");
      return;
    }
    const normalizedPrn = prn.trim().toUpperCase();
    setPrnError("");
    window.location.href = `/result?prn=${encodeURIComponent(normalizedPrn)}&semester=${semester}`;
  };

  const semesterOptions = Array.from({ length: 6 }, (_, i) => i + 1).map((s) => ({
    value: String(s),
    label: `Semester ${s}`,
  }));

  const features = [
    {
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: "Instant Result Access",
      description: "Get your semester results immediately with just your PRN and semester selection. No waiting, no hassle.",
    },
    {
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      title: "Secure & Private",
      description: "Your academic data is protected with enterprise-grade security. Results are accessible only to authorized users.",
    },
    {
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      title: "Detailed Marksheets",
      description: "View comprehensive marksheets with subject-wise internal, external marks, grades, SGPA and overall status.",
    },
    {
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      title: "Download & Print",
      description: "Download official result PDFs or print directly for your records and verification purposes.",
    },
    {
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      title: "Mobile Friendly",
      description: "Access your results anytime, anywhere. Fully responsive design works seamlessly on all devices.",
    },
    {
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: "Historical Records",
      description: "Access all your past semester results in one place. Track your academic progress over time.",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Header />
      <main id="main-content" className="flex-1">
        <section className="relative hero-gradient text-white" aria-labelledby="hero-heading">
          <div className="container">
            <div className="grid lg:grid-cols-2 gap-12 items-center py-20 lg:py-32">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm font-medium mb-6 animate-fade-in">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  Results Published: BCA Sem 5 • BBA Sem 3 • BCom Sem 1
                </div>
                <h1 id="hero-heading" className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
                  CSIBER Result<br />
                  <span className="text-primary-300">Management Portal</span>
                </h1>
                <p className="text-lg sm:text-xl text-slate-300 mb-8 max-w-xl animate-slide-up" style={{ animationDelay: '200ms' }}>
                  Modern academic result management and verification system for CSIBER Institute, Kolhapur.
                  Secure, fast, and transparent access to semester results, marksheets, and academic records.
                </p>
<div className="flex flex-wrap gap-4 animate-slide-up" style={{ animationDelay: '300ms' }}>
                <Link href="/student/login">
                  <Button size="lg" className="w-full sm:w-auto bg-white text-primary-700 hover:bg-slate-100 shadow-lg">
                    Student Login
                  </Button>
                </Link>
                <Link href="/admin/login" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
                  <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                    Admin Login
                  </Button>
                </Link>
              </div>
                <div className="mt-10 flex flex-wrap gap-8 text-sm animate-slide-up" style={{ animationDelay: '400ms' }}>
                  <div className="flex items-center gap-2">
                    <svg className="h-5 w-5 text-primary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Secure Access</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="h-5 w-5 text-primary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Real-time Updates</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="h-5 w-5 text-primary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Official Records</span>
                  </div>
                </div>
              </div>

              <div className="relative animate-slide-up" style={{ animationDelay: '200ms' }}>
                <Card variant="elevated" padding="lg" className="max-w-md mx-auto">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">View Result</h2>
                    <Badge variant="success">Live</Badge>
                  </div>
                  <form onSubmit={handleSearch} className="space-y-4" noValidate>
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
                    />
                    <Select
                      label="Semester"
                      options={semesterOptions}
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      placeholder="Select Semester"
                    />
                    <Button type="submit" className="w-full" size="lg">
                      View Result
                    </Button>
                  </form>
                </Card>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-50 to-transparent dark:from-slate-950" aria-hidden="true" />
        </section>

        <section className="section bg-white dark:bg-slate-900" aria-labelledby="announcements-heading">
          <div className="container">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div>
                <h2 id="announcements-heading" className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                  Latest Announcements
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Stay updated with important notices and result declarations</p>
              </div>
              <Link href="#" className="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium text-sm flex items-center gap-1">
                View All
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {notices.map((notice) => (
                <Card key={notice.id} variant="outlined" padding="lg" className="card-hover h-full">
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 p-3 rounded-xl ${
                      notice.priority === "high" ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" :
                      notice.priority === "medium" ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" :
                      "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                    }`}>
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.035-.586 1.414L2 17h5v5a2 2 0 002 2h10a2 2 0 002-2v-5h5z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" size="sm">{notice.category}</Badge>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{new Date(notice.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                      <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{notice.title}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{notice.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="section bg-slate-50 dark:bg-slate-900/50" aria-labelledby="features-heading">
          <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 id="features-heading" className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                Everything You Need for Result Management
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400">
                A comprehensive platform designed for students, faculty, and administrators
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <Card key={index} variant="default" padding="lg" className="card-hover h-full animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                  <div className="p-3 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 w-fit mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{feature.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400">{feature.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="section bg-white dark:bg-slate-900" aria-labelledby="howto-heading">
          <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 id="howto-heading" className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                How to Check Your Result
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400">
                Follow these simple steps to access your semester results
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {howToSteps.map((step) => (
                <div key={step.step} className="relative text-center">
                  <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-2xl font-bold mx-auto mb-4">
                    {step.step}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{step.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400">{step.description}</p>
                </div>
              ))}
            </div>
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/student/login">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto text-lg px-8 gap-2">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Student Login
                </Button>
              </Link>
              <Link href="/admin/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 border-white text-white hover:bg-white/10 gap-2">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Admin Login
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="section bg-primary-600 text-white" aria-labelledby="cta-heading">
          <div className="container text-center">
            <h2 id="cta-heading" className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
              Ready to Check Your Result?
            </h2>
            <p className="text-lg text-primary-100 mb-8 max-w-2xl mx-auto">
              Enter your PRN and semester to view your detailed marksheet with grades, SGPA, and overall status.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/student/login">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto text-lg px-8">
                  Student Login
                </Button>
              </Link>
              <Link href="/admin/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 border-white text-white hover:bg-white/10">
                  Admin Login
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
