import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Drivers Connect CRM",
  description: "Driver management CRM for logistics operations",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="app">
            <Sidebar />
            <div className="main">
              {children}
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
