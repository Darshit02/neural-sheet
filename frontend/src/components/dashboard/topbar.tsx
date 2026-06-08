"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { useAuthStore } from "@/store/auth"
import { useQuery } from "@tanstack/react-query"
import { datasetsApi, activityApi } from "@/lib/api"
import CommandPalette from "./command-palette"
import NotificationsPanel from "./notifications"
import { IconBell, IconSearch, IconCommand, IconUpload } from "@tabler/icons-react"
import Link from "next/link"

const PAGE_TITLES: Record<string, { title: string; desc: string }> = {
  "/dashboard":                      { title: "Overview",        desc: "Your data engineering workspace" },
  "/dashboard/projects":             { title: "Projects",        desc: "Organise your datasets" },
  "/dashboard/datasets":             { title: "Datasets",        desc: "Upload and manage CSV files" },
  "/dashboard/visualizations":       { title: "Visualizations",  desc: "Interactive charts and insights" },
  "/dashboard/ai":                   { title: "AI Analysis",     desc: "Feature engineering, tuning, and chat" },
  "/dashboard/settings":             { title: "Settings",        desc: "Manage your account" },
  "/dashboard/settings/profile":     { title: "Profile",         desc: "Personal information" },
  "/dashboard/settings/providers":   { title: "API Providers",   desc: "Manage your AI keys" },
  "/dashboard/settings/security":    { title: "Security",        desc: "Password and sessions" },
}

export default function Topbar() {
  const pathname  = usePathname()
  const { user }  = useAuthStore()
  const [cmdOpen,   setCmdOpen]   = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [time, setTime] = useState(new Date())

  const page = PAGE_TITLES[pathname] || { title: "Dashboard", desc: "" }

  const { data: datasets = [] } = useQuery({
    queryKey: ["datasets"],
    queryFn: () => datasetsApi.list().then(r => r.data),
  })

  const { data: unreadData } = useQuery({
    queryKey: ["unread-count"],
    queryFn: () => activityApi.getUnreadCount().then(r => r.data),
    refetchInterval: 30000,
  })

  const unreadCount = unreadData?.count || 0

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setCmdOpen(prev => !prev)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  const timeStr = time.toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit", hour12: false,
  })

  return (
    <>
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />

      <header
        className="h-14 flex items-center justify-between px-6 shrink-0 relative"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-1)" }}
      >
        {/* Left */}
        <div className="flex flex-col justify-center">
          <motion.h1
            key={pathname}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="text-[14px] font-semibold leading-tight"
            style={{ color: "var(--text-1)" }}
          >
            {page.title}
          </motion.h1>
          {page.desc && (
            <motion.p
              key={pathname + "d"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25, delay: 0.05 }}
              className="text-[11px] leading-tight hidden md:block"
              style={{ color: "var(--text-3)" }}
            >
              {page.desc}
            </motion.p>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* Live clock */}
          <div
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
            style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}
          >
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#4ade80" }} />
            <span className="text-[12px] font-mono" style={{ color: "var(--text-2)" }}>{timeStr}</span>
          </div>

          {/* Dataset chip */}
          {datasets.length > 0 && (
            <div
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
              style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}
            >
              <span className="text-[12px]" style={{ color: "var(--text-3)" }}>
                {datasets.length} dataset{datasets.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}

          {/* Search */}
          <button
            onClick={() => setCmdOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] transition-all"
            style={{
              background: "var(--bg-2)",
              border: "1px solid var(--border)",
              color: "var(--text-3)",
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--border-hover)")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
          >
            <IconSearch size={13} />
            <span className="hidden sm:inline">Search</span>
            <div className="hidden sm:flex items-center gap-0.5 ml-1">
              <kbd className="text-[10px] px-1 py-0.5 rounded" style={{ background: "var(--bg-3)", border: "1px solid var(--border)" }}>
                <IconCommand size={9} className="inline" />
              </kbd>
              <kbd className="text-[10px] px-1 py-0.5 rounded" style={{ background: "var(--bg-3)", border: "1px solid var(--border)" }}>
                K
              </kbd>
            </div>
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative w-8 h-8 rounded-lg flex items-center justify-center transition-all"
              style={{
                background: notifOpen ? "var(--orange-dim)" : "var(--bg-2)",
                border: `1px solid ${notifOpen ? "var(--orange-border)" : "var(--border)"}`,
              }}
            >
              <IconBell size={14} style={{ color: notifOpen ? "var(--orange)" : "var(--text-2)" }} />
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
                  style={{ background: "var(--orange)", color: "#000" }}
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </motion.span>
              )}
            </button>
            <NotificationsPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
          </div>

          {/* Quick upload */}
          <Link
            href="/dashboard/datasets"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all"
            style={{ background: "var(--orange)", color: "#000" }}
          >
            <IconUpload size={13} />
            Upload
          </Link>
        </div>
      </header>
    </>
  )
}
