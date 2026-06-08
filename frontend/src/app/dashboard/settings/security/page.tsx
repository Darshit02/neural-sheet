"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { api } from "@/lib/api"
import { fadeUp, stagger } from "@/lib/motion"
import { toast } from "sonner"
import { IconShield, IconEye, IconEyeOff, IconCheck } from "@tabler/icons-react"

export default function SecurityPage() {
  const [form, setForm] = useState({ current_password: "", new_password: "", confirm: "" })
  const [show, setShow] = useState({ current: false, new: false, confirm: false })
  const [loading, setLoading] = useState(false)

  const handleChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.new_password !== form.confirm) {
      toast.error("Passwords don't match")
      return
    }
    setLoading(true)
    try {
      await api.post("/auth/change-password", {
        current_password: form.current_password,
        new_password: form.new_password,
      })
      toast.success("Password changed successfully")
      setForm({ current_password: "", new_password: "", confirm: "" })
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Failed to change password")
    } finally {
      setLoading(false)
    }
  }

  const strength = (() => {
    const p = form.new_password
    if (!p) return 0
    let s = 0
    if (p.length >= 8) s++
    if (/[A-Z]/.test(p)) s++
    if (/[0-9]/.test(p)) s++
    if (/[^A-Za-z0-9]/.test(p)) s++
    return s
  })()

  const strengthColors = ["", "#ef4444", "#f97316", "#eab308", "#22c55e"]
  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"]

  return (
    <motion.div variants={stagger(0.08)} initial="hidden" animate="show" className="space-y-5">
      {/* Change password */}
      <motion.div
        variants={fadeUp}
        className="rounded-xl p-6"
        style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2 mb-5">
          <IconShield size={16} style={{ color: "var(--orange)" }} />
          <p className="text-[13px] font-medium" style={{ color: "var(--text-1)" }}>Change password</p>
        </div>

        <form onSubmit={handleChange} className="space-y-4 max-w-sm">
          {[
            { key: "current_password", label: "Current password", showKey: "current" as const },
            { key: "new_password", label: "New password", showKey: "new" as const },
            { key: "confirm", label: "Confirm new password", showKey: "confirm" as const },
          ].map(({ key, label, showKey }) => (
            <div key={key}>
              <label className="block text-[12px] mb-1.5" style={{ color: "var(--text-2)" }}>
                {label}
              </label>
              <div className="relative">
                <input
                  type={show[showKey] ? "text" : "password"}
                  value={(form as any)[key]}
                  onChange={e => setForm({ ...form, [key]: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 pr-10 rounded-lg text-[13px] outline-none"
                  style={{
                    background: "var(--bg-2)",
                    border: "1px solid var(--border)",
                    color: "var(--text-1)",
                  }}
                  onFocus={e => (e.target.style.borderColor = "var(--orange)")}
                  onBlur={e => (e.target.style.borderColor = "var(--border)")}
                />
                <button
                  type="button"
                  onClick={() => setShow({ ...show, [showKey]: !show[showKey] })}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-3)" }}
                >
                  {show[showKey] ? <IconEyeOff size={14} /> : <IconEye size={14} />}
                </button>
              </div>

              {/* Strength bar for new password */}
              {key === "new_password" && form.new_password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map(i => (
                      <div
                        key={i}
                        className="flex-1 h-0.5 rounded-full transition-all"
                        style={{ background: i <= strength ? strengthColors[strength] : "var(--bg-3)" }}
                      />
                    ))}
                  </div>
                  <p className="text-[11px]" style={{ color: strengthColors[strength] }}>
                    {strengthLabels[strength]}
                  </p>
                </div>
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={loading || !form.current_password || !form.new_password || !form.confirm}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium"
            style={{
              background: (loading || !form.current_password || !form.new_password || !form.confirm)
                ? "rgba(249,115,22,0.4)"
                : "var(--orange)",
              color: "#000",
              cursor: (loading || !form.current_password || !form.new_password || !form.confirm)
                ? "not-allowed"
                : "pointer",
            }}
          >
            <IconCheck size={14} />
            {loading ? "Saving..." : "Update password"}
          </button>
        </form>
      </motion.div>

      {/* Sessions */}
      <motion.div
        variants={fadeUp}
        className="rounded-xl p-6"
        style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }}
      >
        <p className="text-[13px] font-medium mb-4" style={{ color: "var(--text-1)" }}>
          Active sessions
        </p>
        <div
          className="flex items-center justify-between py-3 px-4 rounded-xl"
          style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}
        >
          <div>
            <p className="text-[13px] font-medium mb-0.5" style={{ color: "var(--text-1)" }}>
              Current session
            </p>
            <p className="text-[12px]" style={{ color: "var(--text-3)" }}>
              Active now · This device
            </p>
          </div>
          <span
            className="text-[11px] px-2 py-1 rounded-lg"
            style={{ background: "rgba(74,222,128,0.1)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.2)" }}
          >
            Active
          </span>
        </div>
      </motion.div>
    </motion.div>
  )
}
