import { IconCloudUpload } from "@tabler/icons-react"
import Link from "next/link"

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  desc: string
  action?: { label: string; href: string }
}

export default function EmptyState({ icon, title, desc, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}
      >
        {icon || <IconCloudUpload size={22} style={{ color: "var(--text-3)" }} />}
      </div>
      <h3 className="text-[15px] font-medium mb-2" style={{ color: "var(--text-1)" }}>{title}</h3>
      <p className="text-[13px] mb-6 max-w-xs" style={{ color: "var(--text-3)" }}>{desc}</p>
      {action && (
        <Link
          href={action.href}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium"
          style={{ background: "var(--orange)", color: "#000" }}
        >
          {action.label}
        </Link>
      )}
    </div>
  )
}
