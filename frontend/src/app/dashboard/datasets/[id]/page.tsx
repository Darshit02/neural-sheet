"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { datasetsApi } from "@/lib/api"
import { fadeUp } from "@/lib/motion"
import { formatBytes, formatDate } from "@/lib/utils"
import {
  IconArrowLeft, IconFileTypeCsv,
  IconCircleCheck, IconClock, IconAlertCircle,
  IconDatabase, IconChartBar, IconSparkles,
  IconMathFunction, IconRobot, IconWand,
  IconBrush, IconFileText, IconTransform,
  IconGitMerge, IconShieldCheck,
  IconMessage2Bolt,
} from "@tabler/icons-react"
import Link from "next/link"
import ProfileTab    from "@/components/dataset/profile-tab"
import ChartsTab     from "@/components/dataset/charts-tab"
import AITab         from "@/components/dataset/ai-tab"
import CleanTab      from "@/components/dataset/clean-tab"
import ReportTab     from "@/components/dataset/report-tab"
import TransformTab  from "@/components/dataset/transform-tab"
import MergeTab      from "@/components/dataset/merge-tab"
import SchemaTab     from "@/components/dataset/schema-tab"

const tabs = [
  { id: "profile",     icon: IconDatabase,     label: "Profile" },
  { id: "report",      icon: IconFileText,      label: "AI Report",   badge: "AI" },
  { id: "clean",       icon: IconBrush,         label: "Clean" },
  { id: "transform",   icon: IconTransform,     label: "Transform" },
  { id: "merge",       icon: IconGitMerge,      label: "Merge" },
  { id: "schema",      icon: IconShieldCheck,   label: "Schema" },
  { id: "charts",      icon: IconChartBar,      label: "Charts" },
  { id: "features",    icon: IconSparkles,      label: "Features",   badge: "AI" },
  { id: "hyperparams", icon: IconMathFunction,  label: "Hyperparams", badge: "AI" },
  { id: "chat",        icon: IconMessage2Bolt,         label: "AI Chat",    badge: "AI" },
  { id: "models",      icon: IconWand,          label: "Models",     badge: "AI" },
]

const statusConfig = {
  ready:      { icon: IconCircleCheck, color: "#4ade80", label: "Ready" },
  processing: { icon: IconClock,       color: "#facc15", label: "Processing" },
  failed:     { icon: IconAlertCircle, color: "#f87171", label: "Failed" },
  pending:    { icon: IconClock,       color: "var(--text-3)", label: "Pending" },
}

export default function DatasetDetailPage() {
  const { id }   = useParams()
  const [activeTab, setActiveTab] = useState("profile")

  const { data: dataset, isLoading } = useQuery({
    queryKey: ["dataset", id],
    queryFn: () => datasetsApi.get(Number(id)).then(r => r.data),
  })

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-7xl mx-auto">
        {[8, 32, 96].map((h, i) => (
          <div key={i} className={`h-${h} rounded-xl animate-pulse`} style={{ background: "var(--bg-1)" }} />
        ))}
      </div>
    )
  }

  if (!dataset) return null

  const sc = statusConfig[dataset.status as keyof typeof statusConfig] || statusConfig.pending

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <Link href="/dashboard/datasets" className="inline-flex items-center gap-1.5 text-[13px] mb-2" style={{ color: "var(--text-3)" }}>
          <IconArrowLeft size={14} /> Back to datasets
        </Link>
      </motion.div>

      {/* Header */}
      <motion.div variants={fadeUp} initial="hidden" animate="show"
        className="rounded-xl p-5"
        style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--bg-2)" }}>
              <IconFileTypeCsv size={22} style={{ color: "var(--orange)" }} />
            </div>
            <div>
              <h2 className="text-[18px] font-semibold mb-0.5" style={{ color: "var(--text-1)" }}>{dataset.name}</h2>
              <p className="text-[12px]" style={{ color: "var(--text-3)" }}>
                {dataset.original_filename} · Uploaded {formatDate(dataset.created_at)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg shrink-0"
            style={{ background: `${sc.color}15`, border: `1px solid ${sc.color}30` }}>
            <sc.icon size={12} style={{ color: sc.color }} />
            <span className="text-[12px] font-medium" style={{ color: sc.color }}>{sc.label}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 pt-5" style={{ borderTop: "1px solid var(--border)" }}>
          {[
            { label: "Rows",    value: dataset.row_count?.toLocaleString() || "—" },
            { label: "Columns", value: dataset.column_count || "—" },
            { label: "Size",    value: dataset.file_size_bytes ? formatBytes(dataset.file_size_bytes) : "—" },
            { label: "Missing", value: dataset.missing_values
                ? `${Object.values(dataset.missing_values).reduce((a: any, b: any) => a + b, 0)} cells`
                : "—" },
          ].map(s => (
            <div key={s.label}>
              <p className="text-[11px] mb-1" style={{ color: "var(--text-3)" }}>{s.label}</p>
              <p className="text-[18px] font-semibold" style={{ color: "var(--text-1)" }}>{s.value}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <div className="flex gap-1 p-1 rounded-xl overflow-x-auto"
          style={{ background: "var(--bg-1)", border: "1px solid var(--border)", width: "fit-content" }}
        >
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] transition-all whitespace-nowrap relative"
              style={{
                background: activeTab === tab.id ? "var(--bg-3)" : "transparent",
                color: activeTab === tab.id ? "var(--text-1)" : "var(--text-3)",
                fontWeight: activeTab === tab.id ? 500 : 400,
                border: activeTab === tab.id ? "1px solid var(--border-hover)" : "1px solid transparent",
              }}
            >
              <tab.icon size={13} style={{ color: activeTab === tab.id ? "var(--orange)" : "inherit" }} />
              {tab.label}
              {tab.badge && (
                <span className="text-[9px] px-1 py-0.5 rounded font-medium"
                  style={{ background: "var(--orange-dim)", color: "var(--orange)", marginLeft: 2 }}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Content */}
      <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        {activeTab === "profile"     && <ProfileTab   dataset={dataset} />}
        {activeTab === "report"      && <ReportTab    datasetId={Number(id)} dataset={dataset} />}
        {activeTab === "clean"       && <CleanTab     datasetId={Number(id)} dataset={dataset} />}
        {activeTab === "transform"   && <TransformTab datasetId={Number(id)} dataset={dataset} />}
        {activeTab === "merge"       && <MergeTab     datasetId={Number(id)} dataset={dataset} />}
        {activeTab === "schema"      && <SchemaTab    datasetId={Number(id)} dataset={dataset} />}
        {activeTab === "charts"      && <ChartsTab    datasetId={Number(id)} dataset={dataset} />}
        {(["features","hyperparams","chat","models"].includes(activeTab)) && (
          <AITab datasetId={Number(id)} activeTab={activeTab} dataset={dataset} />
        )}
      </motion.div>
    </div>
  )
}
