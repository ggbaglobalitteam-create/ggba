import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import RootProviders from "@/components/providers/RootProviders";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://www.ggbaglobal.com'),
  title: "GGBA Global | Investments; Business; Education.",
  description: "Your trusted partner for international services across multiple regions",
  keywords: "digital transformation, AI automation, enterprise consulting, cloud architecture, cybersecurity, data analytics, corporate strategy, technology advisory, global consultancy, IT modernization",
  openGraph: {
    title: "GGBA Global | Investments; Business; Education.",
    description: "Your trusted partner for international services across multiple regions",
    url: "https://Ggbaglobal.example.com",
    siteName: "Ggba Global",
    images: [{ url: "/og-image.jpg" }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GGBA Global | Investments; Business; Education.",
    description: "Your trusted partner for international services across multiple regions",
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} antialiased selection:bg-accent selection:text-white bg-background text-foreground`}>
        <RootProviders>
          <Header />
          <main className="min-h-screen">
            {children}
          </main>
          <Footer />
        </RootProviders>
      </body>
    </html>
  );
}
