import type { Metadata } from "next";
import { Providers } from "./providers";
import { TopNav } from "@/components/layout/top-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meeting Minutes - Business & Weekly Meeting Ops",
  description:
    "Internal operations tool for business management and weekly meeting tracking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <Providers>
          <TopNav />
          <main className="mx-auto max-w-screen-2xl">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
