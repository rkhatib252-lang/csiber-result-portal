import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    "Quick Links": [
      { href: "/", label: "Home" },
      { href: "/search", label: "Check Result" },
      { href: "/student", label: "Student Portal" },
      { href: "/admin", label: "Admin Portal" },
    ],
    "Student Services": [
      { href: "#", label: "Result Verification" },
      { href: "#", label: "Revaluation" },
      { href: "#", label: "Transcript Request" },
      { href: "#", label: "Duplicate Marksheet" },
    ],
    "Support": [
      { href: "#", label: "Help Center" },
      { href: "#", label: "Contact Us" },
      { href: "#", label: "FAQs" },
      { href: "#", label: "Feedback" },
    ],
  };

  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-6" aria-label="CSIBER Result Portal Home">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-white font-bold text-lg">
                C
              </div>
              <div>
                <span className="block text-xl font-bold text-white tracking-wide">CSIBER</span>
                <span className="block text-[10px] font-medium text-slate-400 tracking-widest uppercase">
                  Institute Kolhapur
                </span>
              </div>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              Official result management portal for CSIBER Institute, Kolhapur.
              Providing secure, fast, and transparent access to academic results.
            </p>
            <div className="mt-6 flex gap-4">
              <a href="#" className="text-slate-400 hover:text-white transition-colors" aria-label="Twitter">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors" aria-label="Facebook">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors" aria-label="LinkedIn">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors" aria-label="Instagram">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 3.808s-.013 2.724-.06 3.808c-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-3.808.06s-2.724-.013-3.808-.06c-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808 0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 017.507 2.525c.636-.247 1.363-.416 2.427-.465C10.954 2.013 11.309 2 12.315 2zm0 1.806a9.27 9.27 0 00-3.592.43 4.745 4.745 0 00-2.01 1.006 4.82 4.82 0 00-1.354 2.19 4.82 4.82 0 00-1.006 2.01 4.751 4.751 0 00-.43 3.593c0 .994.055 1.977.158 2.898.145 1.293.395 2.43 1.028 3.232a4.718 4.718 0 001.787 1.974c.845.75 1.882 1.092 3.027 1.121.718.018 1.41-.097 2.128-.296.254-.069.47-.197.692-.305.046-.023.09-.044.136-.065.085-.04.187-.078.26-.103.078-.027.13-.052.188-.068a3.93 3.93 0 00.28-.104 3.071 3.071 0 00.304-.11c.41-.154.775-.315 1.165-.536a4.708 4.708 0 001.818-1.637 4.717 4.717 0 001.078-3.348c.103-.92.158-1.902.158-2.897a9.405 9.405 0 00-.403-3.537 4.748 4.748 0 00-1.007-2.011 4.82 4.82 0 00-2.19-1.354 4.745 4.745 0 00-2.011-1.006 9.273 9.273 0 00-3.592-.43zm0 3.669c1.616 0 3.032.876 3.764 2.14.764 1.324.762 3.161-.044 4.423-.764 1.189-2.224 1.91-3.721 1.91s-2.957-.721-3.72-1.91c-.806-1.262-.808-3.099.044-4.422C9.284 7.345 10.7 6.476 12.315 6.476z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M18.738 5.262a1.135 1.135 0 110 2.27 1.135 1.135 0 010-2.27z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Quick Links</h3>
            <ul className="space-y-3" role="list">
              {footerLinks["Quick Links"].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-slate-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Student Services</h3>
            <ul className="space-y-3" role="list">
              {footerLinks["Student Services"].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-slate-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Support</h3>
            <ul className="space-y-3" role="list">
              {footerLinks["Support"].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-slate-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <p className="text-sm text-slate-400 mb-2">Contact Exam Cell</p>
              <address className="not-italic text-sm text-slate-400 space-y-1">
                <div>CSIBER, Kolhapur</div>
                <div>Maharashtra, India</div>
                <div className="mt-2">
                  <a href="mailto:exam@csiber.edu.in" className="hover:text-white transition-colors">exam@csiber.edu.in</a>
                </div>
                <div>
                  <a href="tel:+912312600000" className="hover:text-white transition-colors">+91 231 260 0000</a>
                </div>
              </address>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              &copy; {currentYear} CSIBER Institute Kolhapur. All rights reserved.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-slate-500">
              <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
              <span aria-hidden="true">|</span>
              <Link href="#" className="hover:text-white transition-colors">Terms of Use</Link>
              <span aria-hidden="true">|</span>
              <Link href="#" className="hover:text-white transition-colors">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
