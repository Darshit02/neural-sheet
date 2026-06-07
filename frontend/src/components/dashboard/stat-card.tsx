"use client"

import { motion } from "framer-motion"
import { scaleIn } from "@/lib/motion"

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  subColor?: string
  icon?: React.ReactNode
}

export default function StatCard({ label, value, sub, subColor, icon }: StatCardProps) {
  return (
    <motion.div
      variants={scaleIn}
      className="rounded-xl p-5 flex flex-col gap-3"
      style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-start justify-between">
        <p className="text-[12px]" style={{ color: "var(--text-3)" }}>{label}</p>
        {icon && (
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "var(--bg-3)" }}
          >
            {icon}
          </div>
        )}
      </div>
      <div>
        <p className="text-[28px] font-semibold tracking-tight leading-none mb-1" style={{ color: "var(--text-1)" }}>
          {value}
        </p>
        {sub && (
          <p className="text-[12px]" style={{ color: subColor || "var(--text-3)" }}>
            {sub}
          </p>
        )}
      </div>
    </motion.div>
  )
}
