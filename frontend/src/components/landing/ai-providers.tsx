"use client"

import { motion } from "framer-motion"
import { fadeUp, stagger } from "@/lib/motion"
import { IconCheck } from "@tabler/icons-react"

const providers = [
  { name: "Anthropic", tag: "Claude 3.5 · Claude 3 Opus", color: "#D97757", icon: "anthropic.svg" },
  { name: "OpenAI", tag: "GPT-4o · GPT-4 Turbo", color: "#10A37F", icon: "openai.svg" },
  { name: "Google Gemini", tag: "Gemini 1.5 Pro · Flash", color: "#4285F4", icon: "gemini.svg" },
  { name: "Groq", tag: "Llama 3.1 · Mixtral", color: "#F55036", icon: "groq.svg" },
  { name: "Mistral", tag: "Large · Medium · Small", color: "#FF7000", icon: "mistral.svg" },
  { name: "Cohere", tag: "Command R+ · Command R", color: "#39594D", icon: "cohere.svg" }, 
]

const perks = [
  "Your keys, fully encrypted",
  "Switch providers any time",
  "Per-analysis provider selection",
  "Key validation before saving",
]

export default function Providers() {
  return (
    <section id="providers" className="py-32">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            <p className="text-[12px] font-medium tracking-widest uppercase mb-4" style={{ color: "var(--orange)" }}>
              AI Providers
            </p>
            <h2 className="text-[36px] md:text-[44px] font-semibold leading-tight tracking-tight mb-6 capitalize" style={{ color: "var(--text-1)", fontFamily: "var(--font-caveat), cursive"  }}>
              Your keys,
              your choice
            </h2>
            <p className="text-[16px] leading-relaxed mb-8" style={{ color: "var(--text-2)" }}>
              NeuralSheet never charges for AI usage. Add your own API keys from any provider and use whichever model fits the task — all stored with secure encryption.
            </p>
            <ul className="space-y-3">
              {perks.map((p) => (
                <li key={p} className="flex items-center gap-3 text-[14px]" style={{ color: "var(--text-2)" }}>
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: "var(--orange-dim)", border: "1px solid var(--orange-border)" }}
                  >
                    <IconCheck size={11} style={{ color: "var(--orange)" }} />
                  </div>
                  {p}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Right — provider cards */}
          <motion.div
            variants={stagger(0.07)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-2 gap-3"
          >
            {providers.map((p) => (
              <motion.div
                key={p.name}
                variants={fadeUp}
                className="rounded-xl p-4 transition-colors duration-200 cursor-default"
                style={{
                  background: "var(--bg-1)",
                  border: "1px solid var(--border)",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"
                  e.currentTarget.style.background = "var(--bg-2)"
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "var(--border)"
                  e.currentTarget.style.background = "var(--bg-1)"
                }}
              >
                <div
                  className="w-8 h-8 p-2 rounded-lg mb-3 flex items-center justify-center text-[12px] font-bold"
                  style={{ background: p.color + "18", color: p.color }}
                >
                  <img src={`/providers-logo/${p.icon}`} alt={p.name} />
                </div>
                <p className="text-[13px] font-medium mb-0.5" style={{ color: "var(--text-1)" }}>
                  {p.name}
                </p>
                <p className="text-[11px]" style={{ color: "var(--text-3)" }}>
                  {p.tag}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
