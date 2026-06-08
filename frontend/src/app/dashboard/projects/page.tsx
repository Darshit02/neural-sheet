"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { projectsApi } from "@/lib/api"
import { fadeUp, stagger } from "@/lib/motion"
import { formatDate } from "@/lib/utils"
import { toast } from "sonner"
import Link from "next/link"
import {
  IconFolder, IconPlus, IconTrash,
  IconEdit, IconArrowRight, IconX,
  IconCheck, IconDatabase,
} from "@tabler/icons-react"

const PROJECT_COLORS = [
  "#F97316", "#3B82F6", "#10B981", "#8B5CF6",
  "#EF4444", "#F59E0B", "#06B6D4", "#EC4899",
]

const PROJECT_ICONS = ["folder", "database", "chart", "brain", "star", "bolt"]

function CreateProjectModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [name, setName] = useState("")
  const [desc, setDesc] = useState("")
  const [color, setColor] = useState(PROJECT_COLORS[0])
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    if (!name.trim()) return
    setLoading(true)
    try {
      await projectsApi.create({ name, description: desc, color })
      qc.invalidateQueries({ queryKey: ["projects"] })
      toast.success("Project created")
      onClose()
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Failed to create project")
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
            Create project
          </h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "var(--bg-3)" }}
          >
            <IconX size={14} style={{ color: "var(--text-2)" }} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-[12px] mb-1.5" style={{ color: "var(--text-2)" }}>
              Project name
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="eg. Sales Analysis Q4"
              className="w-full px-3.5 py-2.5 rounded-lg text-[13px] outline-none"
              style={{
                background: "var(--bg-2)",
                border: "1px solid var(--border)",
                color: "var(--text-1)",
              }}
              onFocus={e => (e.target.style.borderColor = "var(--orange)")}
              onBlur={e => (e.target.style.borderColor = "var(--border)")}
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[12px] mb-1.5" style={{ color: "var(--text-2)" }}>
              Description <span style={{ color: "var(--text-3)" }}>(optional)</span>
            </label>
            <textarea
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="What's this project about?"
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-lg text-[13px] outline-none resize-none"
              style={{
                background: "var(--bg-2)",
                border: "1px solid var(--border)",
                color: "var(--text-1)",
              }}
              onFocus={e => (e.target.style.borderColor = "var(--orange)")}
              onBlur={e => (e.target.style.borderColor = "var(--border)")}
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-[12px] mb-2" style={{ color: "var(--text-2)" }}>
              Color
            </label>
            <div className="flex gap-2 flex-wrap">
              {PROJECT_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-transform hover:scale-110"
                  style={{ background: c }}
                >
                  {color === c && <IconCheck size={13} color="#fff" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Preview */}
        <div
          className="flex items-center gap-3 p-3.5 rounded-xl mt-5"
          style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${color}20` }}
          >
            <IconFolder size={17} style={{ color }} />
          </div>
          <div>
            <p className="text-[13px] font-medium" style={{ color: "var(--text-1)" }}>
              {name || "Project name"}
            </p>
            <p className="text-[11px]" style={{ color: "var(--text-3)" }}>
              {desc || "No description"}
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-[13px] transition-colors"
            style={{
              border: "1px solid var(--border)",
              color: "var(--text-2)",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || loading}
            className="flex-1 py-2.5 rounded-lg text-[13px] font-medium"
            style={{
              background: (!name.trim() || loading) ? "rgba(249,115,22,0.4)" : "var(--orange)",
              color: "#000",
              cursor: (!name.trim() || loading) ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Creating..." : "Create project"}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default function ProjectsPage() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [search, setSearch] = useState("")

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectsApi.list().then(r => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => projectsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] })
      toast.success("Project deleted")
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || "Cannot delete project"),
  })

  const filtered = projects.filter((p: any) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <AnimatePresence>
        {showCreate && <CreateProjectModal onClose={() => setShowCreate(false)} />}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        variants={fadeUp} initial="hidden" animate="show"
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-[20px] font-semibold tracking-tight mb-1" style={{ color: "var(--text-1)" }}>
            Projects
          </h2>
          <p className="text-[13px]" style={{ color: "var(--text-2)" }}>
            {projects.length} project{projects.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium"
          style={{ background: "var(--orange)", color: "#000" }}
        >
          <IconPlus size={14} />
          New project
        </button>
      </motion.div>

      {/* Search */}
      {projects.length > 0 && (
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="relative max-w-sm">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="w-full pl-4 pr-4 py-2 rounded-lg text-[13px] outline-none"
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

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 rounded-xl animate-pulse" style={{ background: "var(--bg-1)" }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          variants={fadeUp} initial="hidden" animate="show"
          className="rounded-xl py-20 text-center"
          style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }}
        >
          <IconFolder size={28} className="mx-auto mb-4" style={{ color: "var(--text-3)" }} />
          <p className="text-[14px] font-medium mb-2" style={{ color: "var(--text-1)" }}>
            {search ? "No projects match" : "No projects yet"}
          </p>
          <p className="text-[12px] mb-5" style={{ color: "var(--text-3)" }}>
            Create a project to organise your datasets
          </p>
          {!search && (
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium"
              style={{ background: "var(--orange)", color: "#000" }}
            >
              <IconPlus size={14} /> Create project
            </button>
          )}
        </motion.div>
      ) : (
        <motion.div
          variants={stagger(0.07)} initial="hidden" animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filtered.map((p: any) => (
            <motion.div
              key={p.id}
              variants={fadeUp}
              className="rounded-xl p-5 group transition-colors"
              style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--border-hover)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
            >
              {/* Project header */}
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${p.color || "var(--orange)"}15` }}
                >
                  <IconFolder size={18} style={{ color: p.color || "var(--orange)" }} />
                </div>
                <button
                  onClick={() => deleteMutation.mutate(p.id)}
                  className="w-7 h-7 rounded-lg items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hidden group-hover:flex"
                  style={{ background: "rgba(239,68,68,0.1)" }}
                >
                  <IconTrash size={12} style={{ color: "#f87171" }} />
                </button>
              </div>

              <h3 className="text-[15px] font-semibold mb-1" style={{ color: "var(--text-1)" }}>
                {p.name}
              </h3>
              <p className="text-[12px] mb-4 line-clamp-2" style={{ color: "var(--text-2)" }}>
                {p.description || "No description"}
              </p>

              <div
                className="flex items-center justify-between pt-4"
                style={{ borderTop: "1px solid var(--border)" }}
              >
                <div className="flex items-center gap-1.5 text-[12px]" style={{ color: "var(--text-3)" }}>
                  <IconDatabase size={12} />
                  {p.dataset_count} dataset{p.dataset_count !== 1 ? "s" : ""}
                </div>
                <Link
                  href={`/dashboard/datasets?project=${p.id}`}
                  className="flex items-center gap-1 text-[12px] font-medium transition-colors"
                  style={{ color: "var(--orange)" }}
                >
                  View <IconArrowRight size={12} />
                </Link>
              </div>
            </motion.div>
          ))}

          {/* New project card */}
          <motion.button
            variants={fadeUp}
            onClick={() => setShowCreate(true)}
            className="rounded-xl p-5 flex flex-col items-center justify-center gap-3 transition-colors min-h-[160px]"
            style={{
              background: "transparent",
              border: "2px dashed var(--border)",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = "var(--orange)"
              e.currentTarget.style.background = "var(--orange-dim)"
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = "var(--border)"
              e.currentTarget.style.background = "transparent"
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "var(--bg-1)" }}
            >
              <IconPlus size={18} style={{ color: "var(--text-3)" }} />
            </div>
            <p className="text-[13px]" style={{ color: "var(--text-3)" }}>New project</p>
          </motion.button>
        </motion.div>
      )}
    </div>
  )
}
