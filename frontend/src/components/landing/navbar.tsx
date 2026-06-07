"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { IconMenu2, IconX } from "@tabler/icons-react"
import Logo from "@/components/ui/logo"

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Providers", href: "#providers" },
  // { label: "Pricing", href: "#pricing" },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24)
    window.addEventListener("scroll", fn, { passive: true })
    return () => window.removeEventListener("scroll", fn)
  }, [])

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        transition: "background 0.3s, border-color 0.3s",
        background: scrolled ? "rgba(8,8,8,0.9)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
      }}
    >
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Logo size="md" />

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="px-3.5 py-1.5 text-[13px] rounded-md transition-colors"
              style={{ color: "var(--text-2)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--text-1)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--text-2)")}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-2">
          <Link
            href="/auth/login"
            className="px-4 py-1.5 text-[13px] rounded-md transition-colors"
            style={{ color: "var(--text-2)" }}
          >
            Sign in
          </Link>
          <Link
            href="/auth/register"
            className="px-4 py-1.5 text-[13px] rounded-lg font-medium transition-all"
            style={{
              background: "var(--orange)",
              color: "#000",
            }}
          >
            Get started
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-1.5 rounded-md"
          style={{ color: "var(--text-2)" }}
          onClick={() => setOpen(!open)}
        >
          {open ? <IconX size={18} /> : <IconMenu2 size={18} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              background: "rgba(8,8,8,0.98)",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <div className="px-6 py-4 flex flex-col gap-1">
              {navLinks.map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  className="px-3 py-2.5 text-sm rounded-md"
                  style={{ color: "var(--text-2)" }}
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </Link>
              ))}
              <div className="flex flex-col gap-2 mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
                <Link href="/auth/login" className="px-4 py-2.5 text-sm text-center rounded-lg" style={{ border: "1px solid var(--border)", color: "var(--text-1)" }}>
                  Sign in
                </Link>
                <Link href="/auth/register" className="px-4 py-2.5 text-sm text-center rounded-lg font-medium" style={{ background: "var(--orange)", color: "#000" }}>
                  Get started
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
