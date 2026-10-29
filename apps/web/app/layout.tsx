import type { Metadata, Viewport } from "next";
import { OfflineNotice, ServiceWorkerRegistration } from "@practicallab/ui";
import "./globals.css";

export const metadata: Metadata = {
  title: "PracticalLab Africa — Your lab, in your pocket",
  description: "Learn practical science by doing, on the phone you have.",
  applicationName: "PracticalLab Africa",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/lab-flask.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#6c4df6",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ServiceWorkerRegistration />
        <OfflineNotice />
        {children}
      </body>
    </html>
  );
}
