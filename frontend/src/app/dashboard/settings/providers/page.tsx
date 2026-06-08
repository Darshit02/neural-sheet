"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { providersApi } from "@/lib/api"
import { fadeUp, stagger } from "@/lib/motion"
import { toast } from "sonner"
import {
  IconPlus, IconTrash, IconCheck, IconX,
  IconEye, IconEyeOff, IconStar, IconCircleCheck,
  IconAlertCircle, IconKey,
} from "@tabler/icons-react"

const PROVIDER_COLORS: Record<string, string> = {
  anthropic: "#D97757",
  openai: "#10A37F",
  gemini: "#4285F4",
  groq: "#F55036",
  mistral: "#FF7000",
  cohere: "#39594D",
}

const PROVIDER_LABELS: Record<string, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  gemini: "Google Gemini",
  groq: "Groq",
  mistral: "Mistral AI",
  cohere: "Cohere",
}

function AddProviderModal({
  available,
  onClose,
}: {
  available: any[]
  onClose: () => void
}) {
  const qc = useQueryClient()
  const [provider, setProvider] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [label, setLabel] = useState("")
  const [isDefault, setIsDefault] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [loading, setLoading] = useState(false)

  const selectedMeta = available.find((a: any) => a.provider === provider)

  const handleAdd = async () => {
    if (!provider || !apiKey) return
    setLoading(true)
    try {
      await providersApi.add({ provider, api_key: apiKey, label: label || undefined, is_default: isDefault })
      qc.invalidateQueries({ queryKey: ["providers"] })
      toast.success("API provider added")
      onClose()
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Failed to add provider")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md rounded-2xl p-6"
        style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[16px] font-semibold" style={{ color: "var(--text-1)" }}>
            Add AI provider
          </h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--bg-3)" }}>
            <IconX size={14} style={{ color: "var(--text-2)" }} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Provider picker */}
          <div>
            <label className="block text-[12px] mb-2" style={{ color: "var(--text-2)" }}>Provider</label>
            <div className="grid grid-cols-3 gap-2">
              {available.map((a: any) => {
                const color = PROVIDER_COLORS[a.provider] || "var(--orange)"
                const selected = provider === a.provider
                return (
                  <button
                    key={a.provider}
                    onClick={() => setProvider(a.provider)}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all text-[12px]"
                    style={{
                      background: selected ? `${color}15` : "var(--bg-2)",
                      border: selected ? `1px solid ${color}40` : "1px solid var(--border)",
                      color: selected ? color : "var(--text-2)",
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-[13px] overflow-hidden p-1.5"
                      style={{ background: selected ? `${color}20` : "var(--bg-3)" }}
                    >
                      <img 
                        src={`/providers-logo/${a.provider}.svg`} 
                        alt={a.provider}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as any).style.display = 'none';
                          (e.target as any).nextSibling.style.display = 'block';
                        }}
                      />
                      <span style={{ display: 'none', color }}>
                        {a.label?.[0] || a.provider[0].toUpperCase()}
                      </span>
                    </div>
                    {a.label || PROVIDER_LABELS[a.provider]}
                  </button>
                )
              })}
            </div>
          </div>

          {/* API Key */}
          {provider && (
            <>
              <div>
                <label className="block text-[12px] mb-1.5" style={{ color: "var(--text-2)" }}>
                  API Key
                </label>
                <div className="relative">
                  <input
                    type={showKey ? "text" : "password"}
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    placeholder="Paste your API key..."
                    className="w-full px-3.5 py-2.5 pr-10 rounded-lg text-[13px] outline-none font-mono"
                    style={{
                      background: "var(--bg-2)",
                      border: "1px solid var(--border)",
                      color: "var(--text-1)",
                    }}
                    onFocus={e => (e.target.style.borderColor = "var(--orange)")}
                    onBlur={e => (e.target.style.borderColor = "var(--border)")}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--text-3)" }}
                  >
                    {showKey ? <IconEyeOff size={14} /> : <IconEye size={14} />}
                  </button>
                </div>
                {selectedMeta?.docs_url && (
                  <a
                    href={selectedMeta.docs_url}
                    target="_blank"
                    className="text-[11px] mt-1 inline-block"
                    style={{ color: "var(--text-3)" }}
                  >
                    Get your API key →
                  </a>
                )}
              </div>

              {/* Label */}
              <div>
                <label className="block text-[12px] mb-1.5" style={{ color: "var(--text-2)" }}>
                  Label <span style={{ color: "var(--text-3)" }}>(optional)</span>
                </label>
                <input
                  value={label}
                  onChange={e => setLabel(e.target.value)}
                  placeholder={`eg. My ${PROVIDER_LABELS[provider] || provider} key`}
                  className="w-full px-3.5 py-2.5 rounded-lg text-[13px] outline-none"
                  style={{
                    background: "var(--bg-2)",
                    border: "1px solid var(--border)",
                    color: "var(--text-1)",
                  }}
                  onFocus={e => (e.target.style.borderColor = "var(--orange)")}
                  onBlur={e => (e.target.style.borderColor = "var(--border)")}
                />
              </div>

              {/* Set as default */}
              <button
                onClick={() => setIsDefault(!isDefault)}
                className="flex items-center gap-2.5 text-[13px] transition-colors"
                style={{ color: isDefault ? "var(--orange)" : "var(--text-2)" }}
              >
                <div
                  className="w-4 h-4 rounded flex items-center justify-center"
                  style={{
                    background: isDefault ? "var(--orange)" : "var(--bg-3)",
                    border: isDefault ? "none" : "1px solid var(--border)",
                  }}
                >
                  {isDefault && <IconCheck size={10} color="#000" />}
                </div>
                Set as default provider
              </button>
            </>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-[13px]"
            style={{ border: "1px solid var(--border)", color: "var(--text-2)" }}
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!provider || !apiKey || loading}
            className="flex-1 py-2.5 rounded-lg text-[13px] font-medium"
            style={{
              background: (!provider || !apiKey || loading) ? "rgba(249,115,22,0.4)" : "var(--orange)",
              color: "#000",
              cursor: (!provider || !apiKey || loading) ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Adding..." : "Add provider"}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default function ProvidersPage() {
  const qc = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ["providers"],
    queryFn: () => providersApi.list().then(r => r.data),
  })

  const { data: available = [] } = useQuery({
    queryKey: ["providers-available"],
    queryFn: () => providersApi.available().then(r => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => providersApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["providers"] })
      toast.success("Provider removed")
    },
  })

  const setDefaultMutation = useMutation({
    mutationFn: (id: number) => providersApi.setDefault(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["providers"] })
      toast.success("Default provider updated")
    },
  })

  const validateMutation = useMutation({
    mutationFn: (id: number) => providersApi.validate(id),
    onSuccess: (r) => {
      toast[r.data.is_valid ? "success" : "error"](r.data.message)
    },
  })

  return (
    <motion.div
      variants={stagger(0.08)} initial="hidden" animate="show"
      className="space-y-5"
    >
      <AnimatePresence>
        {showAdd && <AddProviderModal available={available} onClose={() => setShowAdd(false)} />}
      </AnimatePresence>

      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <p className="text-[15px] font-semibold mb-0.5" style={{ color: "var(--text-1)" }}>
            API Providers
          </p>
          <p className="text-[12px]" style={{ color: "var(--text-2)" }}>
            Your keys are encrypted with encryption algorithms and never shared.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-medium"
          style={{ background: "var(--orange)", color: "#000" }}
        >
          <IconPlus size={14} />
          Add key
        </button>
      </motion.div>

      {/* Security note */}
      <motion.div
        variants={fadeUp}
        className="flex items-start gap-3 p-4 rounded-xl"
        style={{ background: "var(--orange-dim)", border: "1px solid var(--orange-border)" }}
      >
        <IconKey size={15} style={{ color: "var(--orange)", marginTop: 1 }} />
        <p className="text-[12px] leading-relaxed" style={{ color: "var(--text-2)" }}>
          API keys are encrypted before storage using encryption algorithms. They are only decrypted in memory when needed for AI requests. NeuralSheet never logs or exposes your keys.
        </p>
      </motion.div>

      {/* Connected providers */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: "var(--bg-1)" }} />
          ))}
        </div>
      ) : providers.length === 0 ? (
        <motion.div
          variants={fadeUp}
          className="rounded-xl py-16 text-center"
          style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }}
        >
          <IconKey size={28} className="mx-auto mb-4" style={{ color: "var(--text-3)" }} />
          <p className="text-[14px] font-medium mb-2" style={{ color: "var(--text-1)" }}>
            No API keys yet
          </p>
          <p className="text-[12px] mb-5" style={{ color: "var(--text-3)" }}>
            Add a key from Anthropic, OpenAI, Gemini, or others to run AI analysis.
          </p>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium"
            style={{ background: "var(--orange)", color: "#000" }}
          >
            <IconPlus size={14} /> Add first key
          </button>
        </motion.div>
      ) : (
        <motion.div variants={stagger(0.06)} initial="hidden" animate="show" className="space-y-3">
          {providers.map((p: any) => {
            const color = PROVIDER_COLORS[p.provider] || "var(--orange)"
            const label = PROVIDER_LABELS[p.provider] || p.provider
            return (
              <motion.div
                key={p.id}
                variants={fadeUp}
                className="rounded-xl p-5"
                style={{ background: "var(--bg-1)", border: `1px solid ${p.is_default ? "rgba(249,115,22,0.25)" : "var(--border)"}` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden p-2"
                      style={{ background: `${color}15` }}
                    >
                      <img 
                        src={`/providers-logo/${p.provider}.svg`} 
                        alt={p.provider}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as any).style.display = 'none';
                          (e.target as any).nextSibling.style.display = 'block';
                        }}
                      />
                      <span style={{ display: 'none', color, fontWeight: 'bold' }}>
                        {label[0]}
                      </span>
                    </div>

                    {/* Info */}
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-[14px] font-medium" style={{ color: "var(--text-1)" }}>
                          {p.label || label}
                        </p>
                        {p.is_default && (
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                            style={{ background: "var(--orange-dim)", color: "var(--orange)", border: "1px solid var(--orange-border)" }}
                          >
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] font-mono" style={{ color: "var(--text-3)" }}>
                        {p.masked_key}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {!p.is_default && (
                      <button
                        onClick={() => setDefaultMutation.mutate(p.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] transition-colors"
                        style={{ border: "1px solid var(--border)", color: "var(--text-2)" }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--border-hover)")}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
                      >
                        <IconStar size={12} />
                        Set default
                      </button>
                    )}
                    <button
                      onClick={() => validateMutation.mutate(p.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] transition-colors"
                      style={{ border: "1px solid var(--border)", color: "var(--text-2)" }}
                    >
                      <IconCircleCheck size={12} />
                      Validate
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(p.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                      style={{ border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.08)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <IconTrash size={13} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* Available providers */}
      <motion.div variants={fadeUp}>
        <p className="text-[12px] font-medium tracking-widest uppercase mb-3" style={{ color: "var(--text-3)" }}>
          Supported providers
        </p>
        <div className="grid grid-cols-3 gap-3">
          {available.map((a: any) => {
            const color = PROVIDER_COLORS[a.provider] || "var(--orange)"
            const connected = providers.some((p: any) => p.provider === a.provider)
            return (
              <div
                key={a.provider}
                className="flex items-center gap-3 p-3.5 rounded-xl"
                style={{
                  background: "var(--bg-1)",
                  border: `1px solid ${connected ? `${color}30` : "var(--border)"}`,
                }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 overflow-hidden p-1.5"
                  style={{ background: `${color}15` }}
                >
                  <img 
                    src={`/providers-logo/${a.provider}.svg`} 
                    alt={a.provider}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as any).style.display = 'none';
                      (e.target as any).nextSibling.style.display = 'block';
                    }}
                  />
                  <span style={{ display: 'none', color, fontWeight: 'bold', fontSize: '13px' }}>
                    {(a.label || a.provider)[0]}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-medium truncate" style={{ color: "var(--text-1)" }}>
                    {a.label || PROVIDER_LABELS[a.provider]}
                  </p>
                  <p className="text-[10px] truncate" style={{ color: "var(--text-3)" }}>
                    {a.models?.[0]}
                  </p>
                </div>
                {connected && (
                  <IconCheck size={13} style={{ color: "#4ade80", flexShrink: 0 }} />
                )}
              </div>
            )
          })}
        </div>
      </motion.div>
    </motion.div>
  )
}
