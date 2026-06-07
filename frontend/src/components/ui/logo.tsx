"use client"

import Link from "next/link"
import { motion } from "framer-motion"

export default function Logo({ size = "md", className = "" }: { size?: "sm" | "md" | "lg", className?: string }) {
  const sizes = {
    sm: { icon: 24, text: "text-[14px]", gap: "gap-2" },
    md: { icon: 28, text: "text-[16px]", gap: "gap-2.5" },
    lg: { icon: 32, text: "text-[20px]", gap: "gap-3" },
  }

  const { text, gap } = sizes[size]

  return (
    <Link href="/" className={`flex items-center ${gap} group ${className}`}>
      <div className={`flex flex-col leading-none`}>
        <span className={`${text} font-bold tracking-tight`} style={{ color: "var(--text-1)", transition: "color 0.3s" }}>
          Neural<span style={{ color: "var(--orange)" }}>{" "}Sheet</span>
        </span>
        <span className="text-[9px] font-medium tracking-[0.2em] uppercase mt-0.5 opacity-40" style={{ color: "var(--text-3)" }}>
          AI Data Engineer
        </span>
      </div>
    </Link>
  )
}
