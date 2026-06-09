"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import { mergeApi, datasetsApi } from "@/lib/api"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { fadeUp } from "@/lib/motion"
import { IconGitMerge, IconEye, IconDatabase, IconCheck } from "@tabler/icons-react"

const JOIN_TYPES = [
  { value: "inner", label: "Inner join",  desc: "Only matching rows from both datasets" },
  { value: "left",  label: "Left join",   desc: "All rows from left, matching from right" },
  { value: "right", label: "Right join",  desc: "All rows from right, matching from left" },
  { value: "outer", label: "Full outer",  desc: "All rows from both datasets" },
]

export default function MergeTab({ datasetId, dataset }: { datasetId: number; dataset: any }) {
  const router = useRouter()
  const qc     = useQueryClient()
  const [rightId,  setRightId]  = useState<number | null>(null)
  const [leftOn,   setLeftOn]   = useState<string>("")
  const [rightOn,  setRightOn]  = useState<string>("")
  const [how,      setHow]      = useState("inner")
  const [newName,  setNewName]  = useState(`${dataset?.name || "dataset"}_merged`)
  const [preview,  setPreview]  = useState<any>(null)

  const { data: datasets = [] } = useQuery({
    queryKey: ["datasets"],
    queryFn: () => datasetsApi.list().then(r => r.data),
  })

  const otherDatasets = datasets.filter((d: any) => d.id !== datasetId && d.status === "ready")

  const { data: suggestions } = useQuery({
    queryKey: ["merge-suggestions", datasetId, rightId],
    queryFn: () => mergeApi.suggestions(datasetId, rightId!).then(r => r.data),
    enabled: !!rightId,
  })

  const previewMutation = useMutation({
    mutationFn: () => mergeApi.preview(datasetId, {
      right_dataset_id: rightId,
      left_on: [leftOn],
      right_on: [rightOn],
      how,
    }),
    onSuccess: r => setPreview(r.data),
    onError:   (e: any) => toast.error(e?.response?.data?.detail || "Preview failed"),
  })

  const applyMutation = useMutation({
    mutationFn: () => mergeApi.apply(datasetId, {
      right_dataset_id: rightId,
      left_on: [leftOn],
      right_on: [rightOn],
      how,
      new_name: newName,
    }),
    onSuccess: r => {
      toast.success(`Merged dataset saved: ${r.data.name}`)
      qc.invalidateQueries({ queryKey: ["datasets"] })
      router.push(`/dashboard/datasets/${r.data.dataset_id}`)
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || "Merge failed"),
  })

  const leftCols  = dataset?.columns || []
  const rightCols = suggestions?.right_columns || []

  return (
    <div className="space-y-5">
      <motion.div variants={fadeUp} initial="hidden" animate="show"
        className="rounded-xl p-6"
        style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2 mb-5">
          <IconGitMerge size={16} style={{ color: "var(--orange)" }} />
          <p className="text-[14px] font-semibold" style={{ color: "var(--text-1)" }}>
            Merge datasets
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left dataset (current) */}
          <div className="rounded-xl p-4" style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
            <p className="text-[11px] font-medium tracking-widest uppercase mb-2" style={{ color: "var(--text-3)" }}>
              Left dataset (current)
            </p>
            <p className="text-[14px] font-medium mb-1" style={{ color: "var(--text-1)" }}>{dataset.name}</p>
            <p className="text-[12px] mb-3" style={{ color: "var(--text-3)" }}>
              {dataset.row_count?.toLocaleString()} rows · {dataset.column_count} cols
            </p>
            <label className="block text-[12px] mb-1.5" style={{ color: "var(--text-2)" }}>Join on column</label>
            <select value={leftOn} onChange={e => setLeftOn(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-[12px] outline-none"
              style={{ background: "var(--bg-1)", border: "1px solid var(--border)", color: "var(--text-1)" }}>
              <option value="">Select column...</option>
              {leftCols.map((c: string) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Right dataset */}
          <div className="rounded-xl p-4" style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
            <p className="text-[11px] font-medium tracking-widest uppercase mb-2" style={{ color: "var(--text-3)" }}>
              Right dataset
            </p>
            <select value={rightId || ""} onChange={e => { setRightId(Number(e.target.value)); setRightOn("") }}
              className="w-full px-3 py-2 rounded-lg text-[12px] outline-none mb-3"
              style={{ background: "var(--bg-1)", border: "1px solid var(--border)", color: "var(--text-1)" }}>
              <option value="">Select dataset...</option>
              {otherDatasets.map((d: any) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.row_count?.toLocaleString()} rows)
                </option>
              ))}
            </select>
            {rightId && (
              <>
                <label className="block text-[12px] mb-1.5" style={{ color: "var(--text-2)" }}>Join on column</label>
                <select value={rightOn} onChange={e => setRightOn(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-[12px] outline-none"
                  style={{ background: "var(--bg-1)", border: "1px solid var(--border)", color: "var(--text-1)" }}>
                  <option value="">Select column...</option>
                  {rightCols.map((c: string) => <option key={c} value={c}>{c}</option>)}
                </select>
              </>
            )}
          </div>
        </div>

        {/* Suggestions */}
        {suggestions?.suggestions?.length > 0 && (
          <div className="mt-4">
            <p className="text-[12px] mb-2" style={{ color: "var(--text-3)" }}>Suggested join keys:</p>
            <div className="flex gap-2 flex-wrap">
              {suggestions.suggestions.map((s: any, i: number) => (
                <button key={i}
                  onClick={() => { setLeftOn(s.left_on); setRightOn(s.right_on) }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] transition-all"
                  style={{
                    background: leftOn === s.left_on && rightOn === s.right_on ? "var(--orange-dim)" : "var(--bg-2)",
                    border: leftOn === s.left_on && rightOn === s.right_on ? "1px solid var(--orange-border)" : "1px solid var(--border)",
                    color: leftOn === s.left_on && rightOn === s.right_on ? "var(--orange)" : "var(--text-2)",
                  }}
                >
                  {leftOn === s.left_on && rightOn === s.right_on && <IconCheck size={11} />}
                  <span className="font-mono">{s.left_on}</span>
                  <span style={{ color: "var(--text-3)" }}>↔</span>
                  <span className="font-mono">{s.right_on}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Join type */}
        <div className="mt-5">
          <p className="text-[12px] mb-2" style={{ color: "var(--text-2)" }}>Join type</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {JOIN_TYPES.map(jt => (
              <button key={jt.value}
                onClick={() => setHow(jt.value)}
                className="p-3 rounded-xl text-left transition-all"
                style={{
                  background: how === jt.value ? "var(--orange-dim)" : "var(--bg-2)",
                  border: how === jt.value ? "1px solid var(--orange-border)" : "1px solid var(--border)",
                }}
              >
                <p className="text-[13px] font-medium mb-0.5"
                  style={{ color: how === jt.value ? "var(--orange)" : "var(--text-1)" }}>
                  {jt.label}
                </p>
                <p className="text-[11px]" style={{ color: "var(--text-3)" }}>{jt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Output name + actions */}
        <div className="mt-5 flex items-center gap-3">
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Output dataset name..."
            className="flex-1 px-3 py-2 rounded-lg text-[12px] outline-none"
            style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--text-1)" }}
            onFocus={e => (e.target.style.borderColor = "var(--orange)")}
            onBlur={e => (e.target.style.borderColor = "var(--border)")}
          />
          <button
            onClick={() => previewMutation.mutate()}
            disabled={!rightId || !leftOn || !rightOn || previewMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-medium"
            style={{
              background: "var(--bg-2)",
              border: "1px solid var(--border)",
              color: "var(--text-1)",
              opacity: (!rightId || !leftOn || !rightOn) ? 0.4 : 1,
            }}
          >
            <IconEye size={13} />
            {previewMutation.isPending ? "Previewing..." : "Preview"}
          </button>
          <button
            onClick={() => applyMutation.mutate()}
            disabled={!rightId || !leftOn || !rightOn || applyMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-medium"
            style={{
              background: (!rightId || !leftOn || !rightOn) ? "rgba(249,115,22,0.3)" : "var(--orange)",
              color: "#000",
              cursor: (!rightId || !leftOn || !rightOn) ? "not-allowed" : "pointer",
            }}
          >
            <IconDatabase size={13} />
            {applyMutation.isPending ? "Merging..." : "Merge & save"}
          </button>
        </div>
      </motion.div>

      {/* Preview */}
      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl overflow-hidden"
            style={{ border: "1px solid var(--border)" }}
          >
            <div className="px-5 py-3.5 flex items-center gap-4"
              style={{ background: "var(--bg-2)", borderBottom: "1px solid var(--border)" }}
            >
              {[
                { label: "Left rows",   value: preview.stats?.left_rows?.toLocaleString() },
                { label: "Right rows",  value: preview.stats?.right_rows?.toLocaleString() },
                { label: "Merged rows", value: preview.stats?.merged_rows?.toLocaleString(), color: "#4ade80" },
                { label: "Columns",     value: preview.stats?.merged_cols },
                { label: "Match rate",  value: `${preview.stats?.matched_pct}%`,
                  color: preview.stats?.matched_pct > 70 ? "#4ade80" : "#facc15" },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <p className="text-[16px] font-semibold" style={{ color: s.color || "var(--text-1)" }}>{s.value}</p>
                  <p className="text-[10px]" style={{ color: "var(--text-3)" }}>{s.label}</p>
                </div>
              ))}
            </div>
            <div style={{ overflowX: "auto", background: "var(--bg-1)" }}>
              <table className="w-full text-[11px]" style={{ minWidth: 400 }}>
                <thead>
                  <tr style={{ background: "var(--bg-2)", borderBottom: "1px solid var(--border)" }}>
                    {preview.stats?.new_columns?.map((c: string) => (
                      <th key={c} className="px-4 py-2 text-left font-medium whitespace-nowrap" style={{ color: "var(--text-3)" }}>
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.preview_rows?.map((row: any, i: number) => (
                    <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                      {preview.stats?.new_columns?.map((c: string) => (
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
  )
}
