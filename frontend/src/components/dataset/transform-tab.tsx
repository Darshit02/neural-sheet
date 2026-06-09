"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import { transformApi, templatesApi } from "@/lib/api"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { fadeUp } from "@/lib/motion"
import {
  IconPlus, IconX, IconEye, IconDownload,
  IconDatabase, IconCheck, IconBookmark,
  IconBookmarkFilled, IconTemplate,
} from "@tabler/icons-react"

const TRANSFORM_TYPES = [
  { group: "String",
    ops: [
      { type: "regex_replace",  label: "Regex replace",       needs: ["column","pattern","replacement"] },
      { type: "extract_regex",  label: "Extract with regex",  needs: ["column","pattern","new_column"] },
      { type: "split_column",   label: "Split column",        needs: ["column","separator","new_column"] },
      { type: "concat_columns", label: "Concat columns",      needs: ["columns","separator","new_column"] },
    ],
  },
  { group: "Value Mapping",
    ops: [
      { type: "map_values",     label: "Map values",          needs: ["column","mapping"] },
    ],
  },
  { group: "Numeric Binning",
    ops: [
      { type: "bin_equal_width",label: "Equal-width bins",    needs: ["column","bins","new_column"] },
      { type: "bin_equal_freq", label: "Equal-frequency bins",needs: ["column","bins","new_column"] },
      { type: "bin_custom",     label: "Custom bin edges",    needs: ["column","edges","new_column"] },
    ],
  },
  { group: "Math",
    ops: [
      { type: "math_operation",  label: "Math expression",    needs: ["column","expression","new_column"] },
      { type: "multiply_columns",label: "Multiply columns",   needs: ["column","column2","new_column"] },
      { type: "ratio_columns",   label: "Column ratio",       needs: ["column","column2","new_column"] },
    ],
  },
  { group: "Datetime",
    ops: [
      { type: "extract_datetime",label: "Extract date parts", needs: ["column","parts"] },
    ],
  },
]

interface Transform {
  id: string
  type: string
  label: string
  params: Record<string, any>
}

export default function TransformTab({ datasetId, dataset }: { datasetId: number; dataset: any }) {
  const router   = useRouter()
  const qc       = useQueryClient()
  const [transforms, setTransforms] = useState<Transform[]>([])
  const [preview,    setPreview]    = useState<any>(null)
  const [newName,    setNewName]    = useState(`${dataset?.name || "dataset"}_transformed`)
  const [showAdd,    setShowAdd]    = useState(false)
  const [selGroup,   setSelGroup]   = useState<string | null>(null)
  const [selType,    setSelType]    = useState<string | null>(null)
  const [params,     setParams]     = useState<Record<string, any>>({})
  const [saveTemplateName, setSaveTemplateName] = useState("")
  const [showSaveTemplate, setShowSaveTemplate] = useState(false)

  const columns = dataset?.columns || []
  const numericCols = dataset?.profile_summary?.column_info
    ?.filter((c: any) => c.is_numeric)?.map((c: any) => c.name) || []

  const { data: templates = [] } = useQuery({
    queryKey: ["pipeline-templates"],
    queryFn: () => templatesApi.list().then(r => r.data),
  })

  const previewMutation = useMutation({
    mutationFn: () => transformApi.preview(datasetId,
      transforms.map(t => ({ type: t.type, ...t.params }))
    ),
    onSuccess: r => setPreview(r.data),
    onError:   (e: any) => toast.error(e?.response?.data?.detail || "Preview failed"),
  })

  const applyMutation = useMutation({
    mutationFn: () => transformApi.apply(datasetId,
      transforms.map(t => ({ type: t.type, ...t.params })),
      newName,
    ),
    onSuccess: r => {
      toast.success(r.data.name + " saved!")
      qc.invalidateQueries({ queryKey: ["datasets"] })
      router.push(`/dashboard/datasets/${r.data.dataset_id}`)
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || "Apply failed"),
  })

  const downloadMutation = useMutation({
    mutationFn: () => transformApi.download(datasetId,
      transforms.map(t => ({ type: t.type, ...t.params }))
    ),
    onSuccess: r => {
      const url = URL.createObjectURL(new Blob([r.data]))
      const a   = document.createElement("a")
      a.href    = url
      a.download = `${newName}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Download started!")
    },
    onError: () => toast.error("Download failed"),
  })

  const saveTemplateMutation = useMutation({
    mutationFn: () => templatesApi.create({
      name: saveTemplateName,
      operations: transforms.map(t => ({ type: t.type, ...t.params })),
      description: `${transforms.length} transform operations`,
    }),
    onSuccess: () => {
      toast.success("Template saved!")
      setShowSaveTemplate(false)
      setSaveTemplateName("")
      qc.invalidateQueries({ queryKey: ["pipeline-templates"] })
    },
    onError: () => toast.error("Failed to save template"),
  })

  const loadTemplate = (template: any) => {
    const loaded = template.operations.map((op: any, i: number) => ({
      id: `loaded-${i}-${Date.now()}`,
      type: op.type,
      label: op.type.replace(/_/g, " "),
      params: { ...op, type: undefined },
    }))
    setTransforms(loaded)
    toast.success(`Loaded "${template.name}"`)
  }

  const addTransform = () => {
    if (!selType) return
    const opMeta = TRANSFORM_TYPES.flatMap(g => g.ops).find(o => o.type === selType)
    const id = `${selType}-${Date.now()}`
    setTransforms(prev => [...prev, {
      id,
      type: selType,
      label: opMeta?.label || selType,
      params: { ...params, column: params.column || undefined },
    }])
    setSelType(null)
    setParams({})
    setShowAdd(false)
    setSelGroup(null)
  }

  const removeTransform = (id: string) => setTransforms(prev => prev.filter(t => t.id !== id))

  const getParamFields = (opType: string) => {
    const opMeta = TRANSFORM_TYPES.flatMap(g => g.ops).find(o => o.type === opType)
    return opMeta?.needs || []
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Left — builder */}
      <div className="lg:col-span-2 space-y-4">

        {/* Templates */}
        {templates.length > 0 && (
          <motion.div variants={fadeUp} initial="hidden" animate="show"
            className="rounded-xl overflow-hidden"
            style={{ border: "1px solid var(--border)" }}
          >
            <div className="px-5 py-3.5 flex items-center gap-2" style={{ background: "var(--bg-1)", borderBottom: "1px solid var(--border)" }}>
              <IconTemplate size={14} style={{ color: "var(--orange)" }} />
              <p className="text-[13px] font-medium" style={{ color: "var(--text-1)" }}>Saved templates</p>
            </div>
            <div className="flex gap-2 p-4 flex-wrap" style={{ background: "var(--bg-1)" }}>
              {templates.map((t: any) => (
                <button
                  key={t.id}
                  onClick={() => loadTemplate(t)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] transition-all"
                  style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--text-2)" }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--orange)")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
                >
                  <IconTemplate size={12} style={{ color: "var(--orange)" }} />
                  {t.name}
                  <span className="text-[10px]" style={{ color: "var(--text-3)" }}>
                    {t.operations?.length} ops
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Pipeline */}
        <motion.div variants={fadeUp} initial="hidden" animate="show"
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between px-5 py-3.5"
            style={{ background: "var(--bg-1)", borderBottom: "1px solid var(--border)" }}
          >
            <div className="flex items-center gap-2">
              <p className="text-[13px] font-medium" style={{ color: "var(--text-1)" }}>Transform pipeline</p>
              {transforms.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                  style={{ background: "var(--orange)", color: "#000" }}>
                  {transforms.length}
                </span>
              )}
            </div>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium"
              style={{ background: "var(--bg-3)", color: "var(--text-2)", border: "1px solid var(--border)" }}
            >
              <IconPlus size={12} /> Add transform
            </button>
          </div>

          {transforms.length === 0 ? (
            <div className="py-10 text-center" style={{ background: "var(--bg-1)" }}>
              <p className="text-[13px]" style={{ color: "var(--text-3)" }}>
                No transforms yet — add one or load a template
              </p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--border)", background: "var(--bg-1)" }}>
              {transforms.map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 px-5 py-3"
                >
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                    style={{ background: "var(--orange)", color: "#000" }}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium" style={{ color: "var(--text-1)" }}>{t.label}</p>
                    <p className="text-[11px] font-mono truncate" style={{ color: "var(--text-3)" }}>
                      {Object.entries(t.params)
                        .filter(([, v]) => v != null && v !== "")
                        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(",") : v}`)
                        .join(" · ")}
                    </p>
                  </div>
                  <button onClick={() => removeTransform(t.id)}
                    className="w-6 h-6 rounded flex items-center justify-center" style={{ color: "#f87171" }}>
                    <IconX size={12} />
                  </button>
                </motion.div>
              ))}
            </div>
          )}

          {/* Add form */}
          <AnimatePresence>
            {showAdd && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ overflow: "hidden", borderTop: "1px solid var(--border)", background: "var(--bg-2)" }}
              >
                <div className="p-5 space-y-3">
                  <p className="text-[12px] font-medium" style={{ color: "var(--text-1)" }}>Add transformation</p>

                  {/* Group select */}
                  <div className="flex gap-2 flex-wrap">
                    {TRANSFORM_TYPES.map(g => (
                      <button key={g.group}
                        onClick={() => { setSelGroup(g.group); setSelType(null); setParams({}) }}
                        className="px-2.5 py-1 rounded-lg text-[11px] transition-all"
                        style={{
                          background: selGroup === g.group ? "var(--orange-dim)" : "var(--bg-3)",
                          color: selGroup === g.group ? "var(--orange)" : "var(--text-2)",
                          border: selGroup === g.group ? "1px solid var(--orange-border)" : "1px solid var(--border)",
                        }}
                      >
                        {g.group}
                      </button>
                    ))}
                  </div>

                  {/* Op select */}
                  {selGroup && (
                    <div className="grid grid-cols-2 gap-2">
                      {TRANSFORM_TYPES.find(g => g.group === selGroup)?.ops.map(op => (
                        <button key={op.type}
                          onClick={() => { setSelType(op.type); setParams({}) }}
                          className="px-3 py-2 rounded-lg text-[12px] text-left transition-all"
                          style={{
                            background: selType === op.type ? "var(--orange-dim)" : "var(--bg-1)",
                            color: selType === op.type ? "var(--orange)" : "var(--text-2)",
                            border: selType === op.type ? "1px solid var(--orange-border)" : "1px solid var(--border)",
                          }}
                        >
                          {op.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Param inputs */}
                  {selType && getParamFields(selType).map(field => (
                    <div key={field}>
                      <label className="block text-[11px] mb-1" style={{ color: "var(--text-2)" }}>{field}</label>
                      {field === "column" || field === "column2" ? (
                        <select
                          value={params[field] || ""}
                          onChange={e => setParams(p => ({ ...p, [field]: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg text-[12px] outline-none"
                          style={{ background: "var(--bg-1)", border: "1px solid var(--border)", color: "var(--text-1)" }}
                        >
                          <option value="">Select column...</option>
                          {columns.map((c: string) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      ) : field === "columns" ? (
                        <select multiple
                          value={params.columns || []}
                          onChange={e => setParams(p => ({ ...p, columns: Array.from(e.target.selectedOptions).map(o => o.value) }))}
                          className="w-full px-3 py-2 rounded-lg text-[12px] outline-none h-20"
                          style={{ background: "var(--bg-1)", border: "1px solid var(--border)", color: "var(--text-1)" }}
                        >
                          {columns.map((c: string) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      ) : field === "parts" ? (
                        <div className="flex gap-2 flex-wrap">
                          {["year","month","day","hour","minute","dayofweek","quarter"].map(p => (
                            <button key={p}
                              onClick={() => {
                                const curr = params.parts || []
                                setParams(prev => ({
                                  ...prev,
                                  parts: curr.includes(p) ? curr.filter((x: string) => x !== p) : [...curr, p]
                                }))
                              }}
                              className="px-2.5 py-1 rounded text-[11px]"
                              style={{
                                background: (params.parts || []).includes(p) ? "var(--orange)" : "var(--bg-3)",
                                color: (params.parts || []).includes(p) ? "#000" : "var(--text-2)",
                              }}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      ) : field === "mapping" ? (
                        <textarea
                          value={typeof params.mapping === "object" ? JSON.stringify(params.mapping, null, 2) : params.mapping || ""}
                          onChange={e => {
                            try { setParams(p => ({ ...p, mapping: JSON.parse(e.target.value) })) }
                            catch { setParams(p => ({ ...p, mapping: e.target.value })) }
                          }}
                          placeholder='{"old_value": "new_value"}'
                          rows={3}
                          className="w-full px-3 py-2 rounded-lg text-[11px] font-mono outline-none resize-none"
                          style={{ background: "var(--bg-1)", border: "1px solid var(--border)", color: "var(--text-1)" }}
                        />
                      ) : (
                        <input
                          value={params[field] || ""}
                          onChange={e => setParams(p => ({ ...p, [field]: e.target.value }))}
                          placeholder={field}
                          className="w-full px-3 py-2 rounded-lg text-[12px] outline-none"
                          style={{ background: "var(--bg-1)", border: "1px solid var(--border)", color: "var(--text-1)" }}
                        />
                      )}
                    </div>
                  ))}

                  <div className="flex gap-2">
                    <button onClick={addTransform} disabled={!selType}
                      className="px-4 py-2 rounded-lg text-[12px] font-medium"
                      style={{ background: selType ? "var(--orange)" : "rgba(249,115,22,0.3)", color: "#000" }}>
                      Add
                    </button>
                    <button onClick={() => { setShowAdd(false); setSelGroup(null); setSelType(null) }}
                      className="px-4 py-2 rounded-lg text-[12px]"
                      style={{ border: "1px solid var(--border)", color: "var(--text-2)" }}>
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Preview */}
        {transforms.length > 0 && (
          <button
            onClick={() => previewMutation.mutate()}
            disabled={previewMutation.isPending}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium"
            style={{ background: "var(--bg-1)", border: "1px solid var(--border)", color: "var(--text-1)" }}
          >
            <IconEye size={14} />
            {previewMutation.isPending ? "Previewing..." : "Preview result"}
          </button>
        )}

        {/* Preview table */}
        <AnimatePresence>
          {preview && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl overflow-hidden"
              style={{ border: "1px solid var(--border)" }}
            >
              <div className="px-5 py-3.5 flex items-center justify-between"
                style={{ background: "var(--bg-2)", borderBottom: "1px solid var(--border)" }}>
                <p className="text-[13px] font-medium" style={{ color: "var(--text-1)" }}>
                  Preview — {preview.shape[0].toLocaleString()} rows × {preview.shape[1]} cols
                </p>
                {preview.new_columns?.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px]" style={{ color: "var(--text-3)" }}>New columns:</span>
                    {preview.new_columns.map((c: string) => (
                      <span key={c} className="text-[11px] px-1.5 py-0.5 rounded font-mono"
                        style={{ background: "rgba(74,222,128,0.1)", color: "#4ade80" }}>
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Log */}
              <div className="px-5 py-3 space-y-1" style={{ background: "var(--bg-1)", borderBottom: "1px solid var(--border)" }}>
                {preview.operations_log.map((log: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-[12px]" style={{ color: "var(--text-2)" }}>
                    <IconCheck size={11} style={{ color: "#4ade80", flexShrink: 0 }} />
                    {log}
                  </div>
                ))}
              </div>

              {/* Table */}
              <div style={{ overflowX: "auto", background: "var(--bg-1)" }}>
                <table className="w-full text-[11px]" style={{ minWidth: 400 }}>
                  <thead>
                    <tr style={{ background: "var(--bg-2)", borderBottom: "1px solid var(--border)" }}>
                      {preview.columns.map((c: string) => (
                        <th key={c} className="px-4 py-2 text-left font-medium whitespace-nowrap"
                          style={{
                            color: preview.new_columns?.includes(c) ? "#4ade80" : "var(--text-3)",
                          }}>
                          {c} {preview.new_columns?.includes(c) && "✨"}
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

      {/* Right — export */}
      <div className="space-y-4">
        <motion.div variants={fadeUp} initial="hidden" animate="show"
          className="rounded-xl p-5 sticky top-4"
          style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }}
        >
          <p className="text-[13px] font-medium mb-4" style={{ color: "var(--text-1)" }}>Export</p>

          <div className="mb-4">
            <label className="block text-[12px] mb-1.5" style={{ color: "var(--text-2)" }}>Output name</label>
            <input value={newName} onChange={e => setNewName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-[12px] outline-none"
              style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--text-1)" }}
              onFocus={e => (e.target.style.borderColor = "var(--orange)")}
              onBlur={e => (e.target.style.borderColor = "var(--border)")}
            />
          </div>

          {transforms.length === 0 ? (
            <p className="text-[12px] text-center py-2" style={{ color: "var(--text-3)" }}>
              Add transforms to export
            </p>
          ) : (
            <div className="space-y-2">
              <button onClick={() => downloadMutation.mutate()} disabled={downloadMutation.isPending}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-medium"
                style={{ background: "var(--orange)", color: "#000" }}>
                <IconDownload size={14} />
                {downloadMutation.isPending ? "Preparing..." : "Download CSV"}
              </button>
              <button onClick={() => applyMutation.mutate()} disabled={applyMutation.isPending}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-medium"
                style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--text-1)" }}>
                <IconDatabase size={14} />
                {applyMutation.isPending ? "Saving..." : "Save as dataset"}
              </button>
              <button
                onClick={() => setShowSaveTemplate(!showSaveTemplate)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px]"
                style={{ border: "1px solid var(--border)", color: "var(--text-2)" }}>
                <IconBookmark size={14} />
                Save as template
              </button>
            </div>
          )}

          <AnimatePresence>
            {showSaveTemplate && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ overflow: "hidden" }}
              >
                <div className="mt-3 space-y-2">
                  <input
                    value={saveTemplateName}
                    onChange={e => setSaveTemplateName(e.target.value)}
                    placeholder="Template name..."
                    className="w-full px-3 py-2 rounded-lg text-[12px] outline-none"
                    style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--text-1)" }}
                  />
                  <button
                    onClick={() => saveTemplateMutation.mutate()}
                    disabled={!saveTemplateName.trim() || saveTemplateMutation.isPending}
                    className="w-full py-2 rounded-lg text-[12px] font-medium"
                    style={{ background: saveTemplateName.trim() ? "var(--orange)" : "rgba(249,115,22,0.3)", color: "#000" }}>
                    {saveTemplateMutation.isPending ? "Saving..." : "Save template"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
