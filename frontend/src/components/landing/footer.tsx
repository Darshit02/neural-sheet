"use client"

import Link from "next/link"
import { IconBrain } from "@tabler/icons-react"

const cols = {
  Product: ["Features", "Pricing", "Changelog", "Roadmap"],
  Developers: ["API Docs", "GitHub", "Examples", "Status"],
  Company: ["About", "Blog", "Careers", "Contact"],
  Legal: ["Privacy", "Terms", "Security"],
}

export default function Footer() {
  return (
    <footer
  style={{ borderTop: "1px solid var(--border)" }}
  className="border-t border-orange-400"
>
  <div className="max-w-6xl mx-auto px-6 py-16">
    <div className="flex flex-col items-center text-center mb-14">
      <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: "var(--orange)" }}
        >
          <IconBrain size={15} color="#000" />
        </div>
        <span
          className="font-semibold text-[15px]"
          style={{ color: "var(--text-1)" }}
        >
          Neural<span style={{ color: "var(--orange)" }}>Sheet</span>
        </span>
      </Link>

      <p
        className="text-[13px] leading-relaxed max-w-sm"
        style={{ color: "var(--text-3)" }}
      >
        Your AI-powered data engineer. Upload CSV, get instant insights.
      </p>
    </div>

    <div
      className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8"
      style={{ borderTop: "1px solid var(--border)" }}
    >
      <p className="text-[12px]" style={{ color: "var(--text-3)" }}>
        © 2025 NeuralSheet. All rights reserved.
      </p>

      <p className="text-[12px]" style={{ color: "var(--text-3)" }}>
        Built for data engineers everywhere
      </p>
    </div>
  </div>
</footer>
  )
}
