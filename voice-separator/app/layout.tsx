import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "播客语音分离器",
  description: "上传播客音频，智能分离两位嘉宾的语音",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
