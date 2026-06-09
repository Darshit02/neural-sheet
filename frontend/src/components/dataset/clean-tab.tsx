"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import { cleaningApi } from "@/lib/api"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { fadeUp, stagger } from "@/lib/motion"
import {
  IconSparkles, IconPlayerPlay, IconDownload,
  IconTrash, IconPlus, IconCheck, IconX,
  IconWand, IconAlertTriangle, IconCircleCheck,
  IconChevronDown, IconArrowRight, IconRefresh,
  IconDatabase, IconCode, IconEye,
} from "@tabler/icons-react"

const OPERATION_OPTIONS = [
  { group: "Missing Values",
    ops: [
      { type: "fill_mean",         label: "Fill with mean",          cols: "numeric" },
      { type: "fill_median",       label: "Fill with median",        cols: "numeric" },
      { type: "fill_mode",         label: "Fill with mode",          cols: "any" },
      { type: "fill_value",        label: "Fill with constant",      cols: "any",     hasValue: true },
      { type: "fill_ffill",        label: "Forward fill",            cols: "any" },
      { type: "fill_bfill",        label: "Backward fill",           cols: "any" },
      { type: "drop_rows_missing", label: "Drop rows with missing",  cols: "any" },
      { type: "drop_column",       label: "Drop column",             cols: "any" },
    ],
  },
  { group: "Duplicates",
    ops: [
      { type: "drop_duplicates", label: "Remove duplicate rows", cols: "none" },
    ],
  },
  { group: "Outliers",
    ops: [
      { type: "cap_outliers_iqr",    label: "Cap outliers (IQR)",     cols: "numeric" },
      { type: "drop_outliers_iqr",   label: "Drop outlier rows (IQR)", cols: "numeric" },
      { type: "cap_outliers_zscore", label: "Cap outliers (Z-score)",  cols: "numeric" },
    ],
  },
  { group: "Type Conversion",
    ops: [
      { type: "cast_int",      label: "Convert to integer",  cols: "any" },
      { type: "cast_float",    label: "Convert to float",    cols: "any" },
      { type: "cast_string",   label: "Convert to string",   cols: "any" },
      { type: "cast_datetime", label: "Convert to datetime", cols: "any" },
    ],
  },
  { group: "String Cleaning",
    ops: [
      { type: "strip_whitespace", label: "Strip whitespace", cols: "text" },
      { type: "lowercase",        label: "Lowercase",        cols: "text" },
      { type: "uppercase",        label: "Uppercase",        cols: "text" },
    ],
  },
  { group: "Encoding",
    ops: [
      { type: "label_encode",  label: "Label encode",    cols: "text" },
      { type: "onehot_encode", label: "One-hot encode",  cols: "text" },
    ],
  },
  { group: "Scaling",
    ops: [
      { type: "normalize_minmax",   label: "Min-max normalise [0,1]", cols: "numeric" },
      { type: "standardize_zscore", label: "Z-score standardise",     cols: "numeric" },
    ],
  },
]

const SEVERITY_COLOR: Record<string, string> = {
  high: "#f87171", medium: "#facc15", low: "#4ade80",
}

interface Op {
  id: string
  type: string
  column?: string
  value?: any
  label: string
}

export default function CleanTab({
  datasetId,
  dataset,
}: {
  datasetId: number
  dataset: any
}) {
  const router = useRouter()
  const qc = useQueryClient()
  const [ops, setOps] = useState<Op[]>([])
  const [preview, setPreview] = useState<any>(null)
  const [newName, setNewName] = useState(`${dataset?.name || "dataset"}_cleaned`)
  const [showAddOp, setShowAddOp] = useState(false)
  const [addCol, setAddCol] = useState("")
  const [addOpType, setAddOpType] = useState("")
  const [addValue, setAddValue] = useState("")
  const [activeGroup, setActiveGroup] = useState<string | null>(null)

  const columns = dataset?.columns || []
  const numericCols = dataset?.profile_summary?.column_info
    ?.filter((c: any) => c.is_numeric)
    ?.map((c: any) => c.name) || []

  // Auto-suggest from backend
  const { data: suggestData } = useQuery({
    queryKey: ["clean-suggestions", datasetId],
    queryFn: () => cleaningApi.suggestions(datasetId).then(r => r.data),
    enabled: !!dataset?.profile_summary,
  })

  const suggestions = suggestData?.suggestions || []

  const previewMutation = useMutation({
    mutationFn: () =>
      cleaningApi.preview(datasetId, ops.map(o => ({
        type: o.type, column: o.column, value: o.value,
      }))),
    onSuccess: r => setPreview(r.data),
    onError: (e: any) => toast.error(e?.response?.data?.detail || "Preview failed"),
  })

  const applyMutation = useMutation({
    mutationFn: () =>
      cleaningApi.apply(
        datasetId,
        ops.map(o => ({ type: o.type, column: o.column, value: o.value })),
        newName,
      ),
    onSuccess: r => {
      toast.success(r.data.message)
      qc.invalidateQueries({ queryKey: ["datasets"] })
      router.push(`/dashboard/datasets/${r.data.dataset_id}`)
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || "Apply failed"),
  })

  const downloadMutation = useMutation({
    mutationFn: () =>
      cleaningApi.download(
        datasetId,
        ops.map(o => ({ type: o.type, column: o.column, value: o.value })),
      ),
    onSuccess: (r) => {
      const url = URL.createObjectURL(new Blob([r.data]))
      const a   = document.createElement("a")
      a.href    = url
      a.download = `${newName}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Download started!")
    },
    onError: (e: any) => toast.error("Download failed"),
  })

  const addSuggestion = (s: any) => {
    const id = `${s.op}-${s.column || "all"}-${Date.now()}`
    if (ops.find(o => o.type === s.op && o.column === s.column)) return
    setOps(prev => [...prev, {
      id,
      type: s.op,
      column: s.column || undefined,
      label: `${s.label}${s.column ? ` — ${s.column}` : ""}`,
    }])
  }

  const addAllSuggestions = () => {
    suggestions.forEach((s: any) => addSuggestion(s))
  }

  const addCustomOp = () => {
    if (!addOpType) return
    const opMeta = OPERATION_OPTIONS.flatMap(g => g.ops).find(o => o.type === addOpType)
    const needsCol = opMeta?.cols !== "none"
    if (needsCol && !addCol) { toast.error("Select a column"); return }
    const id = `${addOpType}-${addCol}-${Date.now()}`
    setOps(prev => [...prev, {
      id,
      type: addOpType,
      column: needsCol ? addCol : undefined,
      value: addValue || undefined,
      label: `${opMeta?.label || addOpType}${needsCol && addCol ? ` — ${addCol}` : ""}`,
    }])
    setAddOpType("")
    setAddCol("")
    setAddValue("")
    setShowAddOp(false)
  }

  const removeOp = (id: string) => setOps(prev => prev.filter(o => o.id !== id))

  const moveOp = (id: string, dir: -1 | 1) => {
    setOps(prev => {
      const i = prev.findIndex(o => o.id === id)
      if (i < 0) return prev
      const next = [...prev]
      const swap = i + dir
      if (swap < 0 || swap >= next.length) return prev
      ;[next[i], next[swap]] = [next[swap], next[i]]
      return next
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* ── Left: build pipeline ─────────────────────── */}
      <div className="lg:col-span-2 space-y-4">

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <motion.div
            variants={fadeUp} initial="hidden" animate="show"
            className="rounded-xl overflow-hidden"
            style={{ border: "1px solid var(--border)" }}
          >
            <div
              className="flex items-center justify-between px-5 py-3.5"
              style={{ background: "var(--bg-1)", borderBottom: "1px solid var(--border)" }}
            >
              <div className="flex items-center gap-2">
                <IconWand size={15} style={{ color: "var(--orange)" }} />
                <p className="text-[13px] font-medium" style={{ color: "var(--text-1)" }}>
                  AI suggestions
                </p>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{ background: "var(--orange-dim)", color: "var(--orange)" }}
                >
                  {suggestions.length}
                </span>
              </div>
              <button
                onClick={addAllSuggestions}
                className="flex items-center gap-1.5 text-[12px] font-medium transition-colors"
                style={{ color: "var(--orange)" }}
              >
                <IconPlus size={12} /> Add all
              </button>
            </div>
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {suggestions.map((s: any, i: number) => {
                const alreadyAdded = ops.some(
                  o => o.type === s.op && o.column === s.column
                )
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between px-5 py-3"
                    style={{ background: "var(--bg-1)" }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: SEVERITY_COLOR[s.severity] || "var(--text-3)" }}
                      />
                      <div>
                        <p className="text-[12px] font-medium" style={{ color: "var(--text-1)" }}>
                          {s.label}
                          {s.column && (
                            <span
                              className="ml-1.5 font-mono text-[11px] px-1.5 py-0.5 rounded"
                              style={{ background: "var(--bg-3)", color: "var(--orange)" }}
                            >
                              {s.column}
                            </span>
                          )}
                        </p>
                        <p className="text-[11px]" style={{ color: "var(--text-3)" }}>
                          {s.issue}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => addSuggestion(s)}
                      disabled={alreadyAdded}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-all"
                      style={{
                        background: alreadyAdded ? "var(--bg-3)" : "var(--orange-dim)",
                        color: alreadyAdded ? "var(--text-3)" : "var(--orange)",
                        border: `1px solid ${alreadyAdded ? "var(--border)" : "var(--orange-border)"}`,
                        cursor: alreadyAdded ? "not-allowed" : "pointer",
                      }}
                    >
                      {alreadyAdded ? <IconCheck size={12} /> : <IconPlus size={12} />}
                      {alreadyAdded ? "Added" : "Add"}
                    </button>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Pipeline */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="show"
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid var(--border)" }}
        >
          <div
            className="flex items-center justify-between px-5 py-3.5"
            style={{ background: "var(--bg-1)", borderBottom: "1px solid var(--border)" }}
          >
            <div className="flex items-center gap-2">
              <IconDatabase size={15} style={{ color: "var(--orange)" }} />
              <p className="text-[13px] font-medium" style={{ color: "var(--text-1)" }}>
                Cleaning pipeline
              </p>
              {ops.length > 0 && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                  style={{ background: "var(--orange)", color: "#000" }}
                >
                  {ops.length}
                </span>
              )}
            </div>
            <button
              onClick={() => setShowAddOp(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium"
              style={{ background: "var(--bg-3)", color: "var(--text-2)", border: "1px solid var(--border)" }}
            >
              <IconPlus size={12} /> Add operation
            </button>
          </div>

          {ops.length === 0 ? (
            <div className="py-12 text-center" style={{ background: "var(--bg-1)" }}>
              <IconWand size={24} className="mx-auto mb-3" style={{ color: "var(--text-3)" }} />
              <p className="text-[13px] font-medium mb-1" style={{ color: "var(--text-1)" }}>
                No operations yet
              </p>
              <p className="text-[12px]" style={{ color: "var(--text-3)" }}>
                Add suggestions above or create custom operations.
              </p>
            </div>
          ) : (
            <div
              className="divide-y"
              style={{ borderColor: "var(--border)", background: "var(--bg-1)" }}
            >
              {ops.map((op, i) => (
                <motion.div
                  key={op.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  className="flex items-center gap-3 px-5 py-3"
                >
                  {/* Step number */}
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                    style={{ background: "var(--orange)", color: "#000" }}
                  >
                    {i + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate" style={{ color: "var(--text-1)" }}>
                      {op.label}
                    </p>
                    <p className="text-[11px] font-mono" style={{ color: "var(--text-3)" }}>
                      {op.type}
                      {op.value != null ? ` = ${op.value}` : ""}
                    </p>
                  </div>

                  {/* Reorder + remove */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => moveOp(op.id, -1)}
                      disabled={i === 0}
                      className="w-6 h-6 rounded flex items-center justify-center text-[10px] disabled:opacity-20"
                      style={{ color: "var(--text-3)" }}
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveOp(op.id, 1)}
                      disabled={i === ops.length - 1}
                      className="w-6 h-6 rounded flex items-center justify-center text-[10px] disabled:opacity-20"
                      style={{ color: "var(--text-3)" }}
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => removeOp(op.id)}
                      className="w-6 h-6 rounded flex items-center justify-center"
                      style={{ color: "#f87171" }}
                    >
                      <IconX size={12} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Add operation form */}
          <AnimatePresence>
            {showAddOp && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{
                  overflow: "hidden",
                  borderTop: "1px solid var(--border)",
                  background: "var(--bg-2)",
                }}
              >
                <div className="p-5 space-y-3">
                  <p className="text-[12px] font-medium" style={{ color: "var(--text-1)" }}>
                    Custom operation
                  </p>

                  {/* Group selector */}
                  <div className="flex gap-2 flex-wrap">
                    {OPERATION_OPTIONS.map(g => (
                      <button
                        key={g.group}
                        onClick={() => setActiveGroup(activeGroup === g.group ? null : g.group)}
                        className="px-2.5 py-1 rounded-lg text-[11px] transition-all"
                        style={{
                          background: activeGroup === g.group ? "var(--orange-dim)" : "var(--bg-3)",
                          color: activeGroup === g.group ? "var(--orange)" : "var(--text-2)",
                          border: activeGroup === g.group ? "1px solid var(--orange-border)" : "1px solid var(--border)",
                        }}
                      >
                        {g.group}
                      </button>
                    ))}
                  </div>

                  {activeGroup && (
                    <div className="grid grid-cols-2 gap-2">
                      {OPERATION_OPTIONS.find(g => g.group === activeGroup)?.ops.map(o => (
                        <button
                          key={o.type}
                          onClick={() => setAddOpType(o.type)}
                          className="px-3 py-2 rounded-lg text-[12px] text-left transition-all"
                          style={{
                            background: addOpType === o.type ? "var(--orange-dim)" : "var(--bg-1)",
                            color: addOpType === o.type ? "var(--orange)" : "var(--text-2)",
                            border: addOpType === o.type ? "1px solid var(--orange-border)" : "1px solid var(--border)",
                          }}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {addOpType && (() => {
                    const opMeta = OPERATION_OPTIONS.flatMap(g => g.ops).find(o => o.type === addOpType)
                    const needsCol = opMeta?.cols !== "none"
                    const isNumericOp = opMeta?.cols === "numeric"
                    const colOptions = isNumericOp ? numericCols : columns
                    return (
                      <div className="space-y-2">
                        {needsCol && (
                          <select
                            value={addCol}
                            onChange={e => setAddCol(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg text-[12px] outline-none"
                            style={{ background: "var(--bg-1)", border: "1px solid var(--border)", color: "var(--text-1)" }}
                          >
                            <option value="">Select column...</option>
                            {colOptions.map((c: string) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        )}
                        {opMeta?.hasValue && (
                          <input
                            value={addValue}
                            onChange={e => setAddValue(e.target.value)}
                            placeholder="Fill value..."
                            className="w-full px-3 py-2 rounded-lg text-[12px] outline-none"
                            style={{ background: "var(--bg-1)", border: "1px solid var(--border)", color: "var(--text-1)" }}
                          />
                        )}
                      </div>
                    )
                  })()}

                  <div className="flex gap-2">
                    <button
                      onClick={addCustomOp}
                      disabled={!addOpType}
                      className="px-4 py-2 rounded-lg text-[12px] font-medium"
                      style={{
                        background: addOpType ? "var(--orange)" : "rgba(249,115,22,0.3)",
                        color: "#000",
                      }}
                    >
                      Add to pipeline
                    </button>
                    <button
                      onClick={() => { setShowAddOp(false); setActiveGroup(null); setAddOpType(""); }}
                      className="px-4 py-2 rounded-lg text-[12px]"
                      style={{ border: "1px solid var(--border)", color: "var(--text-2)" }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Preview button */}
        {ops.length > 0 && (
          <motion.div variants={fadeUp} initial="hidden" animate="show"
            className="flex items-center gap-3"
          >
            <button
              onClick={() => previewMutation.mutate()}
              disabled={previewMutation.isPending}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all"
              style={{
                background: "var(--bg-1)",
                border: "1px solid var(--border)",
                color: "var(--text-1)",
              }}
            >
              <IconEye size={14} />
              {previewMutation.isPending ? "Previewing..." : "Preview result"}
            </button>
            <button
              onClick={() => setOps([])}
              className="flex items-center gap-1.5 text-[12px]"
              style={{ color: "var(--text-3)" }}
            >
              <IconRefresh size={12} /> Reset
            </button>
          </motion.div>
        )}

        {/* Preview result */}
        <AnimatePresence>
          {preview && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-xl overflow-hidden"
              style={{ border: "1px solid #4ade8030" }}
            >
              <div
                className="px-5 py-3.5 flex items-center gap-2"
                style={{ background: "rgba(74,222,128,0.05)", borderBottom: "1px solid #4ade8020" }}
              >
                <IconCircleCheck size={15} style={{ color: "#4ade80" }} />
                <p className="text-[13px] font-medium" style={{ color: "var(--text-1)" }}>
                  Preview — {preview.cleaned_shape[0].toLocaleString()} rows × {preview.cleaned_shape[1]} columns
                </p>
              </div>

              {/* Diff stats */}
              <div
                className="grid grid-cols-4 divide-x"
                style={{ borderBottom: "1px solid var(--border)", borderColor: "var(--border)" }}
              >
                {[
                  { label: "Rows removed",    value: preview.rows_removed,   color: preview.rows_removed > 0 ? "#facc15" : "#4ade80" },
                  { label: "Cols removed",    value: preview.cols_removed,   color: preview.cols_removed > 0 ? "#facc15" : "#4ade80" },
                  { label: "Missing before",  value: preview.missing_before, color: "var(--text-1)" },
                  { label: "Missing after",   value: preview.missing_after,  color: preview.missing_after < preview.missing_before ? "#4ade80" : "#f87171" },
                ].map(s => (
                  <div
                    key={s.label}
                    className="flex flex-col items-center py-3"
                    style={{ background: "var(--bg-1)" }}
                  >
                    <span className="text-[18px] font-semibold" style={{ color: s.color }}>
                      {s.value}
                    </span>
                    <span className="text-[10px]" style={{ color: "var(--text-3)" }}>
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Operations log */}
              <div className="px-5 py-3 space-y-1" style={{ background: "var(--bg-1)", borderBottom: "1px solid var(--border)" }}>
                <p className="text-[11px] font-medium tracking-widest uppercase mb-2" style={{ color: "var(--text-3)" }}>
                  Operations applied
                </p>
                {preview.operations_log.map((log: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-[12px]" style={{ color: "var(--text-2)" }}>
                    <IconCheck size={11} style={{ color: "#4ade80", flexShrink: 0 }} />
                    {log}
                  </div>
                ))}
              </div>

              {/* Sample rows */}
              <div style={{ overflowX: "auto", background: "var(--bg-1)" }}>
                <p className="px-5 pt-3 pb-1 text-[11px] font-medium tracking-widest uppercase" style={{ color: "var(--text-3)" }}>
                  Sample output (first 10 rows)
                </p>
                <table className="w-full text-[11px]" style={{ minWidth: 400 }}>
                  <thead>
                    <tr style={{ background: "var(--bg-2)", borderBottom: "1px solid var(--border)" }}>
                      {preview.columns.map((c: string) => (
                        <th key={c} className="px-4 py-2 text-left font-medium whitespace-nowrap" style={{ color: "var(--text-3)" }}>
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.preview_rows.map((row: any, i: number) => (
                      <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-2)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      >
                        {preview.columns.map((c: string) => (
                          <td key={c} className="px-4 py-2 font-mono whitespace-nowrap max-w-[120px] truncate"
                            style={{ color: row[c] == null ? "var(--text-3)" : "var(--text-2)" }}>
                            {row[c] != null ? String(row[c]) : "null"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Right: export panel ───────────────────────── */}
      <div className="space-y-4">
        {/* Export card */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="show"
          className="rounded-xl p-5 sticky top-4"
          style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }}
        >
          <p className="text-[13px] font-medium mb-4" style={{ color: "var(--text-1)" }}>
            Export cleaned data
          </p>

          {/* Dataset name */}
          <div className="mb-4">
            <label className="block text-[12px] mb-1.5" style={{ color: "var(--text-2)" }}>
              Output name
            </label>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-[12px] outline-none"
              style={{
                background: "var(--bg-2)",
                border: "1px solid var(--border)",
                color: "var(--text-1)",
              }}
              onFocus={e => (e.target.style.borderColor = "var(--orange)")}
              onBlur={e => (e.target.style.borderColor = "var(--border)")}
            />
          </div>

          {/* Pipeline summary */}
          <div
            className="rounded-lg p-3 mb-4"
            style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center justify-between text-[12px]">
              <span style={{ color: "var(--text-3)" }}>Operations</span>
              <span style={{ color: "var(--text-1)", fontWeight: 500 }}>{ops.length}</span>
            </div>
            {preview && (
              <>
                <div className="flex items-center justify-between text-[12px] mt-1.5">
                  <span style={{ color: "var(--text-3)" }}>Output rows</span>
                  <span style={{ color: "#4ade80", fontWeight: 500 }}>{preview.cleaned_shape[0].toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-[12px] mt-1">
                  <span style={{ color: "var(--text-3)" }}>Output cols</span>
                  <span style={{ color: "#4ade80", fontWeight: 500 }}>{preview.cleaned_shape[1]}</span>
                </div>
                <div className="flex items-center justify-between text-[12px] mt-1">
                  <span style={{ color: "var(--text-3)" }}>Missing cells</span>
                  <span style={{ color: preview.missing_after === 0 ? "#4ade80" : "#facc15", fontWeight: 500 }}>
                    {preview.missing_after}
                  </span>
                </div>
              </>
            )}
          </div>

          {ops.length === 0 ? (
            <p className="text-[12px] text-center py-2" style={{ color: "var(--text-3)" }}>
              Add operations to enable export
            </p>
          ) : (
            <div className="space-y-2">
              {/* Download directly */}
              <button
                onClick={() => downloadMutation.mutate()}
                disabled={downloadMutation.isPending}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-medium transition-all"
                style={{ background: "var(--orange)", color: "#000" }}
              >
                <IconDownload size={15} />
                {downloadMutation.isPending ? "Preparing..." : "Download CSV"}
              </button>

              {/* Save as new dataset */}
              <button
                onClick={() => applyMutation.mutate()}
                disabled={applyMutation.isPending}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-medium transition-all"
                style={{
                  background: "var(--bg-2)",
                  border: "1px solid var(--border)",
                  color: "var(--text-1)",
                }}
              >
                <IconDatabase size={14} />
                {applyMutation.isPending ? "Saving..." : "Save as new dataset"}
              </button>
            </div>
          )}
        </motion.div>

        {/* Original stats */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="show"
          className="rounded-xl p-5"
          style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }}
        >
          <p className="text-[12px] font-medium mb-3" style={{ color: "var(--text-2)" }}>
            Original dataset
          </p>
          {[
            { label: "Rows",    value: dataset?.row_count?.toLocaleString() || "—" },
            { label: "Columns", value: dataset?.column_count || "—" },
            { label: "Missing", value: dataset?.profile_summary
                ? Object.values(dataset.missing_values || {}).reduce((a: any, b: any) => a + b, 0)
                : "—" },
            { label: "Duplicates", value: dataset?.profile_summary?.duplicate_count ?? "—" },
          ].map(s => (
            <div
              key={s.label}
              className="flex items-center justify-between py-2"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <span className="text-[12px]" style={{ color: "var(--text-3)" }}>{s.label}</span>
              <span className="text-[12px] font-medium" style={{ color: "var(--text-1)" }}>{String(s.value)}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
