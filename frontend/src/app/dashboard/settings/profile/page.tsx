"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useAuthStore } from "@/store/auth"
import { usersApi, authApi } from "@/lib/api"
import { fadeUp, stagger } from "@/lib/motion"
import { toast } from "sonner"
import { IconEdit, IconCheck } from "@tabler/icons-react"

export default function ProfilePage() {
  const { user, setUser } = useAuthStore()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(user?.full_name || "")
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      await usersApi.updateProfile({ full_name: name })
      const me = await authApi.me()
      setUser(me.data)
      setEditing(false)
      toast.success("Profile updated")
    } catch {
      toast.error("Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      variants={stagger(0.08)} initial="hidden" animate="show"
      className="space-y-5"
    >
      {/* Avatar + name */}
      <motion.div
        variants={fadeUp}
        className="rounded-xl p-6"
        style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }}
      >
        <p className="text-[13px] font-medium mb-5" style={{ color: "var(--text-1)" }}>
          Personal information
        </p>

        <div className="flex items-center gap-5 mb-6">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-[22px] font-semibold"
            style={{
              background: "var(--orange-dim)",
              color: "var(--orange)",
              border: "1px solid var(--orange-border)",
            }}
          >
            {user?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <p className="text-[15px] font-semibold mb-0.5" style={{ color: "var(--text-1)" }}>
              {user?.full_name || "No name set"}
            </p>
            <p className="text-[13px]" style={{ color: "var(--text-2)" }}>{user?.email}</p>
            <span
              className="inline-block mt-1 text-[11px] px-2 py-0.5 rounded-md"
              style={{ background: "var(--orange-dim)", color: "var(--orange)" }}
            >
              {user?.tier} plan
            </span>
          </div>
        </div>

        {/* Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-[12px] mb-1.5" style={{ color: "var(--text-2)" }}>
              Full name
            </label>
            {editing ? (
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg text-[13px] outline-none max-w-sm"
                style={{
                  background: "var(--bg-2)",
                  border: "1px solid var(--orange)",
                  color: "var(--text-1)",
                }}
                autoFocus
              />
            ) : (
              <p className="text-[14px]" style={{ color: "var(--text-1)" }}>
                {user?.full_name || "—"}
              </p>
            )}
          </div>

          <div>
            <label className="block text-[12px] mb-1.5" style={{ color: "var(--text-2)" }}>
              Email address
            </label>
            <p className="text-[14px]" style={{ color: "var(--text-1)" }}>{user?.email}</p>
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          {editing ? (
            <>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium"
                style={{ background: "var(--orange)", color: "#000" }}
              >
                <IconCheck size={14} />
                {loading ? "Saving..." : "Save changes"}
              </button>
              <button
                onClick={() => { setEditing(false); setName(user?.full_name || "") }}
                className="px-4 py-2 rounded-lg text-[13px]"
                style={{ border: "1px solid var(--border)", color: "var(--text-2)" }}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px]"
              style={{ border: "1px solid var(--border)", color: "var(--text-2)" }}
            >
              <IconEdit size={14} />
              Edit profile
            </button>
          )}
        </div>
      </motion.div>

      {/* Account info */}
      <motion.div
        variants={fadeUp}
        className="rounded-xl p-6"
        style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }}
      >
        <p className="text-[13px] font-medium mb-4" style={{ color: "var(--text-1)" }}>
          Account details
        </p>
        <div className="space-y-3">
          {[
            { label: "Plan", value: user?.tier || "free", color: "var(--orange)" },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-2.5" style={{ borderBottom: "1px solid var(--border)" }}>
              <span className="text-[13px]" style={{ color: "var(--text-2)" }}>{item.label}</span>
              <span className="text-[13px] font-medium capitalize" style={{ color: item.color }}>{item.value}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Danger zone */}
      <motion.div
        variants={fadeUp}
        className="rounded-xl p-6"
        style={{ background: "var(--bg-1)", border: "1px solid rgba(239,68,68,0.2)" }}
      >
        <p className="text-[13px] font-medium mb-1" style={{ color: "#f87171" }}>Danger zone</p>
        <p className="text-[12px] mb-4" style={{ color: "var(--text-3)" }}>
          Irreversible actions — proceed with caution.
        </p>
        <button
          className="px-4 py-2 rounded-lg text-[13px] font-medium transition-colors"
          style={{
            border: "1px solid rgba(239,68,68,0.3)",
            color: "#f87171",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.08)")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
        >
          Delete account
        </button>
      </motion.div>
    </motion.div>
  )
}
