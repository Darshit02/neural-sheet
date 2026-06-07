"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { fadeUp, stagger } from "@/lib/motion"
import {
  IconArrowRight, IconUpload, IconChartBar,
  IconBrain, IconSparkles
} from "@tabler/icons-react"

const stats = [
  { value: "6+", label: "AI providers" },
  { value: "<2s", label: "Profile speed" },
  { value: "50MB", label: "Max file size" },
  { value: "100%", label: "Your keys" },
]

export default function Hero() {
  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center mt-16 pt-14 overflow-hidden"
    >
      {/* Very subtle dot grid */}
      <div className="absolute inset-0 dot-grid opacity-60 pointer-events-none" />

      {/* Single soft radial glow — far background, very dim */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "30%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 700,
          height: 700,
          background: "radial-gradient(circle, rgba(249,115,22,0.06) 0%, transparent 70%)",
          borderRadius: "50%",
        }}
      />

      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 text-center">
        {/* Eyebrow */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="flex justify-center mb-8"
        >
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[12px] font-medium"
            style={{
              background: "var(--orange-dim)",
              border: "1px solid var(--orange-border)",
              color: "var(--orange)",
            }}
          >
            <IconSparkles size={12} />
            AI-powered data engineering platform
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.08 }}
          className="text-[52px] md:text-[72px] font-semibold leading-[1.08] tracking-[-0.03em] mb-6 text-balance capitalize"
          style={{ color: "var(--text-1)" }}
        >
          Analyze your Data,with
          <br />
          <span style={{ color: "var(--orange)", fontFamily: "var(--font-caveat), cursive" }} className="capitalize">
            AI powered {"  "}
          </span>
          <span className="capitalize">{" "}data engineer</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.14 }}
          className="text-[17px] leading-relaxed max-w-4xl mx-auto mb-10 text-balance"
          style={{ color: "var(--text-2)" }}
        >
          Upload any CSV and instantly get AI-powered profiling,
          feature suggestions, hyperparameter guides, and interactive charts.
          Use your own API keys.
        </motion.p>

        {/* CTA row */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-20"
        >
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 px-5 py-2.5  font-medium text-[14px] transition-all rounded-full"
            style={{ background: "var(--orange)", color: "#000" }}
          >
            <IconUpload size={15} />
            Start analyzing free
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-[14px] transition-all rounded-full"
            style={{
              border: "1px solid var(--border-hover)",
              color: "var(--text-2)",
            }}
          >
            See how it works
          </a>
        </motion.div>

        {/* Stats row */}
        <motion.div
          variants={stagger(0.08)}
          initial="hidden"
          animate="show"
          className="grid grid-cols-4 gap-px max-w-lg mx-auto"
          style={{
            border: "1px solid var(--border)",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          {stats.map((s) => (
            <motion.div
              key={s.label}
              variants={fadeUp}
              className="flex flex-col items-center py-4 px-2"
              style={{ background: "var(--bg-1)" }}
            >
              <span
                className="text-[20px] font-semibold tracking-tight"
                style={{ color: "var(--orange)" }}
              >
                {s.value}
              </span>
              <span
                className="text-[11px] mt-0.5"
                style={{ color: "var(--text-3)" }}
              >
                {s.label}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Preview card strip */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-5xl mx-auto px-6 mt-20"
      >
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            border: "1px solid var(--border)",
            background: "var(--bg-1)",
          }}
        >
          {/* Window chrome */}
          <div
            className="flex items-center gap-2 px-4 py-3"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#3a3a3a" }} />
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#3a3a3a" }} />
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#3a3a3a" }} />
            <div
              className="ml-4 flex-1 h-6 rounded-md px-3 flex items-center text-[11px]"
              style={{ background: "var(--bg-2)", color: "var(--text-3)" }}
            >
              neuralsheet.ai/dashboard
            </div>
          </div>

          {/* Mock dashboard */}
          <div className="grid grid-cols-3 divide-x" style={{ borderColor: "var(--border)" }}>
            {/* Left panel */}
            <div className="p-5" style={{ borderRight: "1px solid var(--border)" }}>
              <p className="text-[11px] mb-3" style={{ color: "var(--text-3)" }}>DATASET</p>
              <p className="text-[13px] font-medium mb-1" style={{ color: "var(--text-1)" }}>sales_2024.csv</p>
              <p className="text-[12px] mb-4" style={{ color: "var(--text-3)" }}>48,291 rows · 24 cols</p>
              <div className="space-y-2">
                {["Profiling", "Features", "Hyperparams", "Chat"].map((item, i) => (
                  <div
                    key={item}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[12px] cursor-pointer transition-colors"
                    style={{
                      background: i === 0 ? "var(--orange-dim)" : "transparent",
                      color: i === 0 ? "var(--orange)" : "var(--text-2)",
                      border: i === 0 ? "1px solid var(--orange-border)" : "1px solid transparent",
                    }}
                  >
                    {i === 0 && <IconChartBar size={13} />}
                    {i === 1 && <IconSparkles size={13} />}
                    {i === 2 && <IconBrain size={13} />}
                    {i === 3 && <IconArrowRight size={13} />}
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Center panel */}
            <div className="col-span-2 p-5">
              <p className="text-[11px] mb-4" style={{ color: "var(--text-3)" }}>PROFILE OVERVIEW</p>
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: "Missing values", value: "2.4%", good: true },
                  { label: "Duplicates", value: "0.1%", good: true },
                  { label: "Numeric cols", value: "14", good: null },
                ].map((m) => (
                  <div key={m.label} className="rounded-lg p-3" style={{ background: "var(--bg-2)" }}>
                    <p className="text-[11px] mb-1" style={{ color: "var(--text-3)" }}>{m.label}</p>
                    <p
                      className="text-[18px] font-semibold"
                      style={{ color: m.good === true ? "#4ade80" : m.good === false ? "#f87171" : "var(--text-1)" }}
                    >
                      {m.value}
                    </p>
                  </div>
                ))}
              </div>
              {/* Fake bar chart */}
              <p className="text-[11px] mb-3" style={{ color: "var(--text-3)" }}>COLUMN DISTRIBUTION — revenue</p>
              <div className="flex items-end gap-1 h-20">
                {[30, 55, 80, 65, 90, 70, 45, 85, 60, 40, 75, 95, 50, 35].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-sm transition-all"
                    style={{
                      height: `${h}%`,
                      background: i === 12 ? "var(--orange)" : "var(--bg-3)",
                      opacity: i === 12 ? 1 : 0.7,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
