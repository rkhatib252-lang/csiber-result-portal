"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/search", label: "Check Result" },
  { href: "/student", label: "Student Portal" },
  { href: "/admin", label: "Admin Portal" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-3" aria-label="CSIBER Result Portal Home">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-white font-bold text-lg">
              C
            </div>
            <div>
              <span className="block text-xl font-bold text-slate-900 dark:text-white tracking-wide">CSIBER</span>
              <span className="block text-[10px] font-medium text-slate-500 dark:text-slate-400 tracking-widest uppercase">
                Institute Kolhapur
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  pathname === item.href
                    ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800"
                }`}
                aria-current={pathname === item.href ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/search">
              <Button size="sm" variant="primary">
                Check Result
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}