import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata = {
  title: "MerchHub LK | Sri Lankan Creator Marketplace",
  description: "A multi-vendor e-commerce platform connecting buyers with Sri Lankan creators, artists, and brands for unique custom merchandise.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full scroll-smooth" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={`${inter.className} min-h-screen bg-bg-dark text-text-primary flex flex-col antialiased`} suppressHydrationWarning>

        {/* Navigation bar */}
        <Navbar />

        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-6 md:px-12 py-6 flex flex-col">
          {children}
        </main>

        {/* Footer */}
        <Footer />
      </body>
    </html>
  );
}
