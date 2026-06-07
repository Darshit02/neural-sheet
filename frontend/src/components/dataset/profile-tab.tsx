"use client"

import { motion } from "framer-motion"
import { stagger, fadeUp } from "@/lib/motion"
import { IconAlertTriangle, IconCircleCheck } from "@tabler/icons-react"

export default function ProfileTab({ dataset }: { dataset: any }) {
  const profile = dataset.profile_summary
  const columnInfo = profile?.column_info || []
  const missingValues = dataset.missing_values || {}
  const numericStats = dataset.numeric_stats || {}

  return (
    <div className="space-y-5">
      {/* Column info table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: "1px solid var(--border)" }}
      >
        <div
          className="px-5 py-3.5 flex items-center justify-between"
          style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-1)" }}
        >
          <p className="text-[13px] font-medium" style={{ color: "var(--text-1)" }}>
            Column overview
          </p>
          <span className="text-[12px]" style={{ color: "var(--text-3)" }}>
            {columnInfo.length} columns
          </span>
        </div>

        {/* Header */}
        <div
          className="grid grid-cols-12 gap-3 px-5 py-2.5 text-[11px] font-medium tracking-widest uppercase"
          style={{ background: "var(--bg-2)", color: "var(--text-3)", borderBottom: "1px solid var(--border)" }}
        >
          <div className="col-span-3">Column</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-2">Missing</div>
          <div className="col-span-2">Unique</div>
          <div className="col-span-3">Fill rate</div>
        </div>

        {columnInfo.map((col: any, i: number) => {
          const missingPct = col.missing_pct || 0
          const fillPct = 100 - missingPct
          return (
            <motion.div
              key={col.name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.02 }}
              className="grid grid-cols-12 gap-3 px-5 py-3 items-center"
              style={{
                borderBottom: i < columnInfo.length - 1 ? "1px solid var(--border)" : "none",
                background: "var(--bg-1)",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-2)")}
              onMouseLeave={e => (e.currentTarget.style.background = "var(--bg-1)")}
            >
              <div className="col-span-3">
                <p className="text-[13px] font-medium truncate" style={{ color: "var(--text-1)" }}>
                  {col.name}
                </p>
              </div>
              <div className="col-span-2">
                <span
                  className="text-[11px] px-2 py-0.5 rounded-md font-mono"
                  style={{
                    background: col.is_numeric ? "rgba(249,115,22,0.1)" : "var(--bg-3)",
                    color: col.is_numeric ? "var(--orange)" : "var(--text-2)",
                  }}
                >
                  {col.dtype}
                </span>
              </div>
              <div className="col-span-2">
                <span
                  className="text-[12px]"
                  style={{ color: missingPct > 10 ? "#f87171" : missingPct > 0 ? "#facc15" : "#4ade80" }}
                >
                  {missingPct.toFixed(1)}%
                </span>
              </div>
              <div className="col-span-2 text-[12px]" style={{ color: "var(--text-2)" }}>
                {col.unique_count?.toLocaleString()}
              </div>
              <div className="col-span-3">
                <div className="flex items-center gap-2">
                  <div
                    className="flex-1 h-1.5 rounded-full overflow-hidden"
                    style={{ background: "var(--bg-3)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${fillPct}%`,
                        background: fillPct > 90 ? "#4ade80" : fillPct > 70 ? "#facc15" : "#f87171",
                      }}
                    />
                  </div>
                  <span className="text-[11px] w-10 text-right" style={{ color: "var(--text-3)" }}>
                    {fillPct.toFixed(0)}%
                  </span>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Numeric stats */}
      {Object.keys(numericStats).length > 0 && (
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid var(--border)" }}
        >
          <div
            className="px-5 py-3.5"
            style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-1)" }}
          >
            <p className="text-[13px] font-medium" style={{ color: "var(--text-1)" }}>
              Numeric statistics
            </p>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="w-full text-[12px]" style={{ minWidth: 600 }}>
              <thead>
                <tr style={{ background: "var(--bg-2)", borderBottom: "1px solid var(--border)" }}>
                  {["Column", "Mean", "Std", "Min", "25%", "Median", "75%", "Max"].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left font-medium tracking-wider uppercase text-[10px]" style={{ color: "var(--text-3)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(numericStats).map(([col, stats]: [string, any], i) => (
                  <tr
                    key={col}
                    style={{
                      borderBottom: "1px solid var(--border)",
                      background: "var(--bg-1)",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-2)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "var(--bg-1)")}
                  >
                    <td className="px-4 py-3 font-medium" style={{ color: "var(--text-1)" }}>{col}</td>
                    {["mean", "std", "min", "25%", "median", "75%", "max"].map(k => (
                      <td key={k} className="px-4 py-3 font-mono" style={{ color: "var(--text-2)" }}>
                        {stats[k] != null ? Number(stats[k]).toFixed(2) : "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sample data */}
      {dataset.sample_data?.length > 0 && (
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid var(--border)" }}
        >
          <div
            className="px-5 py-3.5"
            style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-1)" }}
          >
            <p className="text-[13px] font-medium" style={{ color: "var(--text-1)" }}>
              Sample data <span className="text-[11px] ml-2" style={{ color: "var(--text-3)" }}>First 5 rows</span>
            </p>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="w-full text-[12px]" style={{ minWidth: 500 }}>
              <thead>
                <tr style={{ background: "var(--bg-2)", borderBottom: "1px solid var(--border)" }}>
                  {dataset.columns?.map((col: string) => (
                    <th key={col} className="px-4 py-2.5 text-left font-medium text-[11px] tracking-wider uppercase whitespace-nowrap" style={{ color: "var(--text-3)" }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dataset.sample_data.map((row: any, i: number) => (
                  <tr
                    key={i}
                    style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-1)" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-2)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "var(--bg-1)")}
                  >
                    {dataset.columns?.map((col: string) => (
                      <td key={col} className="px-4 py-2.5 font-mono whitespace-nowrap max-w-[150px] truncate" style={{ color: "var(--text-2)" }}>
                        {row[col] != null ? String(row[col]) : <span style={{ color: "var(--text-3)" }}>null</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
