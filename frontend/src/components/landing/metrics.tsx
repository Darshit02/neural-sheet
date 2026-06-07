"use client"

import { motion } from "framer-motion"
import { stagger, fadeUp } from "@/lib/motion"

const metrics = [
  { value: "48k+", label: "Datasets analyzed" },
  { value: "6", label: "AI providers" },
  { value: "2s", label: "Avg profile time" },
  { value: "99.9%", label: "Uptime" },
  { value: "AES-256", label: "Key encryption" },
  { value: "50MB", label: "Max file size" },
]

export default function Metrics() {
  return (
    <section className="py-20">
      <div className="max-w-6xl mx-auto px-6">
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: "1px solid var(--border)" }}
        >
          <motion.div
            variants={stagger(0.06)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-x divide-y md:divide-y-0"
            style={{ borderColor: "var(--border)" }}
          >
            {metrics.map((m) => (
              <motion.div
                key={m.label}
                variants={fadeUp}
                className="flex flex-col items-center justify-center py-8 px-4 text-center"
                style={{ background: "var(--bg-1)" }}
              >
                <span
                  className="text-[26px] font-semibold tracking-tight mb-1"
                  style={{ color: "var(--text-1)" }}
                >
                  {m.value}
                </span>
                <span className="text-[12px]" style={{ color: "var(--text-3)" }}>
                  {m.label}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
