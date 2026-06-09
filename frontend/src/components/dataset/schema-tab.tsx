"use client"

import { useState } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import { schemaApi } from "@/lib/api"
import { toast } from "sonner"
import { fadeUp } from "@/lib/motion"
import {
  IconShieldCheck, IconPlus, IconX,
  IconCircleCheck, IconAlertCircle,
  IconAlertTriangle, IconDownload,
  IconCheckbox,
} from "@tabler/icons-react"

const RULE_TYPES = [
  { type: "not_null",       label: "Not null",          needs: [] },
  { type: "unique",         label: "Unique values",     needs: [] },
  { type: "dtype",          label: "Data type",         needs: ["expected_dtype"] },
  { type: "min_value",      label: "Minimum value",     needs: ["value"] },
  { type: "max_value",      label: "Maximum value",     needs: ["value"] },
  { type: "allowed_values", label: "Allowed values",    needs: ["values"] },
  { type: "regex",          label: "Regex pattern",     needs: ["pattern"] },
  { type: "string_length",  label: "String length",     needs: ["min_length","max_length"] },
  { type: "no_outliers_iqr",label: "No outliers (IQR)", needs: [] },
]

const DTYPES = ["int","float","string","bool","datetime"]

const statusIcon = {
  pass: <IconCircleCheck size={14} style={{ color: "#4ade80" }} />,
  fail: <IconAlertCircle size={14} style={{ color: "#f87171" }} />,
  warn: <IconAlertTriangle size={14} style={{ color: "#facc15" }} />,
  error: <IconAlertCircle size={14} style={{ color: "#f87171" }} />,
}

const statusColor = {
  pass: "#4ade80", fail: "#f87171", warn: "#facc15", error: "#f87171",
}

interface Rule {
  id: string
  column: string
  type: string
  params: Record<string, any>
  label: string
}

export default function SchemaTab({ datasetId, dataset }: { datasetId: number; dataset: any }) {
  const [rules,       setRules]       = useState<Rule[]>([])
  const [result,      setResult]      = useState<any>(null)
  const [showAdd,     setShowAdd]     = useState(false)
  const [addCol,      setAddCol]      = useState("")
  const [addType,     setAddType]     = useState("")
  const [addParams,   setAddParams]   = useState<Record<string,any>>({})
  const [schemaName,  setSchemaName]  = useState(`${dataset?.name || "dataset"} schema`)

  const columns = dataset?.columns || []
  const numericCols = dataset?.profile_summary?.column_info
    ?.filter((c: any) => c.is_numeric)?.map((c: any) => c.name) || []

  const { data: savedSchemas = [] } = useQuery({
    queryKey: ["saved-schemas"],
    queryFn: () => schemaApi.listSaved().then(r => r.data),
  })

  const validateMutation = useMutation({
    mutationFn: () => schemaApi.validate(datasetId,
      rules.map(r => ({ column: r.column, type: r.type, ...r.params }))
    ),
    onSuccess: r => setResult(r.data),
    onError:   (e: any) => toast.error(e?.response?.data?.detail || "Validation failed"),
  })

  const saveMutation = useMutation({
    mutationFn: () => schemaApi.save(datasetId,
      rules.map(r => ({ column: r.column, type: r.type, ...r.params })),
      schemaName,
    ),
    onSuccess: () => toast.success("Schema saved!"),
    onError:   () => toast.error("Failed to save schema"),
  })

  const loadSchema = (schema: any) => {
    const loaded = schema.rules.map((r: any, i: number) => ({
      id: `loaded-${i}`,
      column: r.column,
      type: r.type,
      params: { ...r, column: undefined, type: undefined },
      label: `${r.type} on ${r.column}`,
    }))
    setRules(loaded)
    toast.success(`Loaded "${schema.name}"`)
  }

  const addRule = () => {
    if (!addCol || !addType) return
    const meta  = RULE_TYPES.find(r => r.type === addType)
    const id    = `${addType}-${addCol}-${Date.now()}`
    setRules(prev => [...prev, {
      id, column: addCol, type: addType,
      params: { ...addParams },
      label: `${meta?.label || addType} — ${addCol}`,
    }])
    setAddCol("")
    setAddType("")
    setAddParams({})
    setShowAdd(false)
  }

  const removeRule = (id: string) => setRules(prev => prev.filter(r => r.id !== id))

  const score     = result?.score || 0
  const scoreColor = score >= 80 ? "#4ade80" : score >= 60 ? "#facc15" : "#f87171"

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Left */}
      <div className="lg:col-span-2 space-y-4">

        {/* Saved schemas */}
        {savedSchemas.length > 0 && (
          <motion.div variants={fadeUp} initial="hidden" animate="show"
            className="rounded-xl p-4"
            style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }}
          >
            <p className="text-[12px] font-medium mb-2" style={{ color: "var(--text-2)" }}>Saved schemas</p>
            <div className="flex gap-2 flex-wrap">
              {savedSchemas.map((s: any) => (
                <button key={s.id} onClick={() => loadSchema(s)}
                  className="px-3 py-1.5 rounded-lg text-[12px] transition-all"
                  style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--text-2)" }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--orange)")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
                >
                  {s.name} · {s.rules?.length} rules
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Rules builder */}
        <motion.div variants={fadeUp} initial="hidden" animate="show"
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between px-5 py-3.5"
            style={{ background: "var(--bg-1)", borderBottom: "1px solid var(--border)" }}
          >
            <div className="flex items-center gap-2">
              <IconShieldCheck size={15} style={{ color: "var(--orange)" }} />
              <p className="text-[13px] font-medium" style={{ color: "var(--text-1)" }}>Schema rules</p>
              {rules.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                  style={{ background: "var(--orange)", color: "#000" }}>
                  {rules.length}
                </span>
              )}
            </div>
            <button onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium"
              style={{ background: "var(--bg-3)", color: "var(--text-2)", border: "1px solid var(--border)" }}>
              <IconPlus size={12} /> Add rule
            </button>
          </div>

          {rules.length === 0 ? (
            <div className="py-10 text-center" style={{ background: "var(--bg-1)" }}>
              <p className="text-[13px]" style={{ color: "var(--text-3)" }}>
                No rules yet — define data quality rules to validate your dataset
              </p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--border)", background: "var(--bg-1)" }}>
              {rules.map((rule, i) => {
                const resultItem = result?.results?.find((r: any) => r.column === rule.column && r.rule.includes(rule.type.replace("_", " ")))
                return (
                  <div key={rule.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                      style={{ background: "var(--bg-3)", color: "var(--text-2)" }}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {resultItem && (statusIcon[resultItem.status as keyof typeof statusIcon] || statusIcon.error)}
                        <p className="text-[13px] font-medium" style={{ color: "var(--text-1)" }}>
                          {rule.label}
                        </p>
                      </div>
                      {resultItem && (
                        <p className="text-[11px] mt-0.5"
                          style={{ color: statusColor[resultItem.status as keyof typeof statusColor] || "var(--text-3)" }}>
                          {resultItem.message}
                          {resultItem.violation_count > 0 && ` — ${resultItem.violation_count.toLocaleString()} violations`}
                        </p>
                      )}
                    </div>
                    <button onClick={() => removeRule(rule.id)}
                      className="w-6 h-6 rounded flex items-center justify-center shrink-0" style={{ color: "#f87171" }}>
                      <IconX size={12} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* Add rule form */}
          <AnimatePresence>
            {showAdd && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ overflow: "hidden", borderTop: "1px solid var(--border)", background: "var(--bg-2)" }}
              >
                <div className="p-5 space-y-3">
                  <p className="text-[12px] font-medium" style={{ color: "var(--text-1)" }}>Add rule</p>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] mb-1" style={{ color: "var(--text-2)" }}>Column</label>
                      <select value={addCol} onChange={e => setAddCol(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-[12px] outline-none"
                        style={{ background: "var(--bg-1)", border: "1px solid var(--border)", color: "var(--text-1)" }}>
                        <option value="">Select column...</option>
                        {columns.map((c: string) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] mb-1" style={{ color: "var(--text-2)" }}>Rule type</label>
                      <select value={addType} onChange={e => { setAddType(e.target.value); setAddParams({}) }}
                        className="w-full px-3 py-2 rounded-lg text-[12px] outline-none"
                        style={{ background: "var(--bg-1)", border: "1px solid var(--border)", color: "var(--text-1)" }}>
                        <option value="">Select rule...</option>
                        {RULE_TYPES.map(r => <option key={r.type} value={r.type}>{r.label}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Extra params */}
                  {addType && (() => {
                    const meta = RULE_TYPES.find(r => r.type === addType)
                    return meta?.needs.map(field => (
                      <div key={field}>
                        <label className="block text-[11px] mb-1" style={{ color: "var(--text-2)" }}>{field}</label>
                        {field === "expected_dtype" ? (
                          <select value={addParams[field] || ""} onChange={e => setAddParams(p => ({ ...p, [field]: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg text-[12px] outline-none"
                            style={{ background: "var(--bg-1)", border: "1px solid var(--border)", color: "var(--text-1)" }}>
                            <option value="">Select type...</option>
                            {DTYPES.map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                        ) : field === "values" ? (
                          <input
                            value={addParams[field] || ""}
                            onChange={e => setAddParams(p => ({
                              ...p,
                              values: e.target.value.split(",").map(v => v.trim())
                            }))}
                            placeholder="value1, value2, value3"
                            className="w-full px-3 py-2 rounded-lg text-[12px] outline-none"
                            style={{ background: "var(--bg-1)", border: "1px solid var(--border)", color: "var(--text-1)" }}
                          />
                        ) : (
                          <input
                            type={["value","min_length","max_length"].includes(field) ? "number" : "text"}
                            value={addParams[field] || ""}
                            onChange={e => setAddParams(p => ({ ...p, [field]: e.target.value }))}
                            placeholder={field}
                            className="w-full px-3 py-2 rounded-lg text-[12px] outline-none"
                            style={{ background: "var(--bg-1)", border: "1px solid var(--border)", color: "var(--text-1)" }}
                          />
                        )}
                      </div>
                    ))
                  })()}

                  <div className="flex gap-2">
                    <button onClick={addRule} disabled={!addCol || !addType}
                      className="px-4 py-2 rounded-lg text-[12px] font-medium"
                      style={{ background: addCol && addType ? "var(--orange)" : "rgba(249,115,22,0.3)", color: "#000" }}>
                      Add rule
                    </button>
                    <button onClick={() => setShowAdd(false)}
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

        {/* Validate button */}
        {rules.length > 0 && (
          <button onClick={() => validateMutation.mutate()} disabled={validateMutation.isPending}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-medium"
            style={{ background: validateMutation.isPending ? "rgba(249,115,22,0.4)" : "var(--orange)", color: "#000" }}>
            <IconShieldCheck size={15} />
            {validateMutation.isPending ? "Validating..." : "Run validation"}
          </button>
        )}

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl overflow-hidden"
              style={{ border: `1px solid ${result.overall_status === "pass" ? "#4ade8030" : "#f8717130"}` }}
            >
              <div className="flex items-center justify-between px-5 py-4"
                style={{
                  background: result.overall_status === "pass" ? "rgba(74,222,128,0.05)" : "rgba(248,113,113,0.05)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <div className="flex items-center gap-3">
                  {result.overall_status === "pass"
                    ? <IconCircleCheck size={20} style={{ color: "#4ade80" }} />
                    : <IconAlertCircle size={20} style={{ color: "#f87171" }} />
                  }
                  <div>
                    <p className="text-[14px] font-semibold"
                      style={{ color: result.overall_status === "pass" ? "#4ade80" : "#f87171" }}>
                      {result.overall_status === "pass" ? "All rules passed!" : `${result.failed} rule${result.failed !== 1 ? "s" : ""} failed`}
                    </p>
                    <p className="text-[12px]" style={{ color: "var(--text-3)" }}>
                      {result.passed}/{result.total_rules} passed · {result.total_violations.toLocaleString()} total violations
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[28px] font-bold" style={{ color: scoreColor }}>{result.score}%</p>
                  <p className="text-[11px]" style={{ color: "var(--text-3)" }}>quality score</p>
                </div>
              </div>

              <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                {result.results.map((r: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 px-5 py-3.5"
                    style={{ background: "var(--bg-1)" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-2)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "var(--bg-1)")}
                  >
                    <div className="mt-0.5 shrink-0">
                      {statusIcon[r.status as keyof typeof statusIcon] || statusIcon.error}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono text-[12px] px-1.5 py-0.5 rounded"
                          style={{ background: "var(--bg-3)", color: "var(--orange)" }}>
                          {r.column}
                        </span>
                        <span className="text-[12px]" style={{ color: "var(--text-2)" }}>{r.rule}</span>
                      </div>
                      <p className="text-[12px]"
                        style={{ color: statusColor[r.status as keyof typeof statusColor] || "var(--text-3)" }}>
                        {r.message}
                      </p>
                      {r.sample_values && r.sample_values.length > 0 && (
                        <p className="text-[11px] mt-1 font-mono" style={{ color: "var(--text-3)" }}>
                          Samples: {r.sample_values.slice(0, 3).join(", ")}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[13px] font-semibold"
                        style={{ color: r.violation_count > 0 ? "#f87171" : "#4ade80" }}>
                        {r.violation_count > 0 ? `${r.violation_count.toLocaleString()} violations` : "✓ Clean"}
                      </p>
                      {r.violation_pct > 0 && (
                        <p className="text-[11px]" style={{ color: "var(--text-3)" }}>
                          {r.violation_pct}% of rows
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right — save schema */}
      <div className="space-y-4">
        <motion.div variants={fadeUp} initial="hidden" animate="show"
          className="rounded-xl p-5 sticky top-4"
          style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }}
        >
          <p className="text-[13px] font-medium mb-4" style={{ color: "var(--text-1)" }}>Save schema</p>
          <p className="text-[12px] mb-3" style={{ color: "var(--text-2)" }}>
            Save these rules as a reusable schema to validate other datasets.
          </p>
          <input
            value={schemaName}
            onChange={e => setSchemaName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-[12px] outline-none mb-3"
            style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--text-1)" }}
            onFocus={e => (e.target.style.borderColor = "var(--orange)")}
            onBlur={e => (e.target.style.borderColor = "var(--border)")}
          />
          <button
            onClick={() => saveMutation.mutate()}
            disabled={rules.length === 0 || saveMutation.isPending}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-medium"
            style={{
              background: rules.length === 0 ? "rgba(249,115,22,0.3)" : "var(--orange)",
              color: "#000",
            }}
          >
            <IconCheckbox size={14} />
            {saveMutation.isPending ? "Saving..." : "Save schema"}
          </button>

          {/* Rule count summary */}
          {rules.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-[11px] font-medium tracking-widest uppercase" style={{ color: "var(--text-3)" }}>
                Rules defined
              </p>
              {rules.map((r, i) => (
                <div key={r.id} className="flex items-center gap-2 text-[12px]" style={{ color: "var(--text-2)" }}>
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--orange)" }} />
                  <span className="font-mono">{r.column}</span>
                  <span style={{ color: "var(--text-3)" }}>→</span>
                  {r.label.split("—")[0].trim()}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
