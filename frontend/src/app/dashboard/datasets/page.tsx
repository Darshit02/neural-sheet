"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { datasetsApi, projectsApi } from "@/lib/api"
import { fadeUp, stagger } from "@/lib/motion"
import { formatBytes, formatDate } from "@/lib/utils"
import Link from "next/link"
import { toast } from "sonner"
import {
  IconFileTypeCsv, IconUpload, IconTrash,
  IconSearch, IconFilter, IconArrowRight,
  IconCircleCheck, IconClock, IconAlertCircle,
  IconDatabase, IconFolder, IconDots,
} from "@tabler/icons-react"

const statusConfig = {
  ready:      { icon: IconCircleCheck, color: "#4ade80", label: "Ready" },
  processing: { icon: IconClock,        color: "#facc15", label: "Processing" },
  failed:     { icon: IconAlertCircle,  color: "#f87171", label: "Failed" },
  pending:    { icon: IconClock,        color: "var(--text-3)", label: "Pending" },
}

export default function DatasetsPage() {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [search, setSearch] = useState("")
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [menuOpen, setMenuOpen] = useState<number | null>(null)

  const { data: datasets = [], isLoading } = useQuery({
    queryKey: ["datasets"],
    queryFn: () => datasetsApi.list().then(r => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => datasetsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["datasets"] })
      toast.success("Dataset deleted")
    },
  })

  const uploadFile = async (file: File) => {
    if (!file.name.endsWith(".csv")) {
      toast.error("Only CSV files are supported")
      return
    }
    setUploading(true)
    const fd = new FormData()
    fd.append("file", file)
    fd.append("name", file.name.replace(".csv", ""))
    try {
      await datasetsApi.upload(fd)
      qc.invalidateQueries({ queryKey: ["datasets"] })
      toast.success(`${file.name} uploaded successfully`)
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }

  const filtered = datasets.filter((d: any) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        variants={fadeUp} initial="hidden" animate="show"
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-[20px] font-semibold tracking-tight mb-1" style={{ color: "var(--text-1)" }}>
            Datasets
          </h2>
          <p className="text-[13px]" style={{ color: "var(--text-2)" }}>
            {datasets.length} dataset{datasets.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all"
          style={{
            background: uploading ? "rgba(249,115,22,0.5)" : "var(--orange)",
            color: "#000",
            cursor: uploading ? "not-allowed" : "pointer",
          }}
        >
          <IconUpload size={14} />
          {uploading ? "Uploading..." : "Upload CSV"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0])}
        />
      </motion.div>

      {/* Drop zone */}
      <motion.div
        variants={fadeUp} initial="hidden" animate="show"
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        className="rounded-xl p-8 text-center cursor-pointer transition-all"
        style={{
          border: `2px dashed ${dragging ? "var(--orange)" : "var(--border)"}`,
          background: dragging ? "var(--orange-dim)" : "var(--bg-1)",
        }}
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
          style={{ background: "var(--bg-2)" }}
        >
          <IconUpload size={20} style={{ color: dragging ? "var(--orange)" : "var(--text-3)" }} />
        </div>
        <p className="text-[14px] font-medium mb-1" style={{ color: "var(--text-1)" }}>
          {dragging ? "Drop to upload" : "Drag & drop your CSV here"}
        </p>
        <p className="text-[12px]" style={{ color: "var(--text-3)" }}>
          or click to browse · CSV files up to 50MB
        </p>
      </motion.div>

      {/* Search */}
      {datasets.length > 0 && (
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="relative">
          <IconSearch
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--text-3)" }}
          />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search datasets..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg text-[13px] outline-none"
            style={{
              background: "var(--bg-1)",
              border: "1px solid var(--border)",
              color: "var(--text-1)",
            }}
            onFocus={e => (e.target.style.borderColor = "var(--orange)")}
            onBlur={e => (e.target.style.borderColor = "var(--border)")}
          />
        </motion.div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: "var(--bg-1)" }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          variants={fadeUp} initial="hidden" animate="show"
          className="rounded-xl py-20 text-center"
          style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }}
        >
          <IconDatabase size={28} className="mx-auto mb-4" style={{ color: "var(--text-3)" }} />
          <p className="text-[14px] font-medium mb-1" style={{ color: "var(--text-1)" }}>
            {search ? "No datasets match your search" : "No datasets yet"}
          </p>
          <p className="text-[12px]" style={{ color: "var(--text-3)" }}>
            {search ? "Try a different keyword" : "Upload a CSV to get started"}
          </p>
        </motion.div>
      ) : (
        <motion.div
          variants={stagger(0.05)} initial="hidden" animate="show"
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid var(--border)" }}
        >
          {/* Table header */}
          <div
            className="grid grid-cols-12 gap-4 px-5 py-3 text-[11px] font-medium tracking-wider uppercase"
            style={{
              background: "var(--bg-2)",
              color: "var(--text-3)",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <div className="col-span-4">Name</div>
            <div className="col-span-2">Rows</div>
            <div className="col-span-1">Cols</div>
            <div className="col-span-2">Size</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1"></div>
          </div>

          {filtered.map((d: any, i: number) => {
            const sc = statusConfig[d.status as keyof typeof statusConfig] || statusConfig.pending
            return (
              <motion.div
                key={d.id}
                variants={fadeUp}
                className="grid grid-cols-12 gap-4 px-5 py-3.5 items-center transition-colors relative"
                style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none", background: "var(--bg-1)" }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-2)")}
                onMouseLeave={e => (e.currentTarget.style.background = "var(--bg-1)")}
              >
                {/* Name */}
                <div className="col-span-4 flex items-center gap-3 min-w-0">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: "var(--bg-3)" }}
                  >
                    <IconFileTypeCsv size={15} style={{ color: "var(--orange)" }} />
                  </div>
                  <div className="min-w-0">
                    <Link
                      href={`/dashboard/datasets/${d.id}`}
                      className="text-[13px] font-medium truncate block hover:underline"
                      style={{ color: "var(--text-1)" }}
                    >
                      {d.name}
                    </Link>
                    <p className="text-[11px] truncate" style={{ color: "var(--text-3)" }}>
                      {d.original_filename}
                    </p>
                  </div>
                </div>

                {/* Rows */}
                <div className="col-span-2 text-[13px]" style={{ color: "var(--text-2)" }}>
                  {d.row_count ? d.row_count.toLocaleString() : "—"}
                </div>

                {/* Cols */}
                <div className="col-span-1 text-[13px]" style={{ color: "var(--text-2)" }}>
                  {d.column_count || "—"}
                </div>

                {/* Size */}
                <div className="col-span-2 text-[13px]" style={{ color: "var(--text-2)" }}>
                  {d.file_size_bytes ? formatBytes(d.file_size_bytes) : "—"}
                </div>

                {/* Status */}
                <div className="col-span-2 flex items-center gap-1.5">
                  <sc.icon size={13} style={{ color: sc.color }} />
                  <span className="text-[12px]" style={{ color: sc.color }}>{sc.label}</span>
                </div>

                {/* Actions */}
                <div className="col-span-1 flex items-center justify-end gap-1">
                  <Link
                    href={`/dashboard/datasets/${d.id}`}
                    className="w-7 h-7 rounded-md flex items-center justify-center transition-colors"
                    style={{ background: "var(--bg-3)" }}
                  >
                    <IconArrowRight size={12} style={{ color: "var(--text-2)" }} />
                  </Link>
                  <button
                    onClick={() => deleteMutation.mutate(d.id)}
                    className="w-7 h-7 rounded-md flex items-center justify-center transition-colors"
                    style={{ background: "var(--bg-3)" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.15)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "var(--bg-3)")}
                  >
                    <IconTrash size={12} style={{ color: "#f87171" }} />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}
