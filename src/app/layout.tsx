import type { Metadata } from "next";
import "@/styles/index.css";
import { Toaster } from "@/app/components/ui/sonner";
import { ReduxProvider } from "@/redux/provider";
import { AuthProvider } from "@/components/AuthProvider";

export const metadata: Metadata = {
  title: "HRK Retail",
  description: "HRK Retail Management System",
  icons: {
    icon: "/ic_launcher.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ReduxProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
          <Toaster />
        </ReduxProvider>
      </body>
    </html>
  );
}
