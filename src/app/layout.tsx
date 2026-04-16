import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import AuthOverlay from "@/components/AuthOverlay";

export const metadata: Metadata = {
  title: "FlowMind AI | Predictive Crowd Autopilot",
  description: "AI-driven decision engine for stadium crowd optimization and predictive wayfinding.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased font-sans selection:bg-primary/30">
        <AuthProvider>
          <AuthOverlay>
            {children}
          </AuthOverlay>
        </AuthProvider>
      </body>
    </html>
  );
}


