"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useQuery } from "@tanstack/react-query"
import { useAuthStore } from "@/store/auth"
import { datasetsApi, projectsApi } from "@/lib/api"
import { stagger, fadeUp, scaleIn } from "@/lib/motion"
import StatCard from "@/components/dashboard/stat-card"
import ActivityFeed from "@/components/dashboard/activity-feed"
import HealthScore from "@/components/dashboard/health-score"
import Link from "next/link"
import { formatBytes, formatDate } from "@/lib/utils"
import {
  IconDatabase, IconFolder, IconSparkles,
  IconPlus, IconArrowRight, IconFileTypeCsv,
  IconBrain, IconApi, IconCircleCheck,
  IconClock, IconAlertCircle, IconChartBar,
  IconTrendingUp,
} from "@tabler/icons-react"

const statusConfig = {
  ready:      { icon: IconCircleCheck, color: "#4ade80", label: "Ready" },
  processing: { icon: IconClock,        color: "#facc15", label: "Processing" },
  failed:     { icon: IconAlertCircle,  color: "#f87171", label: "Failed" },
  pending:    { icon: IconClock,        color: "var(--text-3)", label: "Pending" },
}

export default function DashboardPage() {
  const { user } = useAuthStore()

  const { data: datasets = [] } = useQuery({
    queryKey: ["datasets"],
    queryFn: () => datasetsApi.list().then(r => r.data),
  })

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectsApi.list().then(r => r.data),
  })

  const totalRows = datasets.reduce((s: number, d: any) => s + (d.row_count || 0), 0)
  const readyDatasets = datasets.filter((d: any) => d.status === "ready")
  const latestDataset = readyDatasets[0]

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return "Good morning"
    if (h < 18) return "Good afternoon"
    return "Good evening"
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Welcome banner */}
      <motion.div
        variants={fadeUp} initial="hidden" animate="show"
        className="rounded-2xl p-6 relative overflow-hidden"
        style={{
          background: "var(--bg-1)",
          border: "1px solid rgba(249,115,22,0.12)",
        }}
      >
        {/* Subtle bg glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 60% 80% at 100% 50%, rgba(249,115,22,0.04), transparent)",
          }}
        />
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div>
            <h2
              className="text-[20px] font-semibold tracking-tight mb-1"
              style={{ color: "var(--text-1)" }}
            >
              {greeting()}, {user?.full_name?.split(" ")[0] || "there"} 👋
            </h2>
            <p className="text-[13px]" style={{ color: "var(--text-2)" }}>
              {readyDatasets.length > 0
                ? `You have ${readyDatasets.length} dataset${readyDatasets.length !== 1 ? "s" : ""} ready to analyze.`
                : "Upload your first CSV to get started with AI-powered analysis."}
            </p>
          </div>
          <Link
            href="/dashboard/datasets"
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium"
            style={{ background: "var(--orange)", color: "#000" }}
          >
            <IconPlus size={14} />
            Upload CSV
          </Link>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        variants={stagger(0.07)} initial="hidden" animate="show"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatCard
          label="Total datasets"
          value={datasets.length}
          sub={`${readyDatasets.length} ready`}
          subColor="#4ade80"
          icon={<IconDatabase size={14} style={{ color: "var(--orange)" }} />}
        />
        <StatCard
          label="Projects"
          value={projects.length}
          sub="Organise your work"
          icon={<IconFolder size={14} style={{ color: "var(--orange)" }} />}
        />
        <StatCard
          label="Total rows"
          value={totalRows > 1000 ? `${(totalRows / 1000).toFixed(1)}k` : totalRows || "—"}
          sub="Across all datasets"
          icon={<IconChartBar size={14} style={{ color: "var(--orange)" }} />}
        />
        <StatCard
          label="AI analyses"
          value={readyDatasets.length > 0 ? "Ready" : "—"}
          sub="Features · Hyperparams · Chat"
          icon={<IconSparkles size={14} style={{ color: "var(--orange)" }} />}
        />
      </motion.div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent datasets */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.15 }}
          className="lg:col-span-2 rounded-xl overflow-hidden"
          style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }}
        >
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <p className="text-[13px] font-medium" style={{ color: "var(--text-1)" }}>
              Recent datasets
            </p>
            <Link
              href="/dashboard/datasets"
              className="text-[12px] flex items-center gap-1"
              style={{ color: "var(--text-3)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--orange)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--text-3)")}
            >
              View all <IconArrowRight size={12} />
            </Link>
          </div>

          {datasets.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <IconFileTypeCsv size={24} className="mx-auto mb-3" style={{ color: "var(--text-3)" }} />
              <p className="text-[13px] mb-1" style={{ color: "var(--text-1)" }}>No datasets yet</p>
              <p className="text-[12px] mb-4" style={{ color: "var(--text-3)" }}>
                Upload a CSV to start analyzing
              </p>
              <Link
                href="/dashboard/datasets"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-medium"
                style={{ background: "var(--orange)", color: "#000" }}
              >
                Upload CSV
              </Link>
            </div>
          ) : (
            <div>
              {datasets.slice(0, 6).map((d: any, i: number) => {
                const sc = statusConfig[d.status as keyof typeof statusConfig] || statusConfig.pending
                return (
                  <Link
                    key={d.id}
                    href={`/dashboard/datasets/${d.id}`}
                    className="flex items-center gap-4 px-5 py-3.5 transition-colors"
                    style={{
                      borderBottom: i < Math.min(datasets.length, 6) - 1 ? "1px solid var(--border)" : "none",
                      display: "flex",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-2)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: "var(--bg-3)" }}
                    >
                      <IconFileTypeCsv size={15} style={{ color: "var(--orange)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium truncate" style={{ color: "var(--text-1)" }}>
                        {d.name}
                      </p>
                      <p className="text-[11px]" style={{ color: "var(--text-3)" }}>
                        {d.row_count ? `${d.row_count.toLocaleString()} rows` : "—"}
                        {d.column_count ? ` · ${d.column_count} cols` : ""}
                        {d.file_size_bytes ? ` · ${formatBytes(d.file_size_bytes)}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <sc.icon size={12} style={{ color: sc.color }} />
                      <span className="text-[11px]" style={{ color: sc.color }}>{sc.label}</span>
                    </div>
                    <p className="text-[11px] shrink-0 hidden md:block" style={{ color: "var(--text-3)" }}>
                      {formatDate(d.created_at)}
                    </p>
                    <IconArrowRight size={13} style={{ color: "var(--text-3)", flexShrink: 0 }} />
                  </Link>
                )
              })}
            </div>
          )}
        </motion.div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Health score for latest dataset */}
          {latestDataset && (
            <motion.div
              variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.2 }}
            >
              <HealthScore dataset={latestDataset} />
            </motion.div>
          )}

          {/* Quick actions */}
          <motion.div
            variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.25 }}
            className="rounded-xl overflow-hidden"
            style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }}
          >
            <div
              className="px-5 py-3.5"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <p className="text-[13px] font-medium" style={{ color: "var(--text-1)" }}>
                Quick actions
              </p>
            </div>
            <div className="p-2 space-y-0.5">
              {[
                { icon: IconDatabase, label: "Upload dataset", sub: "CSV up to 50MB", href: "/dashboard/datasets" },
                { icon: IconApi, label: "Add AI provider", sub: "Anthropic, OpenAI...", href: "/dashboard/settings/providers" },
                { icon: IconFolder, label: "New project", sub: "Organise datasets", href: "/dashboard/projects" },
                { icon: IconBrain, label: "Run AI analysis", sub: "Features & hyperparams", href: "/dashboard/ai" },
              ].map((a) => (
                <Link
                  key={a.label}
                  href={a.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors"
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-2)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: "var(--bg-3)" }}
                  >
                    <a.icon size={13} style={{ color: "var(--orange)" }} />
                  </div>
                  <div>
                    <p className="text-[12px] font-medium" style={{ color: "var(--text-1)" }}>
                      {a.label}
                    </p>
                    <p className="text-[11px]" style={{ color: "var(--text-3)" }}>
                      {a.sub}
                    </p>
                  </div>
                  <IconArrowRight size={12} className="ml-auto" style={{ color: "var(--text-3)" }} />
                </Link>
              ))}
            </div>
          </motion.div>

          {/* API key nudge */}
          {!user?.has_api_key && (
            <motion.div
              variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.3 }}
              className="rounded-xl p-4"
              style={{ background: "var(--orange-dim)", border: "1px solid var(--orange-border)" }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "rgba(249,115,22,0.2)" }}
                >
                  <IconApi size={15} style={{ color: "var(--orange)" }} />
                </div>
                <div>
                  <p className="text-[13px] font-medium mb-1" style={{ color: "var(--text-1)" }}>
                    Add an AI key
                  </p>
                  <p className="text-[12px] mb-3" style={{ color: "var(--text-2)" }}>
                    Connect Anthropic, OpenAI, Gemini or others to unlock AI analysis.
                  </p>
                  <Link
                    href="/dashboard/settings/providers"
                    className="inline-flex items-center gap-1.5 text-[12px] font-medium"
                    style={{ color: "var(--orange)" }}
                  >
                    Add key <IconArrowRight size={12} />
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Bottom row — activity + projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent activity */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.3 }}
          className="rounded-xl overflow-hidden"
          style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }}
        >
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <p className="text-[13px] font-medium" style={{ color: "var(--text-1)" }}>
              Recent activity
            </p>
            <IconTrendingUp size={14} style={{ color: "var(--text-3)" }} />
          </div>
          <div className="px-3 py-3">
            <ActivityFeed />
          </div>
        </motion.div>

        {/* Projects */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.35 }}
          className="rounded-xl overflow-hidden"
          style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }}
        >
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <p className="text-[13px] font-medium" style={{ color: "var(--text-1)" }}>
              Projects
            </p>
            <Link
              href="/dashboard/projects"
              className="text-[12px] flex items-center gap-1"
              style={{ color: "var(--text-3)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--orange)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--text-3)")}
            >
              View all <IconArrowRight size={12} />
            </Link>
          </div>
          {projects.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-[13px] mb-3" style={{ color: "var(--text-3)" }}>
                No projects yet
              </p>
              <Link
                href="/dashboard/projects"
                className="text-[12px] font-medium"
                style={{ color: "var(--orange)" }}
              >
                Create one →
              </Link>
            </div>
          ) : (
            <div>
              {projects.slice(0, 5).map((p: any, i: number) => (
                <Link
                  key={p.id}
                  href={`/dashboard/projects`}
                  className="flex items-center gap-3 px-5 py-3.5 transition-colors"
                  style={{
                    borderBottom: i < Math.min(projects.length, 5) - 1 ? "1px solid var(--border)" : "none",
                    display: "flex",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-2)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${p.color || "var(--orange)"}15` }}
                  >
                    <IconFolder size={13} style={{ color: p.color || "var(--orange)" }} />
                  </div>
                  <p className="text-[13px] flex-1 truncate" style={{ color: "var(--text-1)" }}>
                    {p.name}
                  </p>
                  <span className="text-[11px] shrink-0" style={{ color: "var(--text-3)" }}>
                    {p.dataset_count} datasets
                  </span>
                </Link>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
