"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { fadeUp, stagger } from "@/lib/motion"
import { IconCheck } from "@tabler/icons-react"

const plans = [
  {
    name: "Free",
    price: "$0",
    per: "forever",
    desc: "Get started with data analysis at no cost.",
    features: ["5 datasets/month", "10MB max file size", "Basic profiling & charts", "1 AI provider key", "Community support"],
    cta: "Get started",
    href: "/auth/register",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$19",
    per: "per month",
    desc: "For engineers who need the full suite.",
    features: ["Unlimited datasets", "50MB max file size", "Full profiling suite", "All 6 AI providers", "Feature engineering AI", "Hyperparameter tuning", "AI chat with datasets", "Priority support"],
    cta: "Start free trial",
    href: "/auth/register",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    per: "contact us",
    desc: "For teams with advanced requirements.",
    features: ["Everything in Pro", "Unlimited file sizes", "Team collaboration", "SSO & SAML", "Custom AI models", "Dedicated support", "SLA guarantee", "On-premise option"],
    cta: "Contact sales",
    href: "mailto:hello@neuralsheet.ai",
    highlight: false,
  },
]

export default function Pricing() {
  return (
    <section id="pricing" className="py-32">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-[12px] font-medium tracking-widest uppercase mb-4" style={{ color: "var(--orange)" }}>
            Pricing
          </p>
          <h2 className="text-[36px] md:text-[44px] font-semibold leading-tight tracking-tight mb-4" style={{ color: "var(--text-1)" }}>
            Simple, transparent pricing
          </h2>
          <p className="text-[16px]" style={{ color: "var(--text-2)" }}>
            No hidden fees. Bring your own AI keys — you only pay for the platform.
          </p>
        </motion.div>

        <motion.div
          variants={stagger(0.1)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              variants={fadeUp}
              className="rounded-2xl p-7 flex flex-col"
              style={{
                background: plan.highlight ? "var(--bg-2)" : "var(--bg-1)",
                border: plan.highlight ? "1px solid rgba(249,115,22,0.3)" : "1px solid var(--border)",
              }}
            >
              {plan.highlight && (
                <div
                  className="self-start px-2.5 py-1 rounded-md text-[11px] font-medium mb-4"
                  style={{ background: "var(--orange-dim)", color: "var(--orange)", border: "1px solid var(--orange-border)" }}
                >
                  Most popular
                </div>
              )}

              <h3 className="text-[15px] font-medium mb-1" style={{ color: "var(--text-1)" }}>
                {plan.name}
              </h3>
              <p className="text-[13px] mb-6" style={{ color: "var(--text-2)" }}>
                {plan.desc}
              </p>

              <div className="flex items-baseline gap-1.5 mb-6">
                <span className="text-[36px] font-semibold tracking-tight" style={{ color: "var(--text-1)" }}>
                  {plan.price}
                </span>
                <span className="text-[13px]" style={{ color: "var(--text-3)" }}>
                  /{plan.per}
                </span>
              </div>

              <ul className="space-y-2.5 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-[13px]" style={{ color: "var(--text-2)" }}>
                    <IconCheck size={13} style={{ color: "var(--orange)", flexShrink: 0 }} />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className="w-full py-2.5 rounded-lg text-[14px] font-medium text-center transition-all"
                style={
                  plan.highlight
                    ? { background: "var(--orange)", color: "#000" }
                    : { border: "1px solid var(--border-hover)", color: "var(--text-1)" }
                }
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
