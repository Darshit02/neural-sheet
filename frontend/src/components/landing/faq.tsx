"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { fadeUp, stagger } from "@/lib/motion"
import { IconPlus, IconMinus } from "@tabler/icons-react"

const faqs = [
  { q: "Do you store my API keys?", a: "Yes, but encrypted. All API keys are encrypted with AES-256 before being stored. The encryption key is never stored in the same place as your keys. You can delete your keys at any time from Settings." },
  { q: "What file types are supported?", a: "Currently CSV files up to 50MB. Support for Excel (.xlsx), Parquet, and JSON is on the roadmap." },
  { q: "Which AI models are available?", a: "Any model from Anthropic, OpenAI, Google Gemini, Groq, Mistral, and Cohere. You pick the model per analysis. As providers release new models, they become available immediately." },
  { q: "Is my data sent to the AI provider?", a: "Only dataset statistics and column metadata are sent — not the raw data. The AI never sees your actual CSV contents, only aggregated profile information." },
  { q: "Can I use multiple AI providers?", a: "Yes. Add as many provider keys as you want and set a default. You can switch providers per-analysis from the analysis panel." },
  { q: "Is there a free tier?", a: "Yes. The free tier includes 5 datasets per month, up to 10MB per file, basic profiling, and 1 AI provider key. No credit card required." },
]

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section className="py-32">
      <div className="max-w-3xl mx-auto px-6">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-[12px] font-medium tracking-widest uppercase mb-4" style={{ color: "var(--orange)" }}>
            FAQ
          </p>
          <h2 className="text-[36px] md:text-[44px] font-semibold leading-tight tracking-tight" style={{ color: "var(--text-1)" }}>
            Common questions
          </h2>
        </motion.div>

        <motion.div
          variants={stagger(0.06)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="space-y-2"
        >
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              className="rounded-xl overflow-hidden"
              style={{ border: "1px solid var(--border)" }}
            >
              <button
                className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors"
                style={{
                  background: open === i ? "var(--bg-2)" : "var(--bg-1)",
                  color: "var(--text-1)",
                }}
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="text-[14px] font-medium pr-8">{faq.q}</span>
                <div
                  className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center"
                  style={{ background: "var(--bg-3)" }}
                >
                  {open === i
                    ? <IconMinus size={12} style={{ color: "var(--orange)" }} />
                    : <IconPlus size={12} style={{ color: "var(--text-2)" }} />
                  }
                </div>
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    style={{ overflow: "hidden" }}
                  >
                    <p
                      className="px-5 pb-5 text-[13px] leading-relaxed"
                      style={{ color: "var(--text-2)" }}
                    >
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
