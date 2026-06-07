"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { authApi } from "@/lib/api"
import { useAuthStore } from "@/store/auth"
import { fadeUp, stagger } from "@/lib/motion"
import {
  IconBrain, IconBrandGoogle,
  IconEye, IconEyeOff, IconArrowRight,
  IconChartBar, IconSparkles, IconDatabase,
} from "@tabler/icons-react"

const features = [
  { icon: IconDatabase, label: "Instant dataset profiling", desc: "Stats in under 2 seconds" },
  { icon: IconSparkles, label: "AI feature engineering", desc: "Smart suggestions with code" },
  { icon: IconChartBar, label: "Interactive visualizations", desc: "Charts, heatmaps, scatter plots" },
]

export default function LoginPage() {
  const router = useRouter()
  const { setTokens, setUser } = useAuthStore()

  const [form, setForm] = useState({ email: "", password: "" })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const { data } = await authApi.login(form)
      setTokens(data.access_token, data.refresh_token)
      const me = await authApi.me()
      setUser(me.data)
      router.push("/dashboard")
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Invalid email or password.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg)" }}>
      {/* ── Left panel ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 p-10 relative overflow-hidden"
        style={{
          background: "var(--bg-1)",
          borderRight: "1px solid var(--border)",
        }}
      >
        {/* Subtle glow */}
        <div
          className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(249,115,22,0.07) 0%, transparent 70%)",
          }}
        />

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 relative z-10">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--orange)" }}>
            <IconBrain size={16} color="#000" />
          </div>
          <span className="font-semibold text-[16px]" style={{ color: "var(--text-1)" }}>
            Neural<span style={{ color: "var(--orange)" }}>Sheet</span>
          </span>
        </Link>

        {/* Middle */}
        <div className="relative z-10">
          <h2
            className="text-[32px] font-semibold leading-tight tracking-tight mb-3"
            style={{ color: "var(--text-1)" }}
          >
            Welcome back
          </h2>
          <p className="text-[14px] leading-relaxed mb-10" style={{ color: "var(--text-2)" }}>
            Your datasets, analyses, and AI insights are waiting for you.
          </p>

          {/* Feature list */}
          <div className="space-y-3">
            {features.map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.1, duration: 0.5, ease: [0.22,1,0.36,1] }}
                className="flex items-center gap-3 p-3.5 rounded-xl"
                style={{
                  background: "var(--bg-2)",
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "var(--bg-3)" }}
                >
                  <f.icon size={15} style={{ color: "var(--orange)" }} />
                </div>
                <div>
                  <p className="text-[13px] font-medium" style={{ color: "var(--text-1)" }}>
                    {f.label}
                  </p>
                  <p className="text-[11px]" style={{ color: "var(--text-3)" }}>
                    {f.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <p className="text-[12px] relative z-10" style={{ color: "var(--text-3)" }}>
          Don't have an account?{" "}
          <Link href="/auth/register" style={{ color: "var(--text-2)" }}>
            Sign up free
          </Link>
        </p>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <motion.div
          variants={stagger(0.08)}
          initial="hidden"
          animate="show"
          className="w-full max-w-[400px]"
        >
          {/* Mobile logo */}
          <motion.div variants={fadeUp} className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--orange)" }}>
              <IconBrain size={14} color="#000" />
            </div>
            <span className="font-semibold" style={{ color: "var(--text-1)" }}>
              Neural<span style={{ color: "var(--orange)" }}>Sheet</span>
            </span>
          </motion.div>

          {/* Header */}
          <motion.div variants={fadeUp} className="mb-8">
            <h1 className="text-[26px] font-semibold tracking-tight mb-1.5" style={{ color: "var(--text-1)" }}>
              Sign in
            </h1>
            <p className="text-[14px]" style={{ color: "var(--text-2)" }}>
              Welcome back — enter your credentials to continue.
            </p>
          </motion.div>

          {/* Google */}
          <motion.div variants={fadeUp} className="mb-6">
            <button
              className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-lg text-[14px] font-medium transition-all"
              style={{
                background: "var(--bg-1)",
                border: "1px solid var(--border)",
                color: "var(--text-1)",
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--border-hover)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
            >
              <IconBrandGoogle size={16} />
              Continue with Google
            </button>
          </motion.div>

          {/* Divider */}
          <motion.div variants={fadeUp} className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
            <span className="text-[12px]" style={{ color: "var(--text-3)" }}>or</span>
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          </motion.div>

          {/* Form */}
          <form onSubmit={onSubmit}>
            <motion.div variants={fadeUp} className="space-y-4 mb-6">
              {/* Email */}
              <div>
                <label className="block text-[12px] font-medium mb-1.5" style={{ color: "var(--text-2)" }}>
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  placeholder="eg. john@gmail.com"
                  value={form.email}
                  onChange={onChange}
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg text-[14px] outline-none transition-all"
                  style={{
                    background: "var(--bg-1)",
                    border: "1px solid var(--border)",
                    color: "var(--text-1)",
                  }}
                  onFocus={e => (e.target.style.borderColor = "var(--orange)")}
                  onBlur={e => (e.target.style.borderColor = "var(--border)")}
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[12px] font-medium" style={{ color: "var(--text-2)" }}>
                    Password
                  </label>
                  <a href="#" className="text-[12px] transition-colors" style={{ color: "var(--text-3)" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "var(--orange)")}
                    onMouseLeave={e => (e.currentTarget.style.color = "var(--text-3)")}
                  >
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <input
                    name="password"
                    type={showPass ? "text" : "password"}
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={onChange}
                    required
                    className="w-full px-3.5 py-2.5 pr-10 rounded-lg text-[14px] outline-none transition-all"
                    style={{
                      background: "var(--bg-1)",
                      border: "1px solid var(--border)",
                      color: "var(--text-1)",
                    }}
                    onFocus={e => (e.target.style.borderColor = "var(--orange)")}
                    onBlur={e => (e.target.style.borderColor = "var(--border)")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--text-3)" }}
                  >
                    {showPass ? <IconEyeOff size={15} /> : <IconEye size={15} />}
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 px-3.5 py-2.5 rounded-lg text-[13px]"
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  color: "#f87171",
                }}
              >
                {error}
              </motion.div>
            )}

            {/* Submit */}
            <motion.div variants={fadeUp}>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-[14px] font-medium transition-all"
                style={{
                  background: loading ? "rgba(249,115,22,0.5)" : "var(--orange)",
                  color: "#000",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Signing in..." : (
                  <>
                    Sign in
                    <IconArrowRight size={15} />
                  </>
                )}
              </button>
            </motion.div>
          </form>

          {/* Register link */}
          <motion.p
            variants={fadeUp}
            className="text-center text-[13px] mt-6"
            style={{ color: "var(--text-2)" }}
          >
            Don't have an account?{" "}
            <Link
              href="/auth/register"
              className="font-medium"
              style={{ color: "var(--orange)" }}
            >
              Sign up free
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  )
}
