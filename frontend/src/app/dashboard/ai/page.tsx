"use client"

import { useState } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"
import { datasetsApi, aiApi, providersApi } from "@/lib/api"
import { fadeUp, stagger } from "@/lib/motion"
import { toast } from "sonner"
import Link from "next/link"
import {
  IconSparkles, IconMathFunction, IconMessage2Bolt,
  IconWand, IconFileTypeCsv, IconBrain,
  IconArrowRight, IconSend, IconCheck,
  IconCode, IconChevronDown, IconChevronUp,
  IconApi, IconScale, IconRotate, IconChartDots,
  IconAlertTriangle, IconTools, IconBulb, IconCircleCheck,
  IconInfoCircle, IconAward, IconHistory, IconEye,
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
    onError: (e: any) => toast.error("Analysis failed. Please try again."),
  })

  return (
    <div className="space-y-4">
      <div
        className="rounded-xl p-5"
        style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2 mb-1">
          <IconSparkles size={16} style={{ color: "var(--orange)" }} />
          <p className="text-[13px] font-medium" style={{ color: "var(--text-1)" }}>
            Feature Engineering
          </p>
        </div>
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
          {mutation.isPending ? (
            <>
              <div className="w-3 h-3 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <IconSparkles size={14} />
              <span>Generate features</span>
            </>
          )}
        </button>
      </div>

      {mutation.isPending && (
        <div className="space-y-3 animate-pulse">
          <div className="h-14 rounded-xl" style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }} />
          <div className="h-14 rounded-xl" style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }} />
          <div className="h-14 rounded-xl" style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }} />
        </div>
      )}

      {result?.error && (
        <div
          className="rounded-xl p-8 flex flex-col items-center text-center gap-4"
          style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }}
        >
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-red-500/10 border border-red-500/20">
            <IconAlertTriangle size={24} style={{ color: "#f87171" }} />
          </div>
          <div>
            <p className="text-[14px] font-semibold mb-1" style={{ color: "var(--text-1)" }}>
              Something went wrong
            </p>
            <p className="text-[12px] max-w-[280px]" style={{ color: "var(--text-3)" }}>
              We encountered an issue while generating features. Please try again.
            </p>
          </div>
          <button
            onClick={() => mutation.mutate()}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-[13px] font-medium transition-all hover:brightness-110 active:scale-95"
            style={{ background: "var(--orange)", color: "#000" }}
          >
            <IconRotate size={14} />
            <span>Try again</span>
          </button>
        </div>
      )}

      {result?.feature_ideas?.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <IconBulb size={16} style={{ color: "var(--orange)" }} />
            <p className="text-[12px] font-medium uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
              Feature Ideas
            </p>
          </div>
          {result.feature_ideas.map((f: any, i: number) => (
            <FeatureCard key={i} feature={f} />
          ))}
        </div>
      )}

      {result?.cleaning_suggestions?.length > 0 && (
        <div
          className="rounded-xl p-5"
          style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <IconWand size={16} style={{ color: "var(--orange)" }} />
            <p
              className="text-[12px] font-medium tracking-widest uppercase"
              style={{ color: "var(--text-3)" }}
            >
              Cleaning suggestions
            </p>
          </div>
          <div className="space-y-4">
            {result.cleaning_suggestions.map((s: any, i: number) => (
              <div key={i} className="group">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="text-[11px] font-mono px-2 py-0.5 rounded border"
                    style={{ background: "var(--bg-2)", color: "var(--orange)", borderColor: "rgba(249,115,22,0.2)" }}
                  >
                    {s.column}
                  </span>
                  <span className="text-[12px] font-medium" style={{ color: "var(--text-1)" }}>
                    {s.issue}
                  </span>
                </div>
                {s.code && (
                  <div className="relative">
                    <pre
                      className="text-[11px] p-3 rounded-lg font-mono overflow-x-auto"
                      style={{ background: "var(--bg-3)", color: "#4ade80" }}
                    >
                      {s.code}
                    </pre>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(s.code);
                        toast.success("Code copied");
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <IconCheck size={12} />
                    </button>
                  </div>
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
      className="rounded-xl overflow-hidden group transition-all"
      style={{
        background: "var(--bg-1)",
        border: expanded ? "1px solid var(--orange)" : "1px solid var(--border)",
      }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left"
      >
        <div className="flex items-center gap-4">
          <div
            className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border"
            style={{
              background:
                f.expected_impact === "high"
                  ? "rgba(249,115,22,0.1)"
                  : "var(--bg-3)",
              color:
                f.expected_impact === "high" ? "var(--orange)" : "var(--text-3)",
              borderColor: f.expected_impact === "high" ? "rgba(249,115,22,0.2)" : "var(--border)",
            }}
          >
            {f.expected_impact}
          </div>
          <div>
            <p className="text-[13px] font-medium font-mono" style={{ color: "var(--orange)" }}>
              {f.name}
            </p>
            <p className="text-[12px] mt-0.5" style={{ color: "var(--text-2)" }}>
              {f.description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!expanded && f.code && (
             <IconCode size={14} className="text-orange-500/50 group-hover:text-orange-500 transition-colors" />
          )}
          {expanded ? (
            <IconChevronUp size={14} style={{ color: "var(--text-3)", flexShrink: 0 }} />
          ) : (
            <IconChevronDown size={14} style={{ color: "var(--text-3)", flexShrink: 0 }} />
          )}
        </div>
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
              className="px-5 pb-4 space-y-4"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              {f.code && (
                <div className="relative group/code mt-3">
                  <pre
                    className="text-[12px] p-3.5 rounded-lg font-mono overflow-x-auto"
                    style={{ background: "var(--bg-3)", color: "#4ade80" }}
                  >
                    {f.code}
                  </pre>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(f.code);
                      toast.success("Code copied");
                    }}
                    className="absolute top-3 right-3 p-2 rounded-lg bg-black/50 text-white opacity-0 group-hover/code:opacity-100 transition-opacity"
                  >
                    <IconCheck size={14} />
                  </button>
                </div>
              )}
              <div className="flex gap-2">
                <IconInfoCircle size={14} className="shrink-0 mt-0.5" style={{ color: "var(--text-3)" }} />
                <p className="text-[12px] italic leading-relaxed" style={{ color: "var(--text-2)" }}>
                  {f.reasoning}
                </p>
              </div>
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
    onError: (e: any) => toast.error("Tuning guide generation failed."),
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

      {mutation.isPending && (
        <div className="space-y-4 animate-pulse">
          <div className="h-32 rounded-xl" style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }} />
          <div className="h-48 rounded-xl" style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }} />
        </div>
      )}

      {result?.error && (
        <div
          className="rounded-xl p-8 flex flex-col items-center text-center gap-4"
          style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }}
        >
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-red-500/10 border border-red-500/20">
            <IconAlertTriangle size={24} style={{ color: "#f87171" }} />
          </div>
          <div>
            <p className="text-[14px] font-semibold mb-1" style={{ color: "var(--text-1)" }}>
              Something went wrong
            </p>
            <p className="text-[12px] max-w-[280px]" style={{ color: "var(--text-3)" }}>
              We encountered an issue while generating your tuning guide. Please try again.
            </p>
          </div>
          <button
            onClick={() => mutation.mutate()}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-[13px] font-medium transition-all hover:brightness-110 active:scale-95"
            style={{ background: "var(--orange)", color: "#000" }}
          >
            <IconRotate size={14} />
            <span>Try again</span>
          </button>
        </div>
      )}

      {result && !result.error && (
        <div className="space-y-4">
          {/* Model Overview */}
          {result.model_overview && (
            <div
              className="rounded-xl p-5"
              style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-center gap-2 mb-1">
                <IconBrain size={16} style={{ color: "var(--orange)" }} />
                <p className="text-[14px] font-semibold" style={{ color: "var(--text-1)" }}>
                  {result.model_overview.name}
                </p>
              </div>
              <p className="text-[13px] mb-4" style={{ color: "var(--text-2)" }}>
                {result.model_overview.best_for}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p
                    className="text-[11px] tracking-widest uppercase font-medium flex items-center gap-1.5"
                    style={{ color: "var(--text-3)" }}
                  >
                    <IconCircleCheck size={12} style={{ color: "#4ade80" }} /> Pros
                  </p>
                  {result.model_overview.pros?.map((p: string, i: number) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-[12px]"
                      style={{ color: "var(--text-2)" }}
                    >
                      <span style={{ color: "#4ade80", marginTop: 2 }}>•</span>
                      {p}
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <p
                    className="text-[11px] tracking-widest uppercase font-medium flex items-center gap-1.5"
                    style={{ color: "var(--text-3)" }}
                  >
                    <IconAlertTriangle size={12} style={{ color: "#f87171" }} /> Cons
                  </p>
                  {result.model_overview.cons?.map((c: string, i: number) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-[12px]"
                      style={{ color: "var(--text-2)" }}
                    >
                      <span style={{ color: "#f87171", marginTop: 2 }}>−</span>
                      {c}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tuning Strategy */}
          {result.tuning_strategy && (
            <div
              className="rounded-xl p-5"
              style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <IconChartDots size={16} style={{ color: "var(--orange)" }} />
                <p className="text-[12px] font-medium uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
                  Tuning Strategy
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[13px] font-medium" style={{ color: "var(--text-1)" }}>
                    {result.tuning_strategy.recommended_method?.replace("_", " ")}
                  </p>
                  <p className="text-[12px] mt-1" style={{ color: "var(--text-2)" }}>
                    {result.tuning_strategy.reasoning}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-lg" style={{ background: "var(--bg-2)" }}>
                    <p className="text-[10px] uppercase" style={{ color: "var(--text-3)" }}>Metric</p>
                    <p className="text-[12px] font-medium" style={{ color: "var(--orange)" }}>{result.tuning_strategy.scoring_metric}</p>
                  </div>
                  <div className="p-2 rounded-lg" style={{ background: "var(--bg-2)" }}>
                    <p className="text-[10px] uppercase" style={{ color: "var(--text-3)" }}>CV Folds</p>
                    <p className="text-[12px] font-medium" style={{ color: "var(--text-1)" }}>{result.tuning_strategy.cv_folds}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Hyperparameters */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <IconTools size={16} style={{ color: "var(--orange)" }} />
              <p className="text-[12px] font-medium uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
                Key Parameters
              </p>
            </div>
            {result.hyperparameters?.map((hp: any, i: number) => (
              <div
                key={i}
                className="rounded-xl p-4"
                style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }}
              >
                <div className="flex items-start justify-between mb-3">
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
                    className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md shrink-0 ml-3"
                    style={{
                      background:
                        hp.impact === "high"
                          ? "rgba(249,115,22,0.1)"
                          : "var(--bg-3)",
                      color:
                        hp.impact === "high" ? "var(--orange)" : "var(--text-3)",
                      border: hp.impact === "high" ? "1px solid rgba(249,115,22,0.2)" : "1px solid var(--border)",
                    }}
                  >
                    {hp.impact} impact
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-[12px]">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-medium" style={{ color: "var(--text-3)" }}>Default</span>
                    <span style={{ color: "var(--text-1)" }}>{hp.default_value}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-medium" style={{ color: "var(--text-3)" }}>Recommended</span>
                    <span style={{ color: "var(--orange)" }}>{hp.recommended_value}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-medium" style={{ color: "var(--text-3)" }}>Range</span>
                    <span style={{ color: "var(--text-1)" }}>
                      {hp.recommended_range?.min} – {hp.recommended_range?.max}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Feature Scaling & Alternatives */}
          <div className="grid grid-cols-2 gap-4">
            {result.feature_scaling && (
              <div
                className="rounded-xl p-4"
                style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <IconScale size={16} style={{ color: "var(--orange)" }} />
                  <p className="text-[12px] font-medium uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
                    Scaling
                  </p>
                </div>
                <p className="text-[13px] font-medium mb-1" style={{ color: "var(--text-1)" }}>
                  {result.feature_scaling.required ? result.feature_scaling.recommended_scaler : "Not required"}
                </p>
                <p className="text-[12px]" style={{ color: "var(--text-2)" }}>
                  {result.feature_scaling.reasoning}
                </p>
              </div>
            )}
            {result.alternative_models && (
              <div
                className="rounded-xl p-4"
                style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <IconRotate size={16} style={{ color: "var(--orange)" }} />
                  <p className="text-[12px] font-medium uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
                    Alternatives
                  </p>
                </div>
                <div className="space-y-2">
                  {result.alternative_models.slice(0, 2).map((alt: any, i: number) => (
                    <div key={i}>
                      <p className="text-[12px] font-medium" style={{ color: "var(--text-1)" }}>{alt.name}</p>
                      <p className="text-[11px]" style={{ color: "var(--text-2)" }}>{alt.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Starter Code */}
          {(result.starter_code?.sklearn || result.starter_code?.optuna) && (
            <div
              className="rounded-xl overflow-hidden"
              style={{ border: "1px solid var(--border)" }}
            >
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{
                  background: "var(--bg-2)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <div className="flex items-center gap-2">
                  <IconCode size={16} style={{ color: "var(--orange)" }} />
                  <p className="text-[12px] font-medium" style={{ color: "var(--text-1)" }}>
                    Starter Code
                  </p>
                </div>
                <div className="flex gap-2">
                  {result.starter_code?.sklearn && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-orange-500/10 text-orange-500 border border-orange-500/20">SKLEARN</span>
                  )}
                  {result.starter_code?.optuna && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">OPTUNA</span>
                  )}
                </div>
              </div>
              <div className="relative group">
                <pre
                  className="p-4 text-[12px] overflow-x-auto font-mono max-h-[400px]"
                  style={{ background: "var(--bg-1)", color: "#4ade80" }}
                >
                  {result.starter_code.sklearn || result.starter_code.optuna}
                </pre>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(result.starter_code.sklearn || result.starter_code.optuna);
                    toast.success("Code copied to clipboard");
                  }}
                  className="absolute top-4 right-4 p-2 rounded-lg bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <IconCheck size={14} />
                </button>
              </div>
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
    onError: (e: any) => toast.error("Chat failed. Please try again."),
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
        height: 620,
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
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
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
              className={`max-w-[85%] group relative`}
            >
              <div
                className="px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed shadow-sm"
                style={{
                  background:
                    m.role === "user" ? "var(--orange)" : "var(--bg-2)",
                  color: m.role === "user" ? "#000" : "var(--text-1)",
                  border:
                    m.role === "assistant"
                      ? "1px solid var(--border)"
                      : "none",
                  borderRadius: m.role === "user" ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
                }}
              >
                {m.role === "assistant" ? (
                  <div className="prose prose-invert max-w-none prose-sm">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ node, inline, className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || "")
                          return !inline && match ? (
                            <div className="relative group/code my-2">
                              <div className="flex items-center justify-between px-3 py-1.5 bg-[#1e1e1e] border-b border-white/5 rounded-t-lg">
                                <span className="text-[10px] uppercase font-bold text-white/40 tracking-widest">{match[1]}</span>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(String(children).replace(/\n$/, ""));
                                    toast.success("Code copied");
                                  }}
                                  className="text-white/40 hover:text-white transition-colors"
                                >
                                  <IconCheck size={12} />
                                </button>
                              </div>
                              <SyntaxHighlighter
                                {...props}
                                style={vscDarkPlus}
                                language={match[1]}
                                PreTag="div"
                                customStyle={{
                                  margin: 0,
                                  borderRadius: "0 0 8px 8px",
                                  fontSize: "12px",
                                  background: "#0f0f0f",
                                }}
                              >
                                {String(children).replace(/\n$/, "")}
                              </SyntaxHighlighter>
                            </div>
                          ) : (
                            <code
                              className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[12px]"
                              {...props}
                            >
                              {children}
                            </code>
                          )
                        },
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                        li: ({ children }) => <li className="">{children}</li>,
                        h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-md font-bold mb-2">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
                      }}
                    >
                      {m.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  m.content
                )}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(m.content);
                  toast.success("Message copied");
                }}
                className={`absolute ${m.role === "user" ? "-left-8" : "-right-8"} top-2 p-1.5 rounded-lg bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity`}
              >
                <IconCheck size={12} />
              </button>
            </div>
          </div>
        ))}
        {mutation.isPending && (
          <div className="flex justify-start">
            <div
              className="px-4 py-2.5 rounded-2xl text-[13px] flex items-center gap-2"
              style={{
                background: "var(--bg-2)",
                border: "1px solid var(--border)",
                color: "var(--text-3)",
                borderRadius: "20px 20px 20px 4px",
              }}
            >
              <div className="flex gap-1">
                <div className="w-1 h-1 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-1 h-1 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-1 h-1 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <span>AI is thinking...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div
        className="flex items-center gap-3 px-4 py-4 shrink-0"
        style={{
          borderTop: "1px solid var(--border)",
          background: "var(--bg-1)",
        }}
      >
        <div className="flex-1 relative">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="Ask anything about your dataset..."
            className="w-full pl-4 pr-12 py-2.5 rounded-xl text-[13px] outline-none transition-all shadow-sm"
            style={{
              background: "var(--bg-2)",
              border: "1px solid var(--border)",
              color: "var(--text-1)",
            }}
            onFocus={e => (e.target.style.borderColor = "var(--orange)")}
            onBlur={e => (e.target.style.borderColor = "var(--border)")}
          />
          <button
            onClick={send}
            disabled={!input.trim() || mutation.isPending || !dataset}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center transition-all shadow-lg"
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
    onError: (e: any) => toast.error("Model recommendation failed."),
  })

  return (
    <div className="space-y-4">
      <div
        className="rounded-xl p-5"
        style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2 mb-1">
          <IconWand size={16} style={{ color: "var(--orange)" }} />
          <p className="text-[13px] font-medium" style={{ color: "var(--text-1)" }}>
            Model Recommendations
          </p>
        </div>
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
          {mutation.isPending ? (
            <>
              <div className="w-3 h-3 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <IconWand size={14} />
              <span>Get recommendations</span>
            </>
          )}
        </button>
      </div>

      {mutation.isPending && (
        <div className="space-y-4 animate-pulse">
          <div className="h-40 rounded-xl" style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }} />
          <div className="h-40 rounded-xl" style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }} />
        </div>
      )}

      {result?.error && (
        <div
          className="rounded-xl p-8 flex flex-col items-center text-center gap-4"
          style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }}
        >
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-red-500/10 border border-red-500/20">
            <IconAlertTriangle size={24} style={{ color: "#f87171" }} />
          </div>
          <div>
            <p className="text-[14px] font-semibold mb-1" style={{ color: "var(--text-1)" }}>
              Something went wrong
            </p>
            <p className="text-[12px] max-w-[280px]" style={{ color: "var(--text-3)" }}>
              We encountered an issue while recommending models. Please try again.
            </p>
          </div>
          <button
            onClick={() => mutation.mutate()}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-[13px] font-medium transition-all hover:brightness-110 active:scale-95"
            style={{ background: "var(--orange)", color: "#000" }}
          >
            <IconRotate size={14} />
            <span>Try again</span>
          </button>
        </div>
      )}

      {result?.recommendations?.map((rec: any, i: number) => (
        <div
          key={i}
          className="rounded-xl p-5 group relative overflow-hidden"
          style={{
            background: "var(--bg-1)",
            border:
              i === 0
                ? "1px solid rgba(249,115,22,0.4)"
                : "1px solid var(--border)",
          }}
        >
          {i === 0 && (
            <div 
              className="absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-[10px] font-bold uppercase tracking-wider"
              style={{ background: "var(--orange)", color: "#000" }}
            >
              Top Pick
            </div>
          )}
          
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-[16px] font-bold shrink-0 shadow-lg"
                style={{
                  background: i === 0 ? "var(--orange)" : "var(--bg-3)",
                  color: i === 0 ? "#000" : "var(--text-2)",
                  border: i === 0 ? "none" : "1px solid var(--border)",
                }}
              >
                {i === 0 ? <IconAward size={20} /> : `#${rec.rank}`}
              </div>
              <div>
                <p
                  className="text-[15px] font-bold"
                  style={{ color: "var(--text-1)" }}
                >
                  {rec.model}
                </p>
                <div className="flex items-center gap-2 text-[11px]" style={{ color: "var(--text-3)" }}>
                  <span className="font-mono">{rec.library}</span>
                  <span>•</span>
                  <span>{rec.task_type}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <div 
                className="flex flex-col items-center px-2 py-1 rounded-lg border"
                style={{ background: "var(--bg-2)", borderColor: "var(--border)" }}
              >
                <IconHistory size={12} style={{ color: "var(--text-3)" }} />
                <span className="text-[10px] font-medium" style={{ color: "var(--text-2)" }}>{rec.training_time}</span>
              </div>
              <div 
                className="flex flex-col items-center px-2 py-1 rounded-lg border"
                style={{ background: "var(--bg-2)", borderColor: "var(--border)" }}
              >
                <IconEye size={12} style={{ color: "var(--text-3)" }} />
                <span className="text-[10px] font-medium" style={{ color: "var(--text-2)" }}>{rec.interpretability}</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 mb-4">
            <div className="w-1 shrink-0 rounded-full" style={{ background: i === 0 ? "var(--orange)" : "var(--border)" }} />
            <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-2)" }}>
              {rec.reasoning}
            </p>
          </div>

          {rec.quick_start_code && (
            <div className="relative group/code mt-4">
              <div className="flex items-center gap-2 mb-2 px-1">
                <IconCode size={12} style={{ color: "var(--text-3)" }} />
                <span className="text-[10px] uppercase font-bold tracking-widest" style={{ color: "var(--text-3)" }}>Quick Start Code</span>
              </div>
              <pre
                className="text-[11px] p-3.5 rounded-xl overflow-x-auto font-mono"
                style={{ background: "var(--bg-3)", color: "#4ade80", border: "1px solid var(--border)" }}
              >
                {rec.quick_start_code}
              </pre>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(rec.quick_start_code);
                  toast.success("Code copied");
                }}
                className="absolute top-10 right-3 p-2 rounded-lg bg-black/50 text-white opacity-0 group-hover/code:opacity-100 transition-opacity"
              >
                <IconCheck size={14} />
              </button>
            </div>
          )}
        </div>
      ))}

      {result && (
        <div
          className="rounded-xl p-5"
          style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <IconInfoCircle size={16} style={{ color: "var(--orange)" }} />
            <p className="text-[12px] font-medium uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
              Data Assessment
            </p>
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-[10px] uppercase font-bold mb-1.5" style={{ color: "var(--text-3)" }}>
                Data size
              </p>
              <p
                className="text-[14px] font-semibold capitalize"
                style={{ color: "var(--text-1)" }}
              >
                {result.data_size_assessment}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold mb-1.5" style={{ color: "var(--text-3)" }}>
                Recommended split
              </p>
              <div className="flex items-center gap-1.5">
                 <div className="flex h-2 flex-1 rounded-full overflow-hidden bg-white/5">
                    <div className="bg-orange-500" style={{ width: `${(result.recommended_split?.train || 0.7) * 100}%` }} />
                    <div className="bg-orange-500/50" style={{ width: `${(result.recommended_split?.val || 0.15) * 100}%` }} />
                    <div className="bg-orange-500/20" style={{ width: `${(result.recommended_split?.test || 0.15) * 100}%` }} />
                 </div>
                 <span className="text-[12px] font-mono" style={{ color: "var(--text-1)" }}>
                    {result.recommended_split
                      ? `${(result.recommended_split.train * 100).toFixed(0)}/${(result.recommended_split.val * 100).toFixed(0)}/${(result.recommended_split.test * 100).toFixed(0)}`
                      : "70/15/15"}
                 </span>
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold mb-1.5" style={{ color: "var(--text-3)" }}>
                Eval metrics
              </p>
              <div className="flex flex-wrap gap-1">
                {result.evaluation_metrics?.map((m: string) => (
                  <span key={m} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10" style={{ color: "var(--text-2)" }}>
                    {m}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
