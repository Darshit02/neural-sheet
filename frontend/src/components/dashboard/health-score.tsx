"use client"

import { motion } from "framer-motion"

interface HealthScoreProps {
  dataset: any
}

function computeScore(dataset: any): { score: number; issues: string[]; label: string } {
  if (!dataset?.profile_summary) return { score: 0, issues: ["No profile data"], label: "Unknown" }

  const profile = dataset.profile_summary
  let score = 100
  const issues: string[] = []

  // Missing values
  const totalCells = profile.row_count * profile.column_count
  const totalMissing = Object.values(dataset.missing_values || {}).reduce((a: any, b: any) => a + b, 0) as number
  const missingPct = (totalMissing / totalCells) * 100
  if (missingPct > 20) { score -= 30; issues.push(`${missingPct.toFixed(1)}% missing values`) }
  else if (missingPct > 5) { score -= 15; issues.push(`${missingPct.toFixed(1)}% missing values`) }

  // Duplicates
  const dupPct = (profile.duplicate_count / profile.row_count) * 100
  if (dupPct > 10) { score -= 20; issues.push(`${dupPct.toFixed(1)}% duplicate rows`) }
  else if (dupPct > 1) { score -= 10; issues.push(`${dupPct.toFixed(1)}% duplicate rows`) }

  // Row count
  if (profile.row_count < 100) { score -= 20; issues.push("Very small dataset (<100 rows)") }
  else if (profile.row_count < 1000) { score -= 5; issues.push("Small dataset (<1k rows)") }

  score = Math.max(0, Math.min(100, score))

  const label =
    score >= 85 ? "Excellent" :
    score >= 70 ? "Good" :
    score >= 50 ? "Fair" :
    "Poor"

  return { score, issues, label }
}

export default function HealthScore({ dataset }: HealthScoreProps) {
  const { score, issues, label } = computeScore(dataset)

  const color =
    score >= 85 ? "#4ade80" :
    score >= 70 ? "var(--orange)" :
    score >= 50 ? "#facc15" :
    "#f87171"

  const circumference = 2 * Math.PI * 28
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <div
      className="rounded-xl p-5"
      style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }}
    >
      <p className="text-[12px] font-medium mb-4" style={{ color: "var(--text-2)" }}>
        Dataset health
      </p>

      <div className="flex items-center gap-5">
        {/* Circular progress */}
        <div className="relative shrink-0">
          <svg width="72" height="72" viewBox="0 0 72 72">
            {/* Track */}
            <circle
              cx="36" cy="36" r="28"
              fill="none"
              stroke="var(--bg-3)"
              strokeWidth="5"
            />
            {/* Progress */}
            <motion.circle
              cx="36" cy="36" r="28"
              fill="none"
              stroke={color}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
              transform="rotate(-90 36 36)"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-[18px] font-bold leading-none"
              style={{ color }}
            >
              {score}
            </span>
            <span className="text-[9px]" style={{ color: "var(--text-3)" }}>
              /100
            </span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p
            className="text-[15px] font-semibold mb-1"
            style={{ color }}
          >
            {label}
          </p>
          {issues.length === 0 ? (
            <p className="text-[12px]" style={{ color: "var(--text-2)" }}>
              No issues detected
            </p>
          ) : (
            <ul className="space-y-1">
              {issues.map((issue, i) => (
                <li
                  key={i}
                  className="text-[11px] flex items-center gap-1.5"
                  style={{ color: "var(--text-3)" }}
                >
                  <span style={{ color: "#facc15" }}>⚠</span>
                  {issue}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
