"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { authApi } from "@/lib/api"
import { useAuthStore } from "@/store/auth"
import { fadeUp, stagger } from "@/lib/motion"
import {
  IconBrain, IconBrandGoogle, IconEye,
  IconEyeOff, IconArrowRight, IconCheck,
  IconUpload, IconChartBar, IconSparkles,
} from "@tabler/icons-react"

const steps = [
  { icon: IconUpload, label: "Create your account", desc: "Sign up in seconds" },
  { icon: IconChartBar, label: "Upload a dataset", desc: "Drop any CSV file" },
  { icon: IconSparkles, label: "Add an AI key", desc: "Connect your provider" },
]

export default function RegisterPage() {
  const router = useRouter()
  const { setTokens, setUser } = useAuthStore()

  const [form, setForm] = useState({ full_name: "", email: "", password: "" })
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
      const { data } = await authApi.register(form)
      setTokens(data.access_token, data.refresh_token)
      const me = await authApi.me()
      setUser(me.data)
      router.push("/dashboard")
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Registration failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const passStrength = () => {
    const p = form.password
    if (!p) return 0
    let s = 0
    if (p.length >= 8) s++
    if (/[A-Z]/.test(p)) s++
    if (/[0-9]/.test(p)) s++
    if (/[^A-Za-z0-9]/.test(p)) s++
    return s
  }

  const strength = passStrength()
  const strengthColors = ["", "#ef4444", "#f97316", "#eab308", "#22c55e"]
  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"]

  return (
    <div
      className="min-h-screen flex"
      style={{ background: "var(--bg)" }}
    >
      {/* ── Left panel ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 p-10 relative overflow-hidden"
        style={{
          background: "var(--bg-1)",
          borderRight: "1px solid var(--border)",
        }}
      >
        {/* Subtle glow top-right */}
        <div
          className="absolute -top-24 -right-24 w-64 h-64 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%)",
          }}
        />

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 relative z-10">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "var(--orange)" }}
          >
            <IconBrain size={16} color="#000" />
          </div>
          <span className="font-semibold text-[16px]" style={{ color: "var(--text-1)" }}>
            Neural<span style={{ color: "var(--orange)" }}>Sheet</span>
          </span>
        </Link>

        {/* Middle copy */}
        <div className="relative z-10">
          <h2
            className="text-[32px] font-semibold leading-tight tracking-tight mb-3"
            style={{ color: "var(--text-1)" }}
          >
            Get started
            <br />
            with {" "}
            <span style={{ color: "var(--orange)" , fontFamily: "var(--font-caveat), cursive"}} className="font-bold">
             NeuralSheet
            </span>
          </h2>
          <p className="text-[14px] leading-relaxed mb-10" style={{ color: "var(--text-2)" }}>
            Complete these easy steps to start analyzing your data with AI.
          </p>

          {/* Steps */}
          <div className="space-y-3">
            {steps.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1, duration: 0.5, ease: [0.22,1,0.36,1] }}
                className="flex items-center gap-3 p-3.5 rounded-xl"
                style={{
                  background: i === 0 ? "var(--bg-2)" : "var(--bg-3)",
                  border: i === 0 ? "1px solid rgba(249,115,22,0.2)" : "1px solid var(--border)",
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[12px] font-semibold"
                  style={{
                    background: i === 0 ? "var(--orange)" : "var(--bg-2)",
                    color: i === 0 ? "#000" : "var(--text-3)",
                    border: i !== 0 ? "1px solid var(--border)" : "none",
                  }}
                >
                  {i === 0 ? <IconCheck size={14} /> : i + 1}
                </div>
                <div>
                  <p
                    className="text-[13px] font-medium"
                    style={{ color: i === 0 ? "var(--text-1)" : "var(--text-2)" }}
                  >
                    {s.label}
                  </p>
                  <p className="text-[11px]" style={{ color: "var(--text-3)" }}>
                    {s.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom note */}
        <p className="text-[12px] relative z-10" style={{ color: "var(--text-3)" }}>
          By signing up you agree to our{" "}
          <a href="#" style={{ color: "var(--text-2)" }}>Terms</a> and{" "}
          <a href="#" style={{ color: "var(--text-2)" }}>Privacy Policy</a>.
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
              Create your account
            </h1>
            <p className="text-[14px]" style={{ color: "var(--text-2)" }}>
              Enter your details to get started for free.
            </p>
          </motion.div>

          {/* Google OAuth */}
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
              {/* Full name */}
              <div>
                <label className="block text-[12px] font-medium mb-1.5" style={{ color: "var(--text-2)" }}>
                  Full name
                </label>
                <input
                  name="full_name"
                  type="text"
                  placeholder="eg. John Smith"
                  value={form.full_name}
                  onChange={onChange}
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
                <label className="block text-[12px] font-medium mb-1.5" style={{ color: "var(--text-2)" }}>
                  Password
                </label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPass ? "text" : "password"}
                    placeholder="Min 8 characters"
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

                {/* Password strength */}
                {form.password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="flex-1 h-0.5 rounded-full transition-all duration-300"
                          style={{
                            background: i <= strength ? strengthColors[strength] : "var(--bg-3)",
                          }}
                        />
                      ))}
                    </div>
                    <p className="text-[11px]" style={{ color: strengthColors[strength] }}>
                      {strengthLabels[strength]}
                    </p>
                  </div>
                )}
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
                {loading ? "Creating account..." : (
                  <>
                    Create account
                    <IconArrowRight size={15} />
                  </>
                )}
              </button>
            </motion.div>
          </form>

          {/* Sign in link */}
          <motion.p
            variants={fadeUp}
            className="text-center text-[13px] mt-6"
            style={{ color: "var(--text-2)" }}
          >
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="font-medium transition-colors"
              style={{ color: "var(--orange)" }}
            >
              Sign in
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  )
}
