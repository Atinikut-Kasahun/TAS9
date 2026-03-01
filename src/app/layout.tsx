import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
    title: "DROGA GROUP HIRING HUB",
    description:
        "Join a team of innovators, creators, and problem-solvers who are redefining what's possible in healthcare and technology.",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={inter.variable}>
            <body className="font-inter antialiased">
                {children}
                <Script src="https://accounts.google.com/gsi/client" strategy="beforeInteractive" />
            </body>
        </html>
    );
}
