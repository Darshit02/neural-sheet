"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { vizApi } from "@/lib/api"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, LineChart, Line, Cell, CartesianGrid,
} from "recharts"
import { IconChartBar, IconChartDots, IconRefresh, IconTrendingUp } from "@tabler/icons-react"

const COLORS = [
  "#f97316", 
  "#6366f1", 
  "#10b981", 
  "#ec4899", 
  "#3b82f6",
  "#f43f5e",
  "#8b5cf6", 
  "#06b6d4",
  "#eab308",
]

const TooltipStyle = {
  contentStyle: {
    background: "var(--bg-2)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    color: "var(--text-1)",
    fontSize: 12,
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    padding: "8px 12px",
  },
  cursor: { fill: "rgba(255, 255, 255, 0.05)" },
}

export default function ChartsTab({ datasetId, dataset }: { datasetId: number; dataset: any }) {
  const { data: overview, isLoading } = useQuery({
    queryKey: ["viz-overview", datasetId],
    queryFn: () => vizApi.overview(datasetId).then(r => r.data),
    enabled: dataset.status === "ready",
  })

  const { data: colsInfo } = useQuery({
    queryKey: ["viz-cols", datasetId],
    queryFn: () => vizApi.columns(datasetId).then(r => r.data),
    enabled: dataset.status === "ready",
  })

  if (dataset.status !== "ready") {
    return (
      <div className="rounded-2xl py-20 text-center" style={{ border: "1px dashed var(--border)", background: "var(--bg-1)" }}>
        <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ background: "var(--bg-2)" }}>
          <IconRefresh className="animate-spin" size={24} style={{ color: "var(--text-3)" }} />
        </div>
        <p className="text-[14px] font-medium" style={{ color: "var(--text-2)" }}>Dataset is processing...</p>
        <p className="text-[12px] mt-1" style={{ color: "var(--text-3)" }}>Visualizations will appear once ready</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-72 rounded-2xl animate-pulse" style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }} />
        ))}
      </div>
    )
  }

  const charts = overview?.charts
  const distributions = charts?.distributions || {}
  const barCharts = charts?.bar_charts || {}
  const correlation = charts?.correlation
  const missingData = charts?.missing_values?.data || []

  return (
    <div className="space-y-8 pb-10">
      {/* Missing values */}
      {missingData.filter((d: any) => d.missing_count > 0).length > 0 && (
        <ChartCard title="Data Quality: Missing Values" icon={<IconChartBar size={18} />}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={missingData.filter((d: any) => d.missing_count > 0)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
              <XAxis dataKey="column" tick={{ fill: "var(--text-3)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "var(--text-3)", fontSize: 11 }} unit="%" axisLine={false} tickLine={false} />
              <Tooltip
                {...TooltipStyle}
                formatter={(v: any) => [`${v}%`, "Missing"]}
              />
              <Bar dataKey="missing_pct" radius={[6, 6, 0, 0]} barSize={40}>
                {missingData.filter((d: any) => d.missing_count > 0).map((d: any, i: number) => (
                  <Cell
                    key={i}
                    fill={d.missing_pct > 30 ? "#f87171" : d.missing_pct > 10 ? "#facc15" : COLORS[0]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Distributions grid */}
      {Object.keys(distributions).length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <div className="w-1 h-4 rounded-full" style={{ background: COLORS[1] }} />
            <h3 className="text-[14px] font-semibold tracking-tight" style={{ color: "var(--text-1)" }}>
              Numerical Distributions
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(distributions).slice(0, 6).map(([col, data]: [string, any], idx: number) => (
              <ChartCard 
                key={col} 
                title={col} 
                subtitle={`mean: ${data.stats?.mean?.toFixed(2)} · std: ${data.stats?.std?.toFixed(2)}`}
              >
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={data.data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <XAxis dataKey="bin_start" hide />
                    <YAxis tick={{ fill: "var(--text-3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      {...TooltipStyle}
                      formatter={(v: any) => [v, "Count"]}
                      labelFormatter={(l: any) => `Range: ${Number(l).toFixed(2)}`}
                    />
                    <Bar 
                      dataKey="count" 
                      fill={COLORS[(idx + 1) % COLORS.length]} 
                      radius={[3, 3, 0, 0]} 
                      opacity={0.8} 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            ))}
          </div>
        </div>
      )}

      {/* Bar charts for categoricals */}
      {Object.keys(barCharts).length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <div className="w-1 h-4 rounded-full" style={{ background: COLORS[2] }} />
            <h3 className="text-[14px] font-semibold tracking-tight" style={{ color: "var(--text-1)" }}>
              Categorical Analysis
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(barCharts).slice(0, 4).map(([col, data]: [string, any], idx: number) => (
              <ChartCard 
                key={col} 
                title={col} 
                subtitle={`${data.unique_count} unique values`}
              >
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.data} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" opacity={0.3} />
                    <XAxis type="number" hide />
                    <YAxis 
                      type="category" 
                      dataKey="label" 
                      tick={{ fill: "var(--text-2)", fontSize: 11 }} 
                      width={90}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip {...TooltipStyle} formatter={(v: any) => [v, "Count"]} />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={20}>
                      {data.data.map((entry: any, i: number) => (
                        <Cell key={i} fill={COLORS[(idx + 2 + i) % COLORS.length]} opacity={0.85} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            ))}
          </div>
        </div>
      )}

      {/* Correlation heatmap text */}
      {correlation?.top_correlations?.length > 0 && (
        <ChartCard 
          title="Variable Relationships" 
          subtitle="Top correlations between numeric columns"
          icon={<IconTrendingUp size={18} />}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-3 py-2">
            {correlation.top_correlations.slice(0, 10).map((c: any, i: number) => (
              <div key={i} className="flex items-center justify-between group">
                <div className="flex items-center gap-3 min-w-0">
                  <div 
                    className="w-2 h-2 rounded-full shrink-0" 
                    style={{ background: c.correlation > 0 ? COLORS[2] : COLORS[5] }} 
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[12px] truncate font-medium" style={{ color: "var(--text-1)" }}>{c.col1}</span>
                    <span className="text-[11px] truncate" style={{ color: "var(--text-3)" }}>{c.col2}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex flex-col items-end">
                    <span
                      className="text-[13px] font-mono font-bold"
                      style={{ color: Math.abs(c.correlation) > 0.7 ? COLORS[0] : "var(--text-2)" }}
                    >
                      {c.correlation > 0 ? "+" : ""}{c.correlation.toFixed(3)}
                    </span>
                    <span className="text-[10px] uppercase tracking-tighter" style={{ color: "var(--text-3)" }}>
                      {c.strength}
                    </span>
                  </div>
                  <div
                    className="h-8 w-1 rounded-full opacity-20 group-hover:opacity-100 transition-opacity"
                    style={{ background: Math.abs(c.correlation) > 0.7 ? COLORS[0] : "var(--border)" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      )}
    </div>
  )
}

function ChartCard({ title, subtitle, icon, children }: { title: string; subtitle?: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-black/5" style={{ background: "var(--bg-1)", border: "1px solid var(--border)" }}>
      <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3">
          {icon && <div style={{ color: "var(--orange)" }}>{icon}</div>}
          <div>
            <p className="text-[14px] font-semibold" style={{ color: "var(--text-1)" }}>{title}</p>
            {subtitle && <p className="text-[11px] mt-0.5 font-medium" style={{ color: "var(--text-3)" }}>{subtitle}</p>}
          </div>
        </div>
      </div>
      <div className="px-6 py-6">{children}</div>
    </div>
  )
}
