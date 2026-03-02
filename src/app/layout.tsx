import type { Metadata } from "next";
import "@/styles/index.css";
import { Toaster } from "@/app/components/ui/sonner";

export const metadata: Metadata = {
  title: "Design Beautiful UI",
  description: "Design Beautiful UI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
