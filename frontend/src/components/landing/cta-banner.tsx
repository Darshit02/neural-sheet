"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { fadeUp } from "@/lib/motion"
import { IconArrowRight } from "@tabler/icons-react"

export default function CTABanner() {
  return (
    <section className="py-32">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="rounded-2xl p-16 text-center relative overflow-hidden"
          style={{
            background: "var(--bg-1)",
            border: "1px solid rgba(249,115,22,0.15)",
          }}
        >
          {/* Very subtle background glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(249,115,22,0.05), transparent)",
            }}
          />

          <div className="relative z-10">
            <h2
              className="text-[36px] md:text-[52px] font-semibold leading-tight tracking-tight mb-5"
              style={{ color: "var(--text-1)", fontFamily: "var(--font-caveat), cursive" }}
            >
              Ready to move faster?
            </h2>
            <p
              className="text-[17px] leading-relaxed max-w-lg mx-auto mb-10"
              style={{ color: "var(--text-2)" }}
            >
              Join data engineers who use NeuralSheet to profile datasets, generate features, and ship better models — in a fraction of the time.
            </p>
            <div className="flex flex-col items-center justify-center gap-4">
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium text-[14px] transition-all"
                style={{ background: "var(--orange)", color: "#000" }}
              >
                Start for free
                <IconArrowRight size={15} />
              </Link>
              <p className="text-[13px]" style={{ color: "var(--text-3)" }}>
                No credit card · Free plan available
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
