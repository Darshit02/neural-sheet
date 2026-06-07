"use client"

import { motion } from "framer-motion"
import { fadeUp, stagger } from "@/lib/motion"
import {
  IconDatabase, IconSparkles, IconMathFunction,
  IconChartDots, IconRobot, IconApi,
  IconFolderOpen, IconWand, IconShield,
} from "@tabler/icons-react"

const features = [
  { icon: IconDatabase, title: "Instant dataset profiling", desc: "Row counts, dtypes, missing values, distributions, outlier detection — all in under 2 seconds." },
  { icon: IconSparkles, title: "AI feature engineering", desc: "Describe your goal and get smart feature ideas with ready-to-paste Python code." },
  { icon: IconMathFunction, title: "Hyperparameter tuning", desc: "Model-specific param ranges, tuning strategies, and full Optuna/sklearn starter code." },
  { icon: IconChartDots, title: "Interactive visualizations", desc: "Correlation heatmaps, histograms, scatter plots, boxplots, and time series — all interactive." },
  { icon: IconRobot, title: "Chat with your data", desc: "Ask questions in plain English. Get instant AI answers grounded in your dataset's actual schema." },
  { icon: IconApi, title: "Bring your own API key", desc: "Anthropic, OpenAI, Gemini, Mistral, Cohere, Groq — use any provider, any model." },
  { icon: IconFolderOpen, title: "Project organisation", desc: "Group datasets into projects. Track full analysis history and revisit past AI insights." },
  { icon: IconWand, title: "Model recommendations", desc: "Describe your goal, get ranked model suggestions with reasoning and quick-start code." },
  { icon: IconShield, title: "Secure by design", desc: "API keys encrypted with AES-256. JWT auth with refresh tokens. Data stays on your storage." },
]

export default function Features() {
  return (
    <section id="features" className="py-32 relative">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="mb-16 max-w-xl"
        >
          <p className="text-[12px] font-medium tracking-widest uppercase mb-4" style={{ color: "var(--orange)" }}>
            Features
          </p>
          <h2 className="text-[36px] md:text-[44px] font-semibold leading-tight tracking-tight mb-4 capitalize" style={{ color: "var(--text-1)", fontFamily: "var(--font-caveat), cursive"  }}>
            Everything a data engineer needs
          </h2>
          <p className="text-[16px] leading-relaxed" style={{ color: "var(--text-2)" }}>
            From raw CSV to production-ready ML pipeline — NeuralSheet handles the heavy lifting so you can focus on what matters.
          </p>
        </motion.div>

        {/* Grid */}
        <motion.div
          variants={stagger(0.07)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px"
          style={{ border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}
        >
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              variants={fadeUp}
              className="p-6 group transition-colors duration-200 cursor-default"
              style={{ background: "var(--bg-1)" }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-2)")}
              onMouseLeave={e => (e.currentTarget.style.background = "var(--bg-1)")}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center mb-4"
                style={{ background: "var(--bg-3)" }}
              >
                <f.icon size={17} style={{ color: "var(--orange)" }} />
              </div>
              <h3 className="text-[14px] font-medium mb-2" style={{ color: "var(--text-1)" }}>
                {f.title}
              </h3>
              <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-2)" }}>
                {f.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
