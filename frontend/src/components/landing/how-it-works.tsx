"use client"

import { motion } from "framer-motion"
import { fadeUp, stagger } from "@/lib/motion"
import { IconUpload, IconKey, IconChartBar, IconRocket } from "@tabler/icons-react"

const steps = [
  {
    icon: IconUpload,
    step: "01",
    title: "Upload your CSV",
    desc: "Drag and drop any CSV up to 50MB. NeuralSheet parses and stores it instantly.",
  },
  {
    icon: IconKey,
    step: "02",
    title: "Connect an AI key",
    desc: "Add your API key from any supported provider. Keys are AES-256 encrypted.",
  },
  {
    icon: IconChartBar,
    step: "03",
    title: "Explore visually",
    desc: "Get instant profiling stats, correlation matrices, distributions, and outlier charts.",
  },
  {
    icon: IconRocket,
    step: "04",
    title: "Engineer & ship",
    desc: "Get AI feature ideas, hyperparameter guides, and model recommendations with code.",
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-32 relative">
      {/* Subtle horizontal line */}
      <div
        className="absolute left-0 right-0 pointer-events-none"
        style={{ top: "50%", height: 1, background: "var(--border)" }}
      />

      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <p className="text-[12px] font-medium tracking-widest uppercase mb-4" style={{ color: "var(--orange)" }}>
            How it works
          </p>
          <h2 className="text-[36px] md:text-[44px] font-semibold leading-tight tracking-tight" style={{ color: "var(--text-1)", fontFamily: "var(--font-caveat), cursive"  }}>
            Four steps to insights
          </h2>
        </motion.div>

        <motion.div
          variants={stagger(0.1)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-4 gap-8"
        >
          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              variants={fadeUp}
              className="flex flex-col items-center text-center"
            >
              <div className="relative mb-6">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{
                    background: "var(--bg-1)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <s.icon size={22} style={{ color: "var(--orange)" }} />
                </div>
                <div
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold"
                  style={{ background: "var(--orange)", color: "#000" }}
                >
                  {i + 1}
                </div>
              </div>
              <p className="text-[11px] tracking-widest mb-2" style={{ color: "var(--text-3)" }}>
                STEP {s.step}
              </p>
              <h3 className="text-[15px] font-medium mb-2" style={{ color: "var(--text-1)" }}>
                {s.title}
              </h3>
              <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-2)" }}>
                {s.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
