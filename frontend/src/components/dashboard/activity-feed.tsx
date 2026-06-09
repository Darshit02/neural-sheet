"use client"

import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { activityApi } from "@/lib/api"
import { stagger, fadeUp } from "@/lib/motion"
import Link from "next/link"
import {
  IconFileTypeCsv, IconSparkles, IconFolder,
  IconKey, IconChartBar, IconMessage2Bolt,
  IconUpload, IconTrash, IconMathFunction,
  IconWand, IconDatabase,
} from "@tabler/icons-react"

const TYPE_CONFIG: Record<string, { icon: any; color: string; verb: string }> = {
  dataset_uploaded:   { icon: IconUpload,       color: "var(--orange)", verb: "Uploaded" },
  dataset_profiled:   { icon: IconDatabase,     color: "#4ade80",       verb: "Profiled" },
  dataset_deleted:    { icon: IconTrash,        color: "#f87171",       verb: "Deleted" },
  project_created:    { icon: IconFolder,       color: "#F59E0B",       verb: "Created project" },
  project_deleted:    { icon: IconTrash,        color: "#f87171",       verb: "Deleted project" },
  provider_added:     { icon: IconKey,          color: "#EC4899",       verb: "Added provider" },
  provider_deleted:   { icon: IconTrash,        color: "#f87171",       verb: "Removed provider" },
  ai_features:        { icon: IconSparkles,     color: "#8B5CF6",       verb: "Generated features" },
  ai_hyperparams:     { icon: IconMathFunction, color: "#3B82F6",       verb: "Tuned hyperparams" },
  ai_chat:            { icon: IconMessage2Bolt, color: "#10B981",       verb: "Chatted with" },
  ai_models:          { icon: IconWand,         color: "#06B6D4",       verb: "Got model recs for" },
  visualization:      { icon: IconChartBar,     color: "#3B82F6",       verb: "Visualized" },
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function ActivityFeed() {
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["activities"],
    queryFn: () => activityApi.getActivities(15).then(r => r.data),
    refetchInterval: 30000,
  })

  if (isLoading) {
    return (
      <div className="space-y-2 px-1">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-10 rounded-lg animate-pulse" style={{ background: "var(--bg-2)" }} />
        ))}
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-[12px]" style={{ color: "var(--text-3)" }}>
          No activity yet — upload a dataset to get started.
        </p>
      </div>
    )
  }

  return (
    <motion.div
      variants={stagger(0.05)}
      initial="hidden"
      animate="show"
      className="space-y-0.5"
    >
      {activities.map((a: any, i: number) => {
        const cfg = TYPE_CONFIG[a.type] || { icon: IconDatabase, color: "var(--text-3)", verb: a.label }
        const Icon = cfg.icon

        const href = a.target_id
          ? ["dataset_profiled", "dataset_uploaded", "ai_features", "ai_hyperparams", "ai_chat", "ai_models", "visualization"].includes(a.type)
            ? `/dashboard/datasets/${a.target_id}`
            : a.type.startsWith("project")
            ? `/dashboard/projects`
            : null
          : null

        const row = (
          <motion.div
            key={a.id}
            variants={fadeUp}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors"
            onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-2)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            {/* Timeline */}
            <div className="relative flex flex-col items-center shrink-0">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: `${cfg.color}15` }}
              >
                <Icon size={12} style={{ color: cfg.color }} />
              </div>
              {i < activities.length - 1 && (
                <div
                  className="absolute top-6 left-1/2 -translate-x-1/2 w-px"
                  style={{ height: 14, background: "var(--border)" }}
                />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[12px]" style={{ color: "var(--text-2)" }}>
                <span style={{ color: "var(--text-3)" }}>{cfg.verb} </span>
                {a.target && (
                  <span style={{ color: "var(--text-1)", fontWeight: 500 }}>
                    {a.target}
                  </span>
                )}
              </p>
            </div>

            <span className="text-[11px] shrink-0" style={{ color: "var(--text-3)" }}>
              {timeAgo(a.created_at)}
            </span>
          </motion.div>
        )

        return href ? (
          <Link key={a.id} href={href}>{row}</Link>
        ) : (
          <div key={a.id}>{row}</div>
        )
      })}
    </motion.div>
  )
}
