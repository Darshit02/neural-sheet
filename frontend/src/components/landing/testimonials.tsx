"use client"

import { motion } from "framer-motion"
import { fadeUp } from "@/lib/motion"
import { IconQuote } from "@tabler/icons-react"

export default function QuoteSection() {
  return (
    <section className="py-32">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="text-center"
        >
          <div
            className="w-14 h-14 rounded-2xl mx-auto mb-8 flex items-center justify-center"
            style={{
              background: "var(--bg-2)",
              border: "1px solid var(--border)",
            }}
          >
            <IconQuote
              size={24}
              style={{ color: "var(--orange)" }}
            />
          </div>

          <blockquote
            className="text-5xl md:text-4xl font-semibold leading-tight tracking-tight"
            style={{ color: "var(--text-1)" }}
          >
            "Stop spending hours <span className="font-bold" style={{ color: "var(--orange)", fontFamily: "var(--font-caveat), cursive" }}>
              cleaning spreadsheets.{" "}
            </span>
            Let AI find the insights while you focus on decisions."
          </blockquote>

          <div className="mt-8">
            <p
              className="font-medium"
              style={{ color: "var(--text-1)" }}
            >
              NeuralSheet Team
            </p>

            <p
              className="text-sm mt-1"
              style={{ color: "var(--text-3)" }}
            >
              AI-Powered Data Analysis Platform
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}