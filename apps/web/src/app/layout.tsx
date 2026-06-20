import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "简单传播",
  description: "稳定、清晰的 AI 企业传播助手",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
