"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { datasetsApi, vizApi, aiApi } from "@/lib/api"
import { fadeUp, stagger } from "@/lib/motion"
import { formatBytes, formatDate } from "@/lib/utils"
import { toast } from "sonner"
import {
  IconArrowLeft, IconFileTypeCsv, IconCircleCheck,
  IconClock, IconAlertCircle, IconChartBar,
  IconDatabase, IconSparkles, IconMathFunction,
  IconMessage2Bolt, IconWand, IconRefresh,
  IconTable, IconChartDots, IconBrain,
} from "@tabler/icons-react"
import Link from "next/link"
import ProfileTab from "@/components/dataset/profile-tab"
import ChartsTab from "@/components/dataset/charts-tab"
import AITab from "@/components/dataset/ai-tab"

const tabs = [
  { id: "profile",  icon: IconDatabase,  label: "Profile" },
  { id: "charts",   icon: IconChartBar,  label: "Charts" },
  { id: "features", icon: IconSparkles,  label: "Features" },
  { id: "hyperparams", icon: IconMathFunction, label: "Hyperparams" },
  { id: "chat",     icon: IconMessage2Bolt,     label: "AI Chat" },
  { id: "models",   icon: IconWand,      label: "Models" },
]

const statusConfig = {
  ready:      { icon: IconCircleCheck, color: "#4ade80", label: "Ready" },
  processing: { icon: IconClock,        color: "#facc15", label: "Processing" },
  failed:     { icon: IconAlertCircle,  color: "#f87171", label: "Failed" },
  pending:    { icon: IconClock,        color: "var(--text-3)", label: "Pending" },
}

export default function DatasetDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("profile")

  const { data: dataset, isLoading } = useQuery({
    queryKey: ["dataset", id],
    queryFn: () => datasetsApi.get(Number(id)).then(r => r.data),
  })

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-7xl mx-auto">
        <div className="h-8 w-48 rounded-lg animate-pulse" style={{ background: "var(--bg-1)" }} />
        <div className="h-32 rounded-xl animate-pulse" style={{ background: "var(--bg-1)" }} />
        <div className="h-96 rounded-xl animate-pulse" style={{ background: "var(--bg-1)" }} />
      </div>
    )
  }

  if (!dataset) return null

  const sc = statusConfig[dataset.status as keyof typeof statusConfig] || statusConfig.pending

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Back */}
      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <Link
          href="/dashboard/datasets"
          className="inline-flex items-center gap-1.5 text-[13px] transition-colors mb-2"
          style={{ color: "var(--text-3)" }}
        >
          <IconArrowLeft size={14} />
          Back to datasets
        </Link>
      </motion.div>

      {/* Dataset header card */}
      <motion.div
        variants={fadeUp} initial="hidden" animate="show"
        className="rounded-xl p-5"
        style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "var(--bg-2)" }}
            >
              <IconFileTypeCsv size={22} style={{ color: "var(--orange)" }} />
            </div>
            <div>
              <h2 className="text-[18px] font-semibold mb-0.5" style={{ color: "var(--text-1)" }}>
                {dataset.name}
              </h2>
              <p className="text-[12px]" style={{ color: "var(--text-3)" }}>
                {dataset.original_filename} · Uploaded {formatDate(dataset.created_at)}
              </p>
            </div>
          </div>

          {/* Status badge */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg shrink-0"
            style={{
              background: `${sc.color}15`,
              border: `1px solid ${sc.color}30`,
            }}
          >
            <sc.icon size={12} style={{ color: sc.color }} />
            <span className="text-[12px] font-medium" style={{ color: sc.color }}>
              {sc.label}
            </span>
          </div>
        </div>

        {/* Stats row */}
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 pt-5"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          {[
            { label: "Rows", value: dataset.row_count?.toLocaleString() || "—" },
            { label: "Columns", value: dataset.column_count || "—" },
            { label: "File size", value: dataset.file_size_bytes ? formatBytes(dataset.file_size_bytes) : "—" },
            { label: "Missing values", value: dataset.profile_summary ? `${Object.values(dataset.missing_values || {}).reduce((a: any, b: any) => a + b, 0)} cells` : "—" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-[11px] mb-1" style={{ color: "var(--text-3)" }}>{s.label}</p>
              <p className="text-[18px] font-semibold" style={{ color: "var(--text-1)" }}>{s.value}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <div
          className="flex gap-1 p-1 rounded-xl w-fit"
          style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] transition-all"
              style={{
                background: activeTab === tab.id ? "var(--bg-3)" : "transparent",
                color: activeTab === tab.id ? "var(--text-1)" : "var(--text-3)",
                fontWeight: activeTab === tab.id ? 500 : 400,
                border: activeTab === tab.id ? "1px solid var(--border-hover)" : "1px solid transparent",
              }}
            >
              <tab.icon size={14} style={{ color: activeTab === tab.id ? "var(--orange)" : "inherit" }} />
              {tab.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Tab content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === "profile" && <ProfileTab dataset={dataset} />}
        {activeTab === "charts" && <ChartsTab datasetId={Number(id)} dataset={dataset} />}
        {(activeTab === "features" || activeTab === "hyperparams" || activeTab === "chat" || activeTab === "models") && (
          <AITab datasetId={Number(id)} activeTab={activeTab} dataset={dataset} />
        )}
      </motion.div>
    </div>
  )
}
