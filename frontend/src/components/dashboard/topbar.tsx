"use client"

import { usePathname } from "next/navigation"
import { IconBell, IconPlus, IconSearch } from "@tabler/icons-react"
import { useAuthStore } from "@/store/auth"

const pageTitles: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/projects": "Projects",
  "/dashboard/datasets": "Datasets",
  "/dashboard/visualizations": "Visualizations",
  "/dashboard/ai": "AI Analysis",
  "/dashboard/settings": "Settings",
  "/dashboard/settings/providers": "API Providers",
  "/dashboard/settings/profile": "Profile",
}

export default function Topbar() {
  const pathname = usePathname()
  const { user } = useAuthStore()
  const title = pageTitles[pathname] || "Dashboard"

  return (
    <header
      className="h-14 flex items-center justify-between px-6 shrink-0"
      style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-1)" }}
    >
      <h1 className="text-[15px] font-semibold" style={{ color: "var(--text-1)" }}>
        {title}
      </h1>

      <div className="flex items-center gap-2">
        {/* Search */}
        <button
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] transition-colors"
          style={{
            background: "var(--bg-2)",
            border: "1px solid var(--border)",
            color: "var(--text-3)",
          }}
        >
          <IconSearch size={13} />
          Search
          <span
            className="ml-1 px-1.5 py-0.5 rounded text-[10px]"
            style={{ background: "var(--bg-3)", color: "var(--text-3)" }}
          >
            ⌘K
          </span>
        </button>

        {/* Notifications */}
        <button
          className="relative w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
          style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}
        >
          <IconBell size={14} style={{ color: "var(--text-2)" }} />
          <span
            className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
            style={{ background: "var(--orange)" }}
          />
        </button>

        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold cursor-pointer"
          style={{
            background: "var(--orange-dim)",
            color: "var(--orange)",
            border: "1px solid var(--orange-border)",
          }}
        >
          {user?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
        </div>
      </div>
    </header>
  )
}
