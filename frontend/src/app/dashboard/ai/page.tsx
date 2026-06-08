"use client"

import { useState } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import { datasetsApi, aiApi, providersApi } from "@/lib/api"
import { fadeUp, stagger } from "@/lib/motion"
import { toast } from "sonner"
import Link from "next/link"
import {
  IconSparkles, IconMathFunction, IconMessage2Bolt,
  IconWand, IconFileTypeCsv, IconBrain,
  IconArrowRight, IconSend, IconCheck,
  IconCode, IconChevronDown, IconChevronUp,
  IconApi,
} from "@tabler/icons-react"

const TASKS = [
  {
    id: "features",
    icon: IconSparkles,
    label: "Feature Engineering",
    desc: "Get AI-generated feature ideas with Python code",
    color: "var(--orange)",
  },
  {
    id: "hyperparams",
    icon: IconMathFunction,
    label: "Hyperparameter Tuning",
    desc: "Model-specific tuning guide with Optuna/sklearn code",
    color: "#8B5CF6",
  },
  {
    id: "chat",
    icon: IconMessage2Bolt,
    label: "Chat with Data",
    desc: "Ask questions about your dataset in plain English",
    color: "#10B981",
  },
  {
    id: "models",
    icon: IconWand,
    label: "Model Recommendations",
    desc: "Ranked ML model suggestions with quick-start code",
    color: "#3B82F6",
  },
]

const ML_MODELS = [
  "RandomForest", "XGBoost", "LightGBM",
  "LogisticRegression", "SVM", "KNN",
  "DecisionTree", "GradientBoosting", "NeuralNetwork",
]

export default function AIAnalysisPage() {
  const [task, setTask] = useState("features")
  const [datasetId, setDatasetId] = useState<number | null>(null)
  const [providerId, setProviderId] = useState<number | null>(null)

  const { data: datasets = [] } = useQuery({
    queryKey: ["datasets"],
    queryFn: () => datasetsApi.list().then(r => r.data),
  })

  const { data: providers = [] } = useQuery({
    queryKey: ["providers"],
    queryFn: () => providersApi.list().then(r => r.data),
  })

  const readyDatasets = datasets.filter((d: any) => d.status === "ready")
  const selectedDataset = datasets.find((d: any) => d.id === datasetId) || readyDatasets[0]
  const selectedProvider = providers.find((p: any) => p.id === providerId)
    || providers.find((p: any) => p.is_default)
    || providers[0]

  const hasProviders = providers.length > 0
  const hasDatasets = readyDatasets.length > 0

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <h2
          className="text-[20px] font-semibold tracking-tight mb-1"
          style={{ color: "var(--text-1)" }}
        >
          AI Analysis
        </h2>
        <p className="text-[13px]" style={{ color: "var(--text-2)" }}>
          Run AI-powered analysis on your datasets using your own API keys.
        </p>
      </motion.div>

      {/* Warnings */}
      {!hasProviders && (
        <motion.div
          variants={fadeUp} initial="hidden" animate="show"
          className="flex items-start gap-3 p-4 rounded-xl"
          style={{ background: "var(--orange-dim)", border: "1px solid var(--orange-border)" }}
        >
          <IconApi size={16} style={{ color: "var(--orange)", marginTop: 1 }} />
          <div className="flex-1">
            <p className="text-[13px] font-medium mb-0.5" style={{ color: "var(--text-1)" }}>
              No AI provider connected
            </p>
            <p className="text-[12px]" style={{ color: "var(--text-2)" }}>
              Add an API key to get started with AI analysis.
            </p>
          </div>
          <Link
            href="/dashboard/settings/providers"
            className="shrink-0 flex items-center gap-1 text-[12px] font-medium"
            style={{ color: "var(--orange)" }}
          >
            Add key <IconArrowRight size={12} />
          </Link>
        </motion.div>
      )}

      {!hasDatasets && hasProviders && (
        <motion.div
          variants={fadeUp} initial="hidden" animate="show"
          className="flex items-start gap-3 p-4 rounded-xl"
          style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }}
        >
          <IconFileTypeCsv size={16} style={{ color: "var(--text-3)", marginTop: 1 }} />
          <div className="flex-1">
            <p className="text-[13px] font-medium mb-0.5" style={{ color: "var(--text-1)" }}>
              No ready datasets
            </p>
            <p className="text-[12px]" style={{ color: "var(--text-2)" }}>
              Upload a CSV dataset to run AI analysis.
            </p>
          </div>
          <Link
            href="/dashboard/datasets"
            className="shrink-0 flex items-center gap-1 text-[12px] font-medium"
            style={{ color: "var(--orange)" }}
          >
            Upload <IconArrowRight size={12} />
          </Link>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — config panel */}
        <div className="space-y-4">
          {/* Task selector */}
          <motion.div
            variants={fadeUp} initial="hidden" animate="show"
            className="rounded-xl overflow-hidden"
            style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }}
          >
            <div
              className="px-4 py-3"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <p className="text-[12px] font-medium" style={{ color: "var(--text-2)" }}>
                Analysis type
              </p>
            </div>
            <div className="p-2 space-y-1">
              {TASKS.map((t) => {
                const active = task === t.id
                return (
                  <button
                    key={t.id}
                    onClick={() => setTask(t.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all"
                    style={{
                      background: active ? `${t.color}12` : "transparent",
                      border: active ? `1px solid ${t.color}25` : "1px solid transparent",
                    }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        background: active ? `${t.color}20` : "var(--bg-3)",
                      }}
                    >
                      <t.icon
                        size={14}
                        style={{ color: active ? t.color : "var(--text-3)" }}
                      />
                    </div>
                    <div className="min-w-0">
                      <p
                        className="text-[12px] font-medium"
                        style={{ color: active ? "var(--text-1)" : "var(--text-2)" }}
                      >
                        {t.label}
                      </p>
                      <p className="text-[11px] truncate" style={{ color: "var(--text-3)" }}>
                        {t.desc}
                      </p>
                    </div>
                    {active && (
                      <IconCheck
                        size={13}
                        className="ml-auto shrink-0"
                        style={{ color: t.color }}
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </motion.div>

          {/* Dataset selector */}
          <motion.div
            variants={fadeUp} initial="hidden" animate="show"
            className="rounded-xl overflow-hidden"
            style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }}
          >
            <div
              className="px-4 py-3"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <p className="text-[12px] font-medium" style={{ color: "var(--text-2)" }}>
                Dataset
              </p>
            </div>
            <div className="p-2 space-y-1">
              {readyDatasets.length === 0 ? (
                <p className="px-3 py-4 text-[12px] text-center" style={{ color: "var(--text-3)" }}>
                  No ready datasets
                </p>
              ) : (
                readyDatasets.map((d: any) => {
                  const active = (selectedDataset?.id) === d.id
                  return (
                    <button
                      key={d.id}
                      onClick={() => setDatasetId(d.id)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all"
                      style={{
                        background: active ? "var(--orange-dim)" : "transparent",
                        border: active ? "1px solid var(--orange-border)" : "1px solid transparent",
                      }}
                    >
                      <IconFileTypeCsv
                        size={13}
                        style={{ color: active ? "var(--orange)" : "var(--text-3)" }}
                      />
                      <div className="min-w-0">
                        <p
                          className="text-[12px] font-medium truncate"
                          style={{ color: active ? "var(--text-1)" : "var(--text-2)" }}
                        >
                          {d.name}
                        </p>
                        <p className="text-[10px]" style={{ color: "var(--text-3)" }}>
                          {d.row_count?.toLocaleString()} rows · {d.column_count} cols
                        </p>
                      </div>
                      {active && (
                        <IconCheck
                          size={12}
                          className="ml-auto shrink-0"
                          style={{ color: "var(--orange)" }}
                        />
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </motion.div>

          {/* Provider selector */}
          <motion.div
            variants={fadeUp} initial="hidden" animate="show"
            className="rounded-xl overflow-hidden"
            style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }}
          >
            <div
              className="px-4 py-3"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <p className="text-[12px] font-medium" style={{ color: "var(--text-2)" }}>
                AI provider
              </p>
            </div>
            <div className="p-2 space-y-1">
              {providers.length === 0 ? (
                <div className="px-3 py-4 text-center">
                  <p className="text-[12px] mb-2" style={{ color: "var(--text-3)" }}>
                    No providers added
                  </p>
                  <Link
                    href="/dashboard/settings/providers"
                    className="text-[12px] font-medium"
                    style={{ color: "var(--orange)" }}
                  >
                    Add one →
                  </Link>
                </div>
              ) : (
                providers.map((p: any) => {
                  const active = (selectedProvider?.id) === p.id
                  return (
                    <button
                      key={p.id}
                      onClick={() => setProviderId(p.id)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all"
                      style={{
                        background: active ? "var(--orange-dim)" : "transparent",
                        border: active ? "1px solid var(--orange-border)" : "1px solid transparent",
                      }}
                    >
                      <div
                        className="w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold shrink-0"
                        style={{
                          background: "var(--bg-3)",
                          color: active ? "var(--orange)" : "var(--text-3)",
                        }}
                      >
                        {p.provider[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p
                          className="text-[12px] font-medium truncate"
                          style={{ color: active ? "var(--text-1)" : "var(--text-2)" }}
                        >
                          {p.label || p.provider}
                        </p>
                        {p.is_default && (
                          <p className="text-[10px]" style={{ color: "var(--text-3)" }}>
                            Default
                          </p>
                        )}
                      </div>
                      {active && (
                        <IconCheck
                          size={12}
                          className="ml-auto shrink-0"
                          style={{ color: "var(--orange)" }}
                        />
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </motion.div>
        </div>

        {/* Right — analysis panel */}
        <div className="lg:col-span-2">
          {!hasProviders || !hasDatasets ? (
            <motion.div
              variants={fadeUp} initial="hidden" animate="show"
              className="rounded-xl py-24 flex flex-col items-center justify-center text-center"
              style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }}
            >
              <IconBrain size={32} className="mb-4" style={{ color: "var(--text-3)" }} />
              <p className="text-[14px] font-medium mb-2" style={{ color: "var(--text-1)" }}>
                Ready when you are
              </p>
              <p className="text-[13px] max-w-xs" style={{ color: "var(--text-3)" }}>
                {!hasProviders
                  ? "Add an AI provider key to get started"
                  : "Upload a CSV dataset to run analysis"}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key={task}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              {task === "features" && (
                <FeaturesPanel
                  dataset={selectedDataset}
                  providerId={selectedProvider?.id}
                />
              )}
              {task === "hyperparams" && (
                <HyperparamsPanel
                  dataset={selectedDataset}
                  providerId={selectedProvider?.id}
                />
              )}
              {task === "chat" && (
                <ChatPanel
                  dataset={selectedDataset}
                  providerId={selectedProvider?.id}
                />
              )}
              {task === "models" && (
                <ModelsPanel
                  dataset={selectedDataset}
                  providerId={selectedProvider?.id}
                />
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Sub-panels ──────────────────────────────────────────

function FeaturesPanel({ dataset, providerId }: any) {
  const [goal, setGoal] = useState("")
  const [result, setResult] = useState<any>(null)

  const mutation = useMutation({
    mutationFn: () =>
      aiApi.features({ dataset_id: dataset?.id, goal, provider_id: providerId }),
    onSuccess: r => setResult(r.data.result),
    onError: (e: any) =>
      toast.error(e?.response?.data?.detail || "AI request failed"),
  })

  return (
    <div className="space-y-4">
      <div
        className="rounded-xl p-5"
        style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }}
      >
        <p className="text-[13px] font-medium mb-1" style={{ color: "var(--text-1)" }}>
          Feature Engineering
        </p>
        <p className="text-[12px] mb-4" style={{ color: "var(--text-2)" }}>
          Describe your prediction goal and get smart feature ideas with ready-to-use Python code.
        </p>
        <textarea
          value={goal}
          onChange={e => setGoal(e.target.value)}
          placeholder="eg. Predict customer churn based on usage patterns and demographics..."
          rows={3}
          className="w-full px-3.5 py-2.5 rounded-lg text-[13px] outline-none resize-none mb-3"
          style={{
            background: "var(--bg-2)",
            border: "1px solid var(--border)",
            color: "var(--text-1)",
          }}
          onFocus={e => (e.target.style.borderColor = "var(--orange)")}
          onBlur={e => (e.target.style.borderColor = "var(--border)")}
        />
        <button
          onClick={() => mutation.mutate()}
          disabled={!goal.trim() || mutation.isPending || !dataset}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium"
          style={{
            background:
              !goal.trim() || mutation.isPending || !dataset
                ? "rgba(249,115,22,0.4)"
                : "var(--orange)",
            color: "#000",
            cursor:
              !goal.trim() || mutation.isPending || !dataset
                ? "not-allowed"
                : "pointer",
          }}
        >
          <IconSparkles size={14} />
          {mutation.isPending ? "Analyzing..." : "Generate features"}
        </button>
      </div>

      {result?.feature_ideas?.map((f: any, i: number) => (
        <FeatureCard key={i} feature={f} />
      ))}

      {result?.cleaning_suggestions?.length > 0 && (
        <div
          className="rounded-xl p-5"
          style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }}
        >
          <p
            className="text-[12px] font-medium tracking-widest uppercase mb-3"
            style={{ color: "var(--text-3)" }}
          >
            Cleaning suggestions
          </p>
          <div className="space-y-3">
            {result.cleaning_suggestions.map((s: any, i: number) => (
              <div key={i}>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-[12px] font-mono px-2 py-0.5 rounded"
                    style={{ background: "var(--bg-3)", color: "var(--orange)" }}
                  >
                    {s.column}
                  </span>
                  <span className="text-[12px]" style={{ color: "var(--text-2)" }}>
                    {s.issue}
                  </span>
                </div>
                {s.code && (
                  <pre
                    className="text-[11px] p-2.5 rounded-lg font-mono overflow-x-auto"
                    style={{ background: "var(--bg-3)", color: "#4ade80" }}
                  >
                    {s.code}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function FeatureCard({ feature: f }: { feature: any }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left"
      >
        <div className="flex items-center gap-3">
          <span
            className="text-[12px] px-2 py-0.5 rounded-md"
            style={{
              background:
                f.expected_impact === "high"
                  ? "rgba(249,115,22,0.1)"
                  : "var(--bg-3)",
              color:
                f.expected_impact === "high" ? "var(--orange)" : "var(--text-3)",
            }}
          >
            {f.expected_impact}
          </span>
          <span className="text-[13px] font-medium font-mono" style={{ color: "var(--text-1)" }}>
            {f.name}
          </span>
          <span className="text-[12px]" style={{ color: "var(--text-2)" }}>
            {f.description}
          </span>
        </div>
        {expanded ? (
          <IconChevronUp size={14} style={{ color: "var(--text-3)", flexShrink: 0 }} />
        ) : (
          <IconChevronDown size={14} style={{ color: "var(--text-3)", flexShrink: 0 }} />
        )}
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
          >
            <div
              className="px-5 pb-4 space-y-3"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              {f.code && (
                <pre
                  className="text-[12px] p-3.5 rounded-lg font-mono overflow-x-auto mt-3"
                  style={{ background: "var(--bg-3)", color: "#4ade80" }}
                >
                  {f.code}
                </pre>
              )}
              <p className="text-[12px]" style={{ color: "var(--text-2)" }}>
                {f.reasoning}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function HyperparamsPanel({ dataset, providerId }: any) {
  const [modelType, setModelType] = useState("")
  const [taskType, setTaskType] = useState("classification")
  const [result, setResult] = useState<any>(null)

  const mutation = useMutation({
    mutationFn: () =>
      aiApi.hyperparams({
        dataset_id: dataset?.id,
        model_type: modelType,
        task_type: taskType,
        provider_id: providerId,
      }),
    onSuccess: r => setResult(r.data.result),
    onError: (e: any) =>
      toast.error(e?.response?.data?.detail || "AI request failed"),
  })

  return (
    <div className="space-y-4">
      <div
        className="rounded-xl p-5"
        style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }}
      >
        <p className="text-[13px] font-medium mb-1" style={{ color: "var(--text-1)" }}>
          Hyperparameter Tuning
        </p>
        <p className="text-[12px] mb-4" style={{ color: "var(--text-2)" }}>
          Get model-specific parameter ranges, tuning strategies, and complete starter code.
        </p>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-[12px] mb-1.5" style={{ color: "var(--text-2)" }}>
              Model
            </label>
            <select
              value={modelType}
              onChange={e => setModelType(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-[13px] outline-none"
              style={{
                background: "var(--bg-2)",
                border: "1px solid var(--border)",
                color: "var(--text-1)",
              }}
            >
              <option value="">Select model...</option>
              {ML_MODELS.map(m => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[12px] mb-1.5" style={{ color: "var(--text-2)" }}>
              Task type
            </label>
            <select
              value={taskType}
              onChange={e => setTaskType(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-[13px] outline-none"
              style={{
                background: "var(--bg-2)",
                border: "1px solid var(--border)",
                color: "var(--text-1)",
              }}
            >
              <option value="classification">Classification</option>
              <option value="regression">Regression</option>
              <option value="clustering">Clustering</option>
            </select>
          </div>
        </div>
        <button
          onClick={() => mutation.mutate()}
          disabled={!modelType || mutation.isPending || !dataset}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium"
          style={{
            background:
              !modelType || mutation.isPending || !dataset
                ? "rgba(249,115,22,0.4)"
                : "var(--orange)",
            color: "#000",
            cursor:
              !modelType || mutation.isPending || !dataset
                ? "not-allowed"
                : "pointer",
          }}
        >
          <IconMathFunction size={14} />
          {mutation.isPending ? "Generating..." : "Get tuning guide"}
        </button>
      </div>

      {result && (
        <div className="space-y-3">
          {result.model_overview && (
            <div
              className="rounded-xl p-5"
              style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }}
            >
              <p className="text-[14px] font-semibold mb-1" style={{ color: "var(--text-1)" }}>
                {result.model_overview.name}
              </p>
              <p className="text-[13px] mb-3" style={{ color: "var(--text-2)" }}>
                {result.model_overview.best_for}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p
                    className="text-[11px] tracking-widest uppercase mb-2"
                    style={{ color: "var(--text-3)" }}
                  >
                    Pros
                  </p>
                  {result.model_overview.pros?.map((p: string, i: number) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-[12px] mb-1.5"
                      style={{ color: "var(--text-2)" }}
                    >
                      <IconCheck size={11} style={{ color: "#4ade80", flexShrink: 0 }} />
                      {p}
                    </div>
                  ))}
                </div>
                <div>
                  <p
                    className="text-[11px] tracking-widest uppercase mb-2"
                    style={{ color: "var(--text-3)" }}
                  >
                    Cons
                  </p>
                  {result.model_overview.cons?.map((c: string, i: number) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-[12px] mb-1.5"
                      style={{ color: "var(--text-2)" }}
                    >
                      <span style={{ color: "#f87171" }}>−</span>
                      {c}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {result.hyperparameters?.map((hp: any, i: number) => (
            <div
              key={i}
              className="rounded-xl p-4"
              style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span
                    className="text-[13px] font-medium font-mono"
                    style={{ color: "var(--orange)" }}
                  >
                    {hp.name}
                  </span>
                  <p className="text-[12px] mt-0.5" style={{ color: "var(--text-2)" }}>
                    {hp.description}
                  </p>
                </div>
                <span
                  className="text-[11px] px-2 py-0.5 rounded-md shrink-0 ml-3"
                  style={{
                    background:
                      hp.impact === "high"
                        ? "rgba(249,115,22,0.1)"
                        : "var(--bg-3)",
                    color:
                      hp.impact === "high" ? "var(--orange)" : "var(--text-3)",
                  }}
                >
                  {hp.impact} impact
                </span>
              </div>
              <div className="flex flex-wrap gap-4 text-[12px]">
                <span style={{ color: "var(--text-3)" }}>
                  Default:{" "}
                  <span style={{ color: "var(--text-1)" }}>{hp.default_value}</span>
                </span>
                <span style={{ color: "var(--text-3)" }}>
                  Recommended:{" "}
                  <span style={{ color: "var(--orange)" }}>{hp.recommended_value}</span>
                </span>
                <span style={{ color: "var(--text-3)" }}>
                  Range:{" "}
                  <span style={{ color: "var(--text-1)" }}>
                    {hp.recommended_range?.min} – {hp.recommended_range?.max}
                  </span>
                </span>
              </div>
            </div>
          ))}

          {result.starter_code?.sklearn && (
            <div
              className="rounded-xl overflow-hidden"
              style={{ border: "1px solid var(--border)" }}
            >
              <div
                className="flex items-center gap-2 px-4 py-3"
                style={{
                  background: "var(--bg-2)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <IconCode size={14} style={{ color: "var(--orange)" }} />
                <p className="text-[12px] font-medium" style={{ color: "var(--text-1)" }}>
                  Sklearn starter code
                </p>
              </div>
              <pre
                className="p-4 text-[12px] overflow-x-auto font-mono"
                style={{ background: "var(--bg-1)", color: "#4ade80" }}
              >
                {result.starter_code.sklearn}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ChatPanel({ dataset, providerId }: any) {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([])
  const [input, setInput] = useState("")

  const mutation = useMutation({
    mutationFn: (msgs: any[]) =>
      aiApi.chat({ dataset_id: dataset?.id, messages: msgs, provider_id: providerId }),
    onSuccess: r =>
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: r.data.response },
      ]),
    onError: (e: any) =>
      toast.error(e?.response?.data?.detail || "Chat failed"),
  })

  const send = () => {
    if (!input.trim() || !dataset) return
    const updated = [...messages, { role: "user", content: input }]
    setMessages(updated)
    setInput("")
    mutation.mutate(updated)
  }

  const suggestions = [
    "Which columns have missing values?",
    "What are the strongest correlations?",
    "Suggest a target variable for prediction",
    "Are there any outliers I should know about?",
  ]

  return (
    <div
      className="rounded-xl overflow-hidden flex flex-col"
      style={{
        background: "var(--bg-1)",
        border: "1px solid var(--border)",
        height: 560,
      }}
    >
      {/* Header */}
      <div
        className="px-5 py-3.5 shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <p className="text-[13px] font-medium" style={{ color: "var(--text-1)" }}>
          Chat with {dataset?.name || "dataset"}
        </p>
        <p className="text-[11px]" style={{ color: "var(--text-3)" }}>
          {dataset?.row_count?.toLocaleString()} rows · {dataset?.column_count} columns
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center gap-4">
            <IconMessage2Bolt size={28} style={{ color: "var(--text-3)" }} />
            <div className="text-center">
              <p className="text-[13px] font-medium mb-1" style={{ color: "var(--text-1)" }}>
                Ask anything about your data
              </p>
              <p className="text-[12px]" style={{ color: "var(--text-3)" }}>
                Try one of these prompts:
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-sm">
              {suggestions.map(s => (
                <button
                  key={s}
                  onClick={() => { setInput(s); }}
                  className="px-3.5 py-2.5 rounded-lg text-[12px] text-left transition-colors"
                  style={{
                    background: "var(--bg-2)",
                    border: "1px solid var(--border)",
                    color: "var(--text-2)",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--orange)")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className="max-w-[80%] px-4 py-2.5 rounded-xl text-[13px] leading-relaxed"
              style={{
                background:
                  m.role === "user" ? "var(--orange)" : "var(--bg-2)",
                color: m.role === "user" ? "#000" : "var(--text-1)",
                border:
                  m.role === "assistant"
                    ? "1px solid var(--border)"
                    : "none",
              }}
            >
              {m.content}
            </div>
          </div>
        ))}
        {mutation.isPending && (
          <div className="flex justify-start">
            <div
              className="px-4 py-2.5 rounded-xl text-[13px]"
              style={{
                background: "var(--bg-2)",
                border: "1px solid var(--border)",
                color: "var(--text-3)",
              }}
            >
              Thinking...
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div
        className="flex items-center gap-3 px-4 py-3 shrink-0"
        style={{
          borderTop: "1px solid var(--border)",
          background: "var(--bg-2)",
        }}
      >
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Ask anything about your dataset..."
          className="flex-1 px-3.5 py-2 rounded-lg text-[13px] outline-none"
          style={{
            background: "var(--bg-1)",
            border: "1px solid var(--border)",
            color: "var(--text-1)",
          }}
          onFocus={e => (e.target.style.borderColor = "var(--orange)")}
          onBlur={e => (e.target.style.borderColor = "var(--border)")}
        />
        <button
          onClick={send}
          disabled={!input.trim() || mutation.isPending || !dataset}
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
          style={{
            background:
              !input.trim() || mutation.isPending || !dataset
                ? "rgba(249,115,22,0.4)"
                : "var(--orange)",
            cursor:
              !input.trim() || mutation.isPending || !dataset
                ? "not-allowed"
                : "pointer",
          }}
        >
          <IconSend size={14} color="#000" />
        </button>
      </div>
    </div>
  )
}

function ModelsPanel({ dataset, providerId }: any) {
  const [goal, setGoal] = useState("")
  const [result, setResult] = useState<any>(null)

  const mutation = useMutation({
    mutationFn: () =>
      aiApi.recommendModel({
        dataset_id: dataset?.id,
        goal,
        provider_id: providerId,
      }),
    onSuccess: r => setResult(r.data.result),
    onError: (e: any) =>
      toast.error(e?.response?.data?.detail || "AI request failed"),
  })

  return (
    <div className="space-y-4">
      <div
        className="rounded-xl p-5"
        style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }}
      >
        <p className="text-[13px] font-medium mb-1" style={{ color: "var(--text-1)" }}>
          Model Recommendations
        </p>
        <p className="text-[12px] mb-4" style={{ color: "var(--text-2)" }}>
          Describe your goal and get ranked ML model suggestions with reasoning and quick-start code.
        </p>
        <textarea
          value={goal}
          onChange={e => setGoal(e.target.value)}
          placeholder="eg. Predict whether a customer will churn next month..."
          rows={3}
          className="w-full px-3.5 py-2.5 rounded-lg text-[13px] outline-none resize-none mb-3"
          style={{
            background: "var(--bg-2)",
            border: "1px solid var(--border)",
            color: "var(--text-1)",
          }}
          onFocus={e => (e.target.style.borderColor = "var(--orange)")}
          onBlur={e => (e.target.style.borderColor = "var(--border)")}
        />
        <button
          onClick={() => mutation.mutate()}
          disabled={!goal.trim() || mutation.isPending || !dataset}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium"
          style={{
            background:
              !goal.trim() || mutation.isPending || !dataset
                ? "rgba(249,115,22,0.4)"
                : "var(--orange)",
            color: "#000",
            cursor:
              !goal.trim() || mutation.isPending || !dataset
                ? "not-allowed"
                : "pointer",
          }}
        >
          <IconWand size={14} />
          {mutation.isPending ? "Analyzing..." : "Get recommendations"}
        </button>
      </div>

      {result?.recommendations?.map((rec: any, i: number) => (
        <div
          key={i}
          className="rounded-xl p-5"
          style={{
            background: "var(--bg-1)",
            border:
              i === 0
                ? "1px solid rgba(249,115,22,0.25)"
                : "1px solid var(--border)",
          }}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0"
                style={{
                  background: i === 0 ? "var(--orange)" : "var(--bg-3)",
                  color: i === 0 ? "#000" : "var(--text-2)",
                }}
              >
                #{rec.rank}
              </div>
              <div>
                <p
                  className="text-[14px] font-semibold"
                  style={{ color: "var(--text-1)" }}
                >
                  {rec.model}
                </p>
                <p className="text-[11px]" style={{ color: "var(--text-3)" }}>
                  {rec.library} · {rec.task_type}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <span
                className="text-[11px] px-2 py-1 rounded-md"
                style={{ background: "var(--bg-3)", color: "var(--text-3)" }}
              >
                {rec.training_time} train
              </span>
              <span
                className="text-[11px] px-2 py-1 rounded-md"
                style={{ background: "var(--bg-3)", color: "var(--text-3)" }}
              >
                {rec.interpretability} interp.
              </span>
            </div>
          </div>
          <p className="text-[13px] mb-3" style={{ color: "var(--text-2)" }}>
            {rec.reasoning}
          </p>
          {rec.quick_start_code && (
            <pre
              className="text-[11px] p-3 rounded-lg overflow-x-auto font-mono"
              style={{ background: "var(--bg-3)", color: "#4ade80" }}
            >
              {rec.quick_start_code}
            </pre>
          )}
        </div>
      ))}

      {result && (
        <div
          className="rounded-xl p-4 grid grid-cols-3 gap-4"
          style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }}
        >
          <div>
            <p className="text-[11px] mb-1" style={{ color: "var(--text-3)" }}>
              Data size
            </p>
            <p
              className="text-[14px] font-medium capitalize"
              style={{ color: "var(--text-1)" }}
            >
              {result.data_size_assessment}
            </p>
          </div>
          <div>
            <p className="text-[11px] mb-1" style={{ color: "var(--text-3)" }}>
              Recommended split
            </p>
            <p className="text-[14px] font-medium" style={{ color: "var(--text-1)" }}>
              {result.recommended_split
                ? `${(result.recommended_split.train * 100).toFixed(0)}/${(result.recommended_split.val * 100).toFixed(0)}/${(result.recommended_split.test * 100).toFixed(0)}`
                : "70/15/15"}
            </p>
          </div>
          <div>
            <p className="text-[11px] mb-1" style={{ color: "var(--text-3)" }}>
              Eval metrics
            </p>
            <p className="text-[13px]" style={{ color: "var(--text-1)" }}>
              {result.evaluation_metrics?.join(", ")}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
