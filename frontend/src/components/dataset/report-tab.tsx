"use client"

import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import { reportApi } from "@/lib/api"
import { toast } from "sonner"
import { fadeUp } from "@/lib/motion"
import {
  IconFileText, IconDownload, IconBrain,
  IconSparkles, IconRefresh, IconCopy,
  IconCheck,
  IconLabelImportantFilled,
  IconChartBar,
  IconInfoHexagon,
  IconCircleDashedNumber0,
  IconMoodSpark,
  IconSettings,
  IconProgressBolt,
  IconArrowRight,
} from "@tabler/icons-react"

export default function ReportTab({ datasetId, dataset }: { datasetId: number; dataset: any }) {
  const [report, setReport]   = useState<string | null>(null)
  const [copied, setCopied]   = useState(false)

  const generateMutation = useMutation({
    mutationFn: () => reportApi.generate(datasetId),
    onSuccess:  r  => setReport(r.data.report),
    onError:    (e: any) => toast.error(e?.response?.data?.detail || "Report generation failed"),
  })

  const downloadMutation = useMutation({
    mutationFn: () => reportApi.download(datasetId),
    onSuccess:  r  => {
      const url = URL.createObjectURL(new Blob([r.data]))
      const a   = document.createElement("a")
      a.href    = url
      a.download = `${dataset.name}_report.md`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Report downloaded!")
    },
    onError: () => toast.error("Download failed"),
  })

  const copyReport = () => {
    if (!report) return
    navigator.clipboard.writeText(report)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success("Copied to clipboard!")
  }

  // Simple markdown renderer
  const renderMarkdown = (md: string) => {
    return md
      .split("\n")
      .map((line, i) => {
        if (line.startsWith("# "))  return <h1 key={i} className="text-[22px] font-bold mt-6 mb-3" style={{ color: "var(--text-1)" }}>{line.slice(2)}</h1>
        if (line.startsWith("## ")) return <h2 key={i} className="text-[17px] font-semibold mt-5 mb-2" style={{ color: "var(--text-1)" }}>{line.slice(3)}</h2>
        if (line.startsWith("### "))return <h3 key={i} className="text-[15px] font-semibold mt-4 mb-1.5" style={{ color: "var(--text-1)" }}>{line.slice(4)}</h3>
        if (line.startsWith("- ") || line.startsWith("* "))
          return <li key={i} className="ml-4 text-[13px] leading-relaxed" style={{ color: "var(--text-2)", listStyle: "disc" }}>{parseBold(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line))
          return <li key={i} className="ml-4 text-[13px] leading-relaxed" style={{ color: "var(--text-2)", listStyle: "decimal" }}>{parseBold(line.replace(/^\d+\.\s/, ""))}</li>
        if (line.startsWith("```") || line === "") return <br key={i} />
        if (line.startsWith("|"))
          return <p key={i} className="text-[12px] font-mono py-0.5" style={{ color: "var(--text-2)" }}>{line}</p>
        return <p key={i} className="text-[13px] leading-relaxed mb-1" style={{ color: "var(--text-2)" }}>{parseBold(line)}</p>
      })
  }

  const parseBold = (text: string) => {
    const parts = text.split(/\*\*(.*?)\*\*/)
    return parts.map((part, i) =>
      i % 2 === 1
        ? <strong key={i} style={{ color: "var(--text-1)", fontWeight: 600 }}>{part}</strong>
        : part
    )
  }

  return (
    <div className="space-y-4">
      {/* Header card */}
      <motion.div
        variants={fadeUp} initial="hidden" animate="show"
        className="rounded-xl p-6"
        style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--orange-dim)" }}>
                <IconFileText size={16} style={{ color: "var(--orange)" }} />
              </div>
              <h3 className="text-[15px] font-semibold" style={{ color: "var(--text-1)" }}>
                AI Analysis Report
              </h3>
            </div>
            <p className="text-[13px]" style={{ color: "var(--text-2)" }}>
              Generate a comprehensive markdown report with profiling stats, quality assessment,
              key insights, cleaning recommendations, feature ideas, and ML approach — all powered by AI.
            </p>
          </div>
        </div>

        {/* What's included */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          {[
            { label: "Executive summary",        icon: <IconCheck size={15} />, },
            { label: "Data quality score",       icon: <IconLabelImportantFilled size={15} />, },
            { label: "Column-by-column analysis",icon: <IconChartBar size={15} />, },
            { label: "Key insights",             icon: <IconInfoHexagon size={15} />, },
            { label: "Cleaning roadmap",         icon: <IconMoodSpark size={15} />, },
            { label: "Feature engineering",      icon: <IconSettings size={15} />, },
            { label: "ML recommendations",       icon: <IconProgressBolt size={15} />, },
            { label: "Next steps",               icon: <IconArrowRight size={15} />, },
          ].map(item => (
            <div key={item.label}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px]"
              style={{ background: "var(--bg-2)", color: "var(--text-2)" }}
            >
              <span>{item.icon}</span>
              {item.label}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 mt-5">
          <button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-medium transition-all"
            style={{
              background: generateMutation.isPending ? "rgba(249,115,22,0.4)" : "var(--orange)",
              color: "#000",
              cursor: generateMutation.isPending ? "not-allowed" : "pointer",
            }}
          >
            {generateMutation.isPending ? (
              <>
                <IconBrain size={15} className="animate-pulse" />
                Generating report...
              </>
            ) : (
              <>
                <IconSparkles size={15} />
                {report ? "Regenerate" : "Generate report"}
              </>
            )}
          </button>

          {report && (
            <>
              <button
                onClick={() => downloadMutation.mutate()}
                disabled={downloadMutation.isPending}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all"
                style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--text-1)" }}
              >
                <IconDownload size={14} />
                {downloadMutation.isPending ? "Downloading..." : "Download .md"}
              </button>
              <button
                onClick={copyReport}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] transition-all"
                style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--text-1)" }}
              >
                {copied ? <IconCheck size={14} style={{ color: "#4ade80" }} /> : <IconCopy size={14} />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </>
          )}
        </div>
      </motion.div>

      {/* Loading state */}
      {generateMutation.isPending && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl p-10 text-center"
          style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center animate-pulse"
              style={{ background: "var(--orange-dim)" }}>
              <IconBrain size={22} style={{ color: "var(--orange)" }} />
            </div>
            <div>
              <p className="text-[14px] font-medium mb-1" style={{ color: "var(--text-1)" }}>
                Generating your report...
              </p>
              <p className="text-[12px]" style={{ color: "var(--text-3)" }}>
                Analyzing {dataset.row_count?.toLocaleString()} rows × {dataset.column_count} columns
              </p>
            </div>
            {/* Progress dots */}
            <div className="flex gap-1.5">
              {[0, 1, 2, 3].map(i => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: "var(--orange)" }}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Report output */}
      <AnimatePresence>
        {report && !generateMutation.isPending && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl overflow-hidden"
            style={{ border: "1px solid var(--border)" }}
          >
            <div
              className="flex items-center justify-between px-5 py-3.5"
              style={{ background: "var(--bg-2)", borderBottom: "1px solid var(--border)" }}
            >
              <div className="flex items-center gap-2">
                <IconFileText size={14} style={{ color: "var(--orange)" }} />
                <p className="text-[13px] font-medium" style={{ color: "var(--text-1)" }}>
                  {dataset.name} — Analysis Report
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: "#4ade80" }} />
                <span className="text-[11px]" style={{ color: "var(--text-3)" }}>Generated</span>
              </div>
            </div>
            <div
              className="p-6 overflow-auto prose-custom"
              style={{ background: "var(--bg-1)", maxHeight: 700 }}
            >
              <div className="max-w-4xl">
                {renderMarkdown(report)}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
