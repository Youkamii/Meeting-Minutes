import type { Metadata } from "next";
import { Providers } from "./providers";
import { TopNav } from "@/components/layout/top-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "회의록 - 사업관리 & 주간회의 운영",
  description:
    "사업관리 및 주간회의 추적을 위한 내부 운영 도구",
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
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
