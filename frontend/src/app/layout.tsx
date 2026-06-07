import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Providers from "@/components/providers"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "NeuralSheet — Your AI-powered Data Engineer",
  description: "Upload any CSV and get instant AI-powered profiling, feature engineering, hyperparameter tuning, and interactive visualizations.",
  keywords: ["AI", "data engineering", "CSV analysis", "machine learning", "data science"],
  openGraph: {
    title: "NeuralSheet",
    description: "Your AI-powered Data Engineer",
    type: "website",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
