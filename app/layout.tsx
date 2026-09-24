import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CSIBER Result Portal",
  description: "Student result management portal demo",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
