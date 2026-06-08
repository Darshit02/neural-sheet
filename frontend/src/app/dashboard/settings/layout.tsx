"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  IconUser, IconApi, IconShield, IconBell,
} from "@tabler/icons-react"

const tabs = [
  { icon: IconUser, label: "Profile", href: "/dashboard/settings/profile" },
  { icon: IconApi, label: "API Providers", href: "/dashboard/settings/providers" },
  { icon: IconShield, label: "Security", href: "/dashboard/settings/security" },
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h2 className="text-[20px] font-semibold mb-1" style={{ color: "var(--text-1)" }}>Settings</h2>
        <p className="text-[13px]" style={{ color: "var(--text-2)" }}>
          Manage your account, API keys, and preferences.
        </p>
      </div>

      <div className="flex gap-6">

        {/* Content */}
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  )
}
