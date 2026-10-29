import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Staff access · PracticalLab Africa",
  description: "Protected staff access for PracticalLab Africa.",
};

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
