"use client"

import { useState } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { aiApi, providersApi } from "@/lib/api"
import { toast } from "sonner"
import {
  IconSparkles, IconSend, IconRobot,
  IconMathFunction, IconWand, IconBrain,
  IconChevronDown, IconCode, IconCheck,
} from "@tabler/icons-react"
import Link from "next/link"

export default function AITab({
  datasetId,
  activeTab,
  dataset,
}: {
  datasetId: number
  activeTab: string
  dataset: any
}) {
  const { data: providers = [] } = useQuery({
    queryKey: ["providers"],
    queryFn: () => providersApi.list().then(r => r.data),
  })

  const defaultProvider = providers.find((p: any) => p.is_default) || providers[0]

  if (!defaultProvider) {
    return (
      <div
        className="rounded-xl p-10 text-center"
        style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }}
      >
        <IconBrain size={28} className="mx-auto mb-4" style={{ color: "var(--text-3)" }} />
        <p className="text-[15px] font-medium mb-2" style={{ color: "var(--text-1)" }}>
          No AI provider connected
        </p>
        <p className="text-[13px] mb-5" style={{ color: "var(--text-2)" }}>
          Add an API key from Anthropic, OpenAI, Gemini, or others to run AI analysis.
        </p>
        <Link
          href="/dashboard/settings/providers"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium"
          style={{ background: "var(--orange)", color: "#000" }}
        >
          Add API provider
        </Link>
      </div>
    )
  }

  if (activeTab === "features") return <FeaturesTab datasetId={datasetId} providerId={defaultProvider?.id} />
  if (activeTab === "hyperparams") return <HyperparamsTab datasetId={datasetId} providerId={defaultProvider?.id} />
  if (activeTab === "chat") return <ChatTab datasetId={datasetId} providerId={defaultProvider?.id} />
  if (activeTab === "models") return <ModelsTab datasetId={datasetId} providerId={defaultProvider?.id} />
  return null
}

function FeaturesTab({ datasetId, providerId }: { datasetId: number; providerId: number }) {
  const [goal, setGoal] = useState("")
  const [result, setResult] = useState<any>(null)

  const mutation = useMutation({
    mutationFn: () => aiApi.features({ dataset_id: datasetId, goal, provider_id: providerId }),
    onSuccess: (r) => setResult(r.data.result),
    onError: (e: any) => toast.error(e?.response?.data?.detail || "AI request failed"),
  })

  return (
    <div className="space-y-4">
      <div className="rounded-xl p-5" style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }}>
        <p className="text-[13px] font-medium mb-3" style={{ color: "var(--text-1)" }}>
          Describe your prediction goal
        </p>
        <textarea
          value={goal}
          onChange={e => setGoal(e.target.value)}
          placeholder="eg. Predict customer churn based on usage patterns..."
          rows={3}
          className="w-full px-3.5 py-2.5 rounded-lg text-[13px] outline-none resize-none transition-all"
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
          disabled={!goal.trim() || mutation.isPending}
          className="mt-3 flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all"
          style={{
            background: (!goal.trim() || mutation.isPending) ? "rgba(249,115,22,0.4)" : "var(--orange)",
            color: "#000",
            cursor: (!goal.trim() || mutation.isPending) ? "not-allowed" : "pointer",
          }}
        >
          <IconSparkles size={14} />
          {mutation.isPending ? "Analyzing..." : "Generate feature ideas"}
        </button>
      </div>

      {result?.feature_ideas && (
        <div className="space-y-3">
          <p className="text-[12px] font-medium tracking-widest uppercase" style={{ color: "var(--text-3)" }}>
            {result.feature_ideas.length} feature ideas
          </p>
          {result.feature_ideas.map((f: any, i: number) => (
            <div
              key={i}
              className="rounded-xl p-5"
              style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="text-[14px] font-medium mb-1" style={{ color: "var(--text-1)" }}>
                    {f.name}
                  </p>
                  <p className="text-[12px]" style={{ color: "var(--text-2)" }}>{f.description}</p>
                </div>
                <span
                  className="shrink-0 text-[11px] px-2 py-1 rounded-md"
                  style={{
                    background: f.expected_impact === "high" ? "rgba(249,115,22,0.1)" : "var(--bg-3)",
                    color: f.expected_impact === "high" ? "var(--orange)" : "var(--text-3)",
                  }}
                >
                  {f.expected_impact} impact
                </span>
              </div>
              {f.code && (
                <pre
                  className="text-[12px] p-3 rounded-lg overflow-x-auto font-mono"
                  style={{ background: "var(--bg-3)", color: "#4ade80" }}
                >
                  {f.code}
                </pre>
              )}
              <p className="text-[12px] mt-3" style={{ color: "var(--text-3)" }}>
                {f.reasoning}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function HyperparamsTab({ datasetId, providerId }: { datasetId: number; providerId: number }) {
  const [modelType, setModelType] = useState("")
  const [taskType, setTaskType] = useState("classification")
  const [result, setResult] = useState<any>(null)

  const models = ["RandomForest", "XGBoost", "LightGBM", "LogisticRegression", "SVM", "KNN", "DecisionTree", "GradientBoosting", "AdaBoost", "NeuralNetwork"]

  const mutation = useMutation({
    mutationFn: () => aiApi.hyperparams({ dataset_id: datasetId, model_type: modelType, task_type: taskType, provider_id: providerId }),
    onSuccess: (r) => setResult(r.data.result),
    onError: (e: any) => toast.error(e?.response?.data?.detail || "AI request failed"),
  })

  return (
    <div className="space-y-4">
      <div className="rounded-xl p-5" style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }}>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-[12px] mb-1.5" style={{ color: "var(--text-2)" }}>Model</label>
            <select
              value={modelType}
              onChange={e => setModelType(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-[13px] outline-none"
              style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--text-1)" }}
            >
              <option value="">Select model...</option>
              {models.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[12px] mb-1.5" style={{ color: "var(--text-2)" }}>Task type</label>
            <select
              value={taskType}
              onChange={e => setTaskType(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-[13px] outline-none"
              style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--text-1)" }}
            >
              <option value="classification">Classification</option>
              <option value="regression">Regression</option>
              <option value="clustering">Clustering</option>
            </select>
          </div>
        </div>
        <button
          onClick={() => mutation.mutate()}
          disabled={!modelType || mutation.isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium"
          style={{
            background: (!modelType || mutation.isPending) ? "rgba(249,115,22,0.4)" : "var(--orange)",
            color: "#000",
            cursor: (!modelType || mutation.isPending) ? "not-allowed" : "pointer",
          }}
        >
          <IconMathFunction size={14} />
          {mutation.isPending ? "Generating..." : "Get tuning guide"}
        </button>
      </div>

      {result?.hyperparameters && (
        <div className="space-y-3">
          {/* Overview */}
          {result.model_overview && (
            <div className="rounded-xl p-5" style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }}>
              <p className="text-[14px] font-medium mb-2" style={{ color: "var(--text-1)" }}>{result.model_overview.name}</p>
              <p className="text-[13px] mb-3" style={{ color: "var(--text-2)" }}>{result.model_overview.best_for}</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] mb-1.5" style={{ color: "var(--text-3)" }}>PROS</p>
                  {result.model_overview.pros?.map((p: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-[12px] mb-1" style={{ color: "var(--text-2)" }}>
                      <IconCheck size={11} style={{ color: "#4ade80" }} />{p}
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-[11px] mb-1.5" style={{ color: "var(--text-3)" }}>CONS</p>
                  {result.model_overview.cons?.map((c: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-[12px] mb-1" style={{ color: "var(--text-2)" }}>
                      <span style={{ color: "#f87171", fontSize: 14 }}>−</span>{c}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Params */}
          <p className="text-[12px] font-medium tracking-widest uppercase" style={{ color: "var(--text-3)" }}>
            Hyperparameters
          </p>
          {result.hyperparameters.map((hp: any, i: number) => (
            <div key={i} className="rounded-xl p-4" style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="text-[13px] font-medium font-mono" style={{ color: "var(--orange)" }}>{hp.name}</span>
                  <p className="text-[12px] mt-0.5" style={{ color: "var(--text-2)" }}>{hp.description}</p>
                </div>
                <span
                  className="text-[11px] px-2 py-0.5 rounded-md shrink-0"
                  style={{
                    background: hp.impact === "high" ? "rgba(249,115,22,0.1)" : "var(--bg-3)",
                    color: hp.impact === "high" ? "var(--orange)" : "var(--text-3)",
                  }}
                >
                  {hp.impact} impact
                </span>
              </div>
              <div className="flex gap-4 text-[12px]">
                <span style={{ color: "var(--text-3)" }}>Default: <span style={{ color: "var(--text-1)" }}>{hp.default_value}</span></span>
                <span style={{ color: "var(--text-3)" }}>Recommended: <span style={{ color: "var(--orange)" }}>{hp.recommended_value}</span></span>
                <span style={{ color: "var(--text-3)" }}>Range: <span style={{ color: "var(--text-1)" }}>{hp.recommended_range?.min} – {hp.recommended_range?.max}</span></span>
              </div>
            </div>
          ))}

          {/* Starter code */}
          {result.starter_code?.sklearn && (
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2 px-4 py-3" style={{ background: "var(--bg-2)", borderBottom: "1px solid var(--border)" }}>
                <IconCode size={14} style={{ color: "var(--orange)" }} />
                <p className="text-[12px] font-medium" style={{ color: "var(--text-1)" }}>Sklearn starter code</p>
              </div>
              <pre className="p-4 text-[12px] overflow-x-auto font-mono" style={{ background: "var(--bg-1)", color: "#4ade80" }}>
                {result.starter_code.sklearn}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ChatTab({ datasetId, providerId }: { datasetId: number; providerId: number }) {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([])
  const [input, setInput] = useState("")

  const mutation = useMutation({
    mutationFn: (msgs: any[]) => aiApi.chat({ dataset_id: datasetId, messages: msgs, provider_id: providerId }),
    onSuccess: (r) => {
      setMessages(prev => [...prev, { role: "assistant", content: r.data.response }])
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || "Chat failed"),
  })

  const send = () => {
    if (!input.trim()) return
    const newMessages = [...messages, { role: "user", content: input }]
    setMessages(newMessages)
    setInput("")
    mutation.mutate(newMessages)
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
      {/* Messages */}
      <div className="h-96 overflow-y-auto p-5 space-y-4" style={{ background: "var(--bg-1)" }}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <IconRobot size={28} className="mb-3" style={{ color: "var(--text-3)" }} />
            <p className="text-[14px] font-medium mb-1" style={{ color: "var(--text-1)" }}>
              Chat with your dataset
            </p>
            <p className="text-[12px] max-w-sm" style={{ color: "var(--text-3)" }}>
              Ask questions about your data. Try "What columns have missing values?" or "Which features correlate most with the target?"
            </p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className="max-w-[80%] px-4 py-2.5 rounded-xl text-[13px] leading-relaxed"
              style={{
                background: m.role === "user" ? "var(--orange)" : "var(--bg-2)",
                color: m.role === "user" ? "#000" : "var(--text-1)",
                border: m.role === "assistant" ? "1px solid var(--border)" : "none",
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
              style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--text-3)" }}
            >
              Thinking...
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{ borderTop: "1px solid var(--border)", background: "var(--bg-2)" }}
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
          disabled={!input.trim() || mutation.isPending}
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
          style={{
            background: (!input.trim() || mutation.isPending) ? "rgba(249,115,22,0.4)" : "var(--orange)",
            cursor: (!input.trim() || mutation.isPending) ? "not-allowed" : "pointer",
          }}
        >
          <IconSend size={14} color="#000" />
        </button>
      </div>
    </div>
  )
}

function ModelsTab({ datasetId, providerId }: { datasetId: number; providerId: number }) {
  const [goal, setGoal] = useState("")
  const [result, setResult] = useState<any>(null)

  const mutation = useMutation({
    mutationFn: () => aiApi.recommendModel({ dataset_id: datasetId, goal, provider_id: providerId }),
    onSuccess: (r) => setResult(r.data.result),
    onError: (e: any) => toast.error(e?.response?.data?.detail || "AI request failed"),
  })

  return (
    <div className="space-y-4">
      <div className="rounded-xl p-5" style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }}>
        <p className="text-[13px] font-medium mb-3" style={{ color: "var(--text-1)" }}>
          What are you trying to predict or discover?
        </p>
        <textarea
          value={goal}
          onChange={e => setGoal(e.target.value)}
          placeholder="eg. Predict whether a customer will churn next month..."
          rows={2}
          className="w-full px-3.5 py-2.5 rounded-lg text-[13px] outline-none resize-none"
          style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--text-1)" }}
          onFocus={e => (e.target.style.borderColor = "var(--orange)")}
          onBlur={e => (e.target.style.borderColor = "var(--border)")}
        />
        <button
          onClick={() => mutation.mutate()}
          disabled={!goal.trim() || mutation.isPending}
          className="mt-3 flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium"
          style={{
            background: (!goal.trim() || mutation.isPending) ? "rgba(249,115,22,0.4)" : "var(--orange)",
            color: "#000",
            cursor: (!goal.trim() || mutation.isPending) ? "not-allowed" : "pointer",
          }}
        >
          <IconWand size={14} />
          {mutation.isPending ? "Analyzing..." : "Get model recommendations"}
        </button>
      </div>

      {result?.recommendations && (
        <div className="space-y-3">
          {result.recommendations.map((rec: any, i: number) => (
            <div
              key={i}
              className="rounded-xl p-5"
              style={{
                background: "var(--bg-1)",
                border: i === 0 ? "1px solid rgba(249,115,22,0.3)" : "1px solid var(--border)",
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold"
                    style={{ background: i === 0 ? "var(--orange)" : "var(--bg-3)", color: i === 0 ? "#000" : "var(--text-2)" }}
                  >
                    #{rec.rank}
                  </div>
                  <div>
                    <p className="text-[14px] font-medium" style={{ color: "var(--text-1)" }}>{rec.model}</p>
                    <p className="text-[11px]" style={{ color: "var(--text-3)" }}>{rec.library} · {rec.task_type}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="text-[11px] px-2 py-1 rounded-md" style={{ background: "var(--bg-3)", color: "var(--text-3)" }}>
                    {rec.training_time} train
                  </span>
                  <span className="text-[11px] px-2 py-1 rounded-md" style={{ background: "var(--bg-3)", color: "var(--text-3)" }}>
                    {rec.interpretability} interp.
                  </span>
                </div>
              </div>
              <p className="text-[13px] mb-3" style={{ color: "var(--text-2)" }}>{rec.reasoning}</p>
              {rec.quick_start_code && (
                <pre className="text-[11px] p-3 rounded-lg overflow-x-auto font-mono" style={{ background: "var(--bg-3)", color: "#4ade80" }}>
                  {rec.quick_start_code}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
