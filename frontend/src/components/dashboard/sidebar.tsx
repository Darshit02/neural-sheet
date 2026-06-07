"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useAuthStore } from "@/store/auth"
import { authApi } from "@/lib/api"
import { useRouter } from "next/navigation"
import {
  IconBrain, IconLayoutDashboard, IconFolder,
  IconDatabase, IconChartBar, IconSettings,
  IconLogout, IconChevronDown, IconPlus,
  IconSparkles, IconApi, IconUser,
  IconSearch, IconBell,
} from "@tabler/icons-react"

const navSections = [
  {
    label: "Main",
    items: [
      { icon: IconLayoutDashboard, label: "Overview", href: "/dashboard" },
      { icon: IconFolder, label: "Projects", href: "/dashboard/projects" },
      { icon: IconDatabase, label: "Datasets", href: "/dashboard/datasets" },
    ],
  },
  {
    label: "Analyze",
    items: [
      { icon: IconChartBar, label: "Visualizations", href: "/dashboard/visualizations" },
      { icon: IconSparkles, label: "AI Analysis", href: "/dashboard/ai" },
    ],
  },
  {
    label: "Settings",
    items: [
      { icon: IconApi, label: "API Providers", href: "/dashboard/settings/providers" },
      { icon: IconUser, label: "Profile", href: "/dashboard/settings/profile" },
      { icon: IconSettings, label: "Settings", href: "/dashboard/settings" },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const [collapsed, setCollapsed] = useState<string[]>([])

  const toggleSection = (label: string) => {
    setCollapsed(c => c.includes(label) ? c.filter(l => l !== label) : [...c, label])
  }

  const handleLogout = async () => {
    try { await authApi.logout() } catch { }
    logout()
    router.push("/auth/login")
  }

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href)

  return (
    <aside
      className="w-[220px] shrink-0 flex flex-col h-screen sticky top-0"
      style={{
        background: "var(--bg-1)",
        borderRight: "1px solid var(--border)",
      }}
    >
      {/* Logo */}
      <div className="px-4 h-14 flex items-center" style={{ borderBottom: "1px solid var(--border)" }}>
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--orange)" }}>
            <IconBrain size={15} color="#000" />
          </div>
          <span className="font-semibold text-[14px]" style={{ color: "var(--text-1)" }}>
            Neural<span style={{ color: "var(--orange)" }}>Sheet</span>
          </span>
        </Link>
      </div>

      {/* Search */}
      <div className="px-3 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors"
          style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}
        >
          <IconSearch size={13} style={{ color: "var(--text-3)" }} />
          <span className="text-[12px]" style={{ color: "var(--text-3)" }}>Search...</span>
          <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--bg-3)", color: "var(--text-3)" }}>⌘K</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {navSections.map((section) => (
          <div key={section.label}>
            <button
              onClick={() => toggleSection(section.label)}
              className="w-full flex items-center justify-between px-2 mb-1"
            >
              <span className="text-[10px] font-medium tracking-widest uppercase" style={{ color: "var(--text-3)" }}>
                {section.label}
              </span>
              <motion.div
                animate={{ rotate: collapsed.includes(section.label) ? -90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <IconChevronDown size={11} style={{ color: "var(--text-3)" }} />
              </motion.div>
            </button>

            <AnimatePresence initial={false}>
              {!collapsed.includes(section.label) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: "hidden" }}
                >
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const active = isActive(item.href)
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-all"
                          style={{
                            background: active ? "var(--orange-dim)" : "transparent",
                            color: active ? "var(--orange)" : "var(--text-2)",
                            fontWeight: active ? 500 : 400,
                          }}
                        >
                          <item.icon size={15} />
                          {item.label}
                        </Link>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </nav>

      {/* User */}
      <div
        className="px-3 py-3"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div
          className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl mb-1"
          style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 overflow-hidden"
            style={{ background: "var(--orange-dim)", color: "var(--orange)"}}
          >
            {user?.avatar_url ? (
              <img 
                src={user.avatar_url} 
                alt={user.full_name || "User"} 
                className="w-full h-full object-cover"
              />
            ) : (
              user?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium truncate" style={{ color: "var(--text-1)" }}>
              {user?.full_name || "User"}
            </p>
            <p className="text-[10px] truncate" style={{ color: "var(--text-3)" }}>
              {user?.tier || "free"} plan
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[12px] transition-colors"
          style={{ color: "var(--text-3)" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#f87171")}
          onMouseLeave={e => (e.currentTarget.style.color = "var(--text-3)")}
        >
          <IconLogout size={13} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
