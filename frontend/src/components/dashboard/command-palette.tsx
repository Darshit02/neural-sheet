"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useQuery } from "@tanstack/react-query"
import { datasetsApi, projectsApi } from "@/lib/api"
import { useRouter } from "next/navigation"
import {
  IconSearch, IconFileTypeCsv, IconFolder,
  IconChartBar, IconSparkles, IconSettings,
  IconArrowRight, IconCommand, IconX,
  IconDatabase, IconApi, IconUser,
  IconLayoutDashboard, IconRobot,
} from "@tabler/icons-react"

const STATIC_COMMANDS = [
  { id: "dashboard", icon: IconLayoutDashboard, label: "Go to Overview", href: "/dashboard", group: "Navigation" },
  { id: "datasets", icon: IconDatabase, label: "Go to Datasets", href: "/dashboard/datasets", group: "Navigation" },
  { id: "projects", icon: IconFolder, label: "Go to Projects", href: "/dashboard/projects", group: "Navigation" },
  { id: "viz", icon: IconChartBar, label: "Go to Visualizations", href: "/dashboard/visualizations", group: "Navigation" },
  { id: "ai", icon: IconRobot, label: "Go to AI Analysis", href: "/dashboard/ai", group: "Navigation" },
  { id: "providers", icon: IconApi, label: "Manage API Providers", href: "/dashboard/settings/providers", group: "Settings" },
  { id: "profile", icon: IconUser, label: "Edit Profile", href: "/dashboard/settings/profile", group: "Settings" },
  { id: "settings", icon: IconSettings, label: "Open Settings", href: "/dashboard/settings", group: "Settings" },
]

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

export default function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const { data: datasets = [] } = useQuery({
    queryKey: ["datasets"],
    queryFn: () => datasetsApi.list().then(r => r.data),
    enabled: open,
  })

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectsApi.list().then(r => r.data),
    enabled: open,
  })

  const datasetCommands = datasets.map((d: any) => ({
    id: `dataset-${d.id}`,
    icon: IconFileTypeCsv,
    label: d.name,
    sub: `${d.row_count?.toLocaleString() || "—"} rows · ${d.column_count || "—"} cols`,
    href: `/dashboard/datasets/${d.id}`,
    group: "Datasets",
  }))

  const projectCommands = projects.map((p: any) => ({
    id: `project-${p.id}`,
    icon: IconFolder,
    label: p.name,
    sub: `${p.dataset_count} datasets`,
    href: `/dashboard/projects/${p.id}`,
    group: "Projects",
    color: p.color,
  }))

  const all = [...STATIC_COMMANDS, ...datasetCommands, ...projectCommands]

  const filtered = query.trim()
    ? all.filter(c =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        (c as any).group?.toLowerCase().includes(query.toLowerCase())
      )
    : all

  // Group results
  const grouped = filtered.reduce((acc: Record<string, typeof filtered>, item) => {
    const g = (item as any).group || "Other"
    if (!acc[g]) acc[g] = []
    acc[g].push(item)
    return acc
  }, {})

  const flat = Object.values(grouped).flat()

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery("")
      setSelected(0)
    }
  }, [open])

  useEffect(() => { setSelected(0) }, [query])

  const handleSelect = (item: (typeof flat)[0]) => {
    router.push(item.href)
    onClose()
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open) return
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelected(s => Math.min(s + 1, flat.length - 1))
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelected(s => Math.max(s - 1, 0))
      }
      if (e.key === "Enter") {
        e.preventDefault()
        if (flat[selected]) handleSelect(flat[selected])
      }
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open, flat, selected])

  // Scroll selected into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${selected}"]`)
    el?.scrollIntoView({ block: "nearest" })
  }, [selected])

  let idx = 0

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-100 flex items-start justify-center pt-[15vh] px-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
          onClick={e => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }}
          >
            {/* Search input */}
            <div
              className="flex items-center gap-3 px-4 py-3.5"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <IconSearch size={16} style={{ color: "var(--text-3)", flexShrink: 0 }} />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search datasets, projects, pages..."
                className="flex-1 bg-transparent outline-none text-[14px]"
                style={{ color: "var(--text-1)" }}
              />
              {query && (
                <button onClick={() => setQuery("")} style={{ color: "var(--text-3)" }}>
                  <IconX size={14} />
                </button>
              )}
              <kbd
                className="text-[11px] px-1.5 py-0.5 rounded"
                style={{ background: "var(--bg-3)", color: "var(--text-3)", border: "1px solid var(--border)" }}
              >
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div ref={listRef} className="overflow-y-auto" style={{ maxHeight: 420 }}>
              {flat.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-[13px]" style={{ color: "var(--text-3)" }}>
                    No results for "{query}"
                  </p>
                </div>
              ) : (
                Object.entries(grouped).map(([group, items]) => (
                  <div key={group}>
                    <p
                      className="px-4 pt-3 pb-1 text-[10px] font-medium tracking-widest uppercase"
                      style={{ color: "var(--text-3)" }}
                    >
                      {group}
                    </p>
                    {items.map(item => {
                      const currentIdx = idx++
                      const isSelected = selected === currentIdx
                      return (
                        <button
                          key={item.id}
                          data-idx={currentIdx}
                          onClick={() => handleSelect(item)}
                          onMouseEnter={() => setSelected(currentIdx)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                          style={{
                            background: isSelected ? "var(--bg-2)" : "transparent",
                          }}
                        >
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                            style={{
                              background: isSelected
                                ? "var(--orange-dim)"
                                : "var(--bg-3)",
                              border: isSelected ? "1px solid var(--orange-border)" : "none",
                            }}
                          >
                            <item.icon
                              size={14}
                              style={{ color: isSelected ? "var(--orange)" : "var(--text-3)" }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className="text-[13px] truncate"
                              style={{
                                color: isSelected ? "var(--text-1)" : "var(--text-2)",
                                fontWeight: isSelected ? 500 : 400,
                              }}
                            >
                              {item.label}
                            </p>
                            {(item as any).sub && (
                              <p className="text-[11px] truncate" style={{ color: "var(--text-3)" }}>
                                {(item as any).sub}
                              </p>
                            )}
                          </div>
                          {isSelected && (
                            <IconArrowRight size={13} style={{ color: "var(--text-3)", flexShrink: 0 }} />
                          )}
                        </button>
                      )
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div
              className="flex items-center gap-4 px-4 py-2.5"
              style={{ borderTop: "1px solid var(--border)", background: "var(--bg-2)" }}
            >
              {[
                { keys: ["↑", "↓"], label: "Navigate" },
                { keys: ["↵"], label: "Open" },
                { keys: ["ESC"], label: "Close" },
              ].map(({ keys, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className="flex gap-1">
                    {keys.map(k => (
                      <kbd
                        key={k}
                        className="text-[10px] px-1.5 py-0.5 rounded"
                        style={{
                          background: "var(--bg-3)",
                          color: "var(--text-3)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                  <span className="text-[11px]" style={{ color: "var(--text-3)" }}>
                    {label}
                  </span>
                </div>
              ))}
              <div className="ml-auto flex items-center gap-1.5">
                <IconCommand size={11} style={{ color: "var(--text-3)" }} />
                <span className="text-[11px]" style={{ color: "var(--text-3)" }}>
                  NeuralSheet
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
