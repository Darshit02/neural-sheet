"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { activityApi } from "@/lib/api"
import {
  IconBell, IconX, IconCircleCheck,
  IconAlertCircle, IconInfoCircle, IconClock,
  IconTrash,
} from "@tabler/icons-react"
import Link from "next/link"

const typeConfig = {
  success: { icon: IconCircleCheck, color: "#4ade80" },
  error:   { icon: IconAlertCircle, color: "#f87171" },
  info:    { icon: IconInfoCircle,  color: "var(--orange)" },
  warning: { icon: IconAlertCircle, color: "#facc15" },
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

export default function NotificationsPanel({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const qc = useQueryClient()

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => activityApi.getNotifications().then(r => r.data),
    enabled: open,
    refetchInterval: open ? 15000 : false,
  })

  const markReadMutation = useMutation({
    mutationFn: (ids?: number[]) => activityApi.markRead(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => activityApi.deleteNotification(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  })

  const clearMutation = useMutation({
    mutationFn: () => activityApi.clearAll(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  })

  const unread = notifications.filter((n: any) => !n.read).length

  return (
    <AnimatePresence>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-12 right-0 w-[360px] rounded-2xl overflow-hidden z-50 shadow-2xl"
            style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <div className="flex items-center gap-2">
                <p className="text-[14px] font-semibold" style={{ color: "var(--text-1)" }}>
                  Notifications
                </p>
                {unread > 0 && (
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                    style={{ background: "var(--orange)", color: "#000" }}
                  >
                    {unread}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unread > 0 && (
                  <button
                    onClick={() => markReadMutation.mutate(undefined)}
                    className="text-[11px] transition-colors"
                    style={{ color: "var(--text-3)" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "var(--orange)")}
                    onMouseLeave={e => (e.currentTarget.style.color = "var(--text-3)")}
                  >
                    Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={() => clearMutation.mutate()}
                    className="text-[11px] transition-colors"
                    style={{ color: "var(--text-3)" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#f87171")}
                    onMouseLeave={e => (e.currentTarget.style.color = "var(--text-3)")}
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto" style={{ maxHeight: 420 }}>
              {isLoading ? (
                <div className="space-y-0.5 p-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: "var(--bg-2)" }} />
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-14 text-center">
                  <IconBell size={24} className="mx-auto mb-3" style={{ color: "var(--text-3)" }} />
                  <p className="text-[13px]" style={{ color: "var(--text-3)" }}>
                    All caught up!
                  </p>
                  <p className="text-[12px] mt-1" style={{ color: "var(--text-3)" }}>
                    Notifications appear here when you upload datasets, run AI analysis, and more.
                  </p>
                </div>
              ) : (
                notifications.map((n: any, i: number) => {
                  const cfg = typeConfig[n.type as keyof typeof typeConfig] || typeConfig.info
                  const Icon = cfg.icon
                  const content = (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex items-start gap-3 px-5 py-4 group relative transition-colors cursor-pointer"
                      style={{
                        background: n.read ? "transparent" : "rgba(249,115,22,0.03)",
                        borderBottom: "1px solid var(--border)",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-2)")}
                      onMouseLeave={e => (e.currentTarget.style.background = n.read ? "transparent" : "rgba(249,115,22,0.03)")}
                      onClick={() => !n.read && markReadMutation.mutate([n.id])}
                    >
                      {!n.read && (
                        <div
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
                          style={{ background: "var(--orange)" }}
                        />
                      )}
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: `${cfg.color}15` }}
                      >
                        <Icon size={15} style={{ color: cfg.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-[13px] font-medium mb-0.5 truncate"
                          style={{ color: n.read ? "var(--text-2)" : "var(--text-1)" }}
                        >
                          {n.title}
                        </p>
                        {n.desc && (
                          <p className="text-[12px] leading-relaxed line-clamp-2" style={{ color: "var(--text-3)" }}>
                            {n.desc}
                          </p>
                        )}
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <IconClock size={10} style={{ color: "var(--text-3)" }} />
                          <span className="text-[11px]" style={{ color: "var(--text-3)" }}>
                            {timeAgo(n.created_at)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); deleteMutation.mutate(n.id) }}
                        className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded-md flex items-center justify-center transition-all shrink-0"
                        style={{ background: "var(--bg-3)" }}
                      >
                        <IconX size={10} style={{ color: "var(--text-3)" }} />
                      </button>
                    </motion.div>
                  )

                  return n.href ? (
                    <Link key={n.id} href={n.href} onClick={onClose}>
                      {content}
                    </Link>
                  ) : (
                    <div key={n.id}>{content}</div>
                  )
                })
              )}
            </div>

            {/* Footer */}
            <div
              className="px-5 py-2.5 flex items-center justify-between"
              style={{ borderTop: "1px solid var(--border)", background: "var(--bg-2)" }}
            >
              <p className="text-[11px]" style={{ color: "var(--text-3)" }}>
                {notifications.length} notification{notifications.length !== 1 ? "s" : ""}
              </p>
              <p className="text-[11px]" style={{ color: "var(--text-3)" }}>
                Auto-clears after 7 days
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
