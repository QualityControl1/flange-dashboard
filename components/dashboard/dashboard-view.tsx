"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings, RefreshCw, AlertCircle, Gauge, Check, AlertTriangle } from "lucide-react"
import { useDashboards } from "@/hooks/use-dashboards"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

interface DashboardViewProps {
  dashboardId: string
  onEdit: () => void
  columnSettings?: Record<string, boolean>
}

export default function DashboardView({ dashboardId, onEdit, columnSettings }: DashboardViewProps) {
  const { dashboards, flangeData, isLoading, refreshData } = useDashboards()
  const { toast } = useToast()
  const [dashboard, setDashboard] = useState<any>(null)
  const [filters, setFilters] = useState<Record<string, string>>({})

  // Load dashboard data
  useEffect(() => {
    if (dashboardId) {
      const currentDashboard = dashboards.find((d) => d.id === dashboardId)
      if (currentDashboard) {
        setDashboard(currentDashboard)

        // Initialize filters
        const initialFilters: Record<string, string> = {}
        currentDashboard.filters?.forEach((filter: any) => {
          if (filter.enabled) {
            initialFilters[filter.id] = "all"
          }
        })
        setFilters(initialFilters)
      }
    }
  }, [dashboardId, dashboards])

  // Handle filter change
  const handleFilterChange = (filterId: string, value: string) => {
    setFilters({
      ...filters,
      [filterId]: value,
    })
  }

  // Get filtered data based on current filters
  const getFilteredData = () => {
    if (!flangeData) return []

    return flangeData.filter((flange: any) => {
      // Apply each active filter
      for (const [filterId, filterValue] of Object.entries(filters)) {
        if (filterValue === "all") continue

        switch (filterId) {
          case "job":
            if (flange.job_number !== filterValue) return false
            break
          case "system":
            if (flange.system !== filterValue) return false
            break
          case "flange_type":
            if (flange.flange_type !== filterValue) return false
            break
          case "flange_size":
            if (flange.flange_size !== filterValue) return false
            break
          case "flange_material":
            if (flange.flange_material !== filterValue) return false
            break
          // Date range would need special handling
        }
      }

      return true
    })
  }

  // Get filter options from data
  const getFilterOptions = (filterId: string) => {
    if (!flangeData) return []

    const options = new Set<string>()

    flangeData.forEach((flange: any) => {
      let value

      switch (filterId) {
        case "job":
          value = flange.job_number
          break
        case "system":
          value = flange.system
          break
        case "flange_type":
          value = flange.flange_type
          break
        case "flange_size":
          value = flange.flange_size
          break
        case "flange_material":
          value = flange.flange_material
          break
      }

      if (value) {
        options.add(value)
      }
    })

    return Array.from(options).sort()
  }

  // Get widget data based on metric
  const getWidgetData = (widget: any) => {
    const filteredData = getFilteredData()

    switch (widget.metric) {
      case "total_flanges":
        return filteredData.length

      case "completed_flanges":
        return filteredData.filter((f: any) => f.status === "Completed" || f.percent_complete === 100).length

      case "in_progress_flanges":
        return filteredData.filter(
          (f: any) =>
            f.status === "In Progress" || (f.percent_complete && f.percent_complete > 0 && f.percent_complete < 100),
        ).length

      case "not_started_flanges":
        return filteredData.filter(
          (f: any) => f.status === "Not Started" || f.percent_complete === 0 || !f.percent_complete,
        ).length

      case "status_breakdown":
        const statusCounts: Record<string, number> = {}
        filteredData.forEach((flange: any) => {
          const status = flange.status || "Unknown"
          statusCounts[status] = (statusCounts[status] || 0) + 1
        })
        return Object.entries(statusCounts).map(([status, count]) => ({
          name: status,
          value: count,
          color: getStatusColor(status),
        }))

      case "system_progress":
        const systemData: Record<string, { total: number; complete: number }> = {}

        filteredData.forEach((flange: any) => {
          const system = flange.system || "Unspecified"

          if (!systemData[system]) {
            systemData[system] = { total: 0, complete: 0 }
          }

          systemData[system].total++

          if (flange.status === "Completed" || flange.percent_complete === 100) {
            systemData[system].complete++
          }
        })

        return Object.entries(systemData)
          .map(([system, { complete, total }]) => ({
            system,
            complete,
            total,
            percentage: total > 0 ? Math.round((complete / total) * 100) : 0,
          }))
          .sort((a, b) => b.percentage - a.percentage)

      case "flange_size_distribution":
        const sizeCounts: Record<string, number> = {}
        filteredData.forEach((flange: any) => {
          const size = flange.flange_size || "Unknown"
          sizeCounts[size] = (sizeCounts[size] || 0) + 1
        })
        return Object.entries(sizeCounts).map(([size, count]) => ({
          name: size,
          value: count,
          color: getRandomColor(size),
        }))

      case "flange_type_distribution":
        const typeCounts: Record<string, number> = {}
        filteredData.forEach((flange: any) => {
          const type = flange.flange_type || "Unknown"
          typeCounts[type] = (typeCounts[type] || 0) + 1
        })
        return Object.entries(typeCounts).map(([type, count]) => ({
          name: type,
          value: count,
          color: getRandomColor(type),
        }))

      case "flange_material_distribution":
        const materialCounts: Record<string, number> = {}
        filteredData.forEach((flange: any) => {
          const material = flange.flange_material || "Unknown"
          materialCounts[material] = (materialCounts[material] || 0) + 1
        })
        return Object.entries(materialCounts).map(([material, count]) => ({
          name: material,
          value: count,
          color: getRandomColor(material),
        }))

      case "completion_trend":
        // Generate mock trend data based on timeframe
        return generateMockTrendData(widget.timeframe || "week")

      case "inspection_status":
        const inspectionCounts: Record<string, number> = {}
        filteredData.forEach((flange: any) => {
          const status = flange.inspection_status || "Not Inspected"
          inspectionCounts[status] = (inspectionCounts[status] || 0) + 1
        })
        return Object.entries(inspectionCounts).map(([status, count]) => ({
          name: status,
          value: count,
          color: getInspectionStatusColor(status),
        }))

      default:
        return null
    }
  }

  // Render widget based on type and data
  const renderWidget = (widget: any) => {
    const data = getWidgetData(widget)

    switch (widget.type) {
      case "summary":
        return (
          <SummaryCard
            title={widget.title}
            value={data}
            icon={getWidgetIcon(widget.icon, widget.color)}
            loading={isLoading}
          />
        )

      case "bar":
        return (
          <BarChartWidget
            title={widget.title}
            data={data}
            orientation={widget.orientation}
            showLegend={widget.showLegend}
            loading={isLoading}
          />
        )

      case "pie":
        return (
          <PieChartWidget
            title={widget.title}
            data={data}
            donut={widget.donut}
            showLegend={widget.showLegend}
            loading={isLoading}
          />
        )

      case "line":
        return <LineChartWidget title={widget.title} data={data} showLegend={widget.showLegend} loading={isLoading} />

      case "table":
        return (
          <TableWidget
            title={widget.title}
            data={data}
            columns={
              columnSettings
                ? Object.entries(columnSettings)
                    .filter(([_, enabled]) => enabled)
                    .map(([column]) => column)
                : widget.columns
            }
            pageSize={widget.pageSize}
            loading={isLoading}
          />
        )

      default:
        return (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-muted-foreground">Unknown widget type</div>
            </CardContent>
          </Card>
        )
    }
  }

  if (!dashboard) {
    return (
      <div className="flex items-center justify-center p-12">
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Dashboard description */}
      {dashboard.description && <p className="text-muted-foreground">{dashboard.description}</p>}

      {/* Dashboard filters */}
      {dashboard.filters && dashboard.filters.length > 0 && (
        <div className="flex flex-wrap gap-4 p-4 bg-muted/20 rounded-lg">
          {dashboard.filters
            .filter((f: any) => f.enabled)
            .map((filter: any) => (
              <div key={filter.id} className="space-y-1">
                <label className="text-sm font-medium">{filter.name}</label>
                <Select
                  value={filters[filter.id] || "all"}
                  onValueChange={(value) => handleFilterChange(filter.id, value)}
                >
                  <SelectTrigger className="w-[180px] h-9">
                    <SelectValue placeholder={`All ${filter.name}`} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {getFilterOptions(filter.id).map((option: string) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}

          <div className="flex items-end ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Reset all filters to "all"
                const resetFilters: Record<string, string> = {}
                dashboard.filters.forEach((filter: any) => {
                  if (filter.enabled) {
                    resetFilters[filter.id] = "all"
                  }
                })
                setFilters(resetFilters)
              }}
              className="h-9"
            >
              Reset Filters
            </Button>
          </div>
        </div>
      )}

      {/* Dashboard actions */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={refreshData} disabled={isLoading} className="flex items-center gap-2">
          {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </Button>
        <Button variant="outline" onClick={onEdit} className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Edit Dashboard
        </Button>
      </div>

      {/* Dashboard widgets */}
      <div
        className={`grid gap-4 ${
          dashboard.layout === "grid"
            ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            : dashboard.layout === "columns"
              ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
              : "grid-cols-1"
        }`}
      >
        {dashboard.widgets.map((widget: any) => (
          <div
            key={widget.id}
            className={`${
              widget.size === "small"
                ? "col-span-1"
                : widget.size === "large"
                  ? "md:col-span-2 lg:col-span-3"
                  : dashboard.layout === "grid"
                    ? "col-span-1"
                    : "col-span-1"
            }`}
          >
            {renderWidget(widget)}
          </div>
        ))}
      </div>

      {dashboard.widgets.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No widgets in this dashboard</h3>
            <p className="text-muted-foreground mb-4">This dashboard doesn't have any widgets yet.</p>
            <Button onClick={onEdit}>Edit Dashboard</Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Widget components
function SummaryCard({
  title,
  value,
  icon,
  loading,
}: {
  title: string
  value: number
  icon: React.ReactNode
  loading: boolean
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent className="p-6">
        {loading ? (
          <div className="h-7 w-16 bg-muted animate-pulse rounded"></div>
        ) : (
          <div className="text-2xl font-bold">{value?.toLocaleString() || 0}</div>
        )}
      </CardContent>
    </Card>
  )
}

function BarChartWidget({
  title,
  data,
  orientation = "vertical",
  showLegend = true,
  loading,
}: {
  title: string
  data: any[]
  orientation?: string
  showLegend?: boolean
  loading: boolean
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-60 flex items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !data || data.length === 0 ? (
          <div className="h-60 flex items-center justify-center text-muted-foreground">No data available</div>
        ) : (
          <div className="space-y-4">
            {orientation === "vertical" ? (
              <div className="h-60 flex items-end justify-between gap-2">
                {data.map((item, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div
                      className="w-12 rounded-t-sm"
                      style={{
                        height: `${(item.value / Math.max(...data.map((d) => d.value))) * 200}px`,
                        backgroundColor: item.color,
                        minHeight: "4px",
                      }}
                    ></div>
                    <div className="text-xs text-muted-foreground mt-2 w-16 text-center truncate" title={item.name}>
                      {item.name}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-60 space-y-3">
                {data.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-24 text-xs truncate" title={item.name}>
                      {item.name}
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                      <div
                        className="h-6 rounded-sm"
                        style={{
                          width: `${(item.value / Math.max(...data.map((d) => d.value))) * 100}%`,
                          backgroundColor: item.color,
                          minWidth: "4px",
                        }}
                      ></div>
                      <span className="text-xs">{item.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {showLegend && (
              <div className="flex flex-wrap gap-4 justify-center mt-4">
                {data.map((item, index) => (
                  <div key={index} className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }}></div>
                    <span className="text-xs">{item.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function PieChartWidget({
  title,
  data,
  donut = false,
  showLegend = true,
  loading,
}: {
  title: string
  data: any[]
  donut?: boolean
  showLegend?: boolean
  loading: boolean
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-60 flex items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !data || data.length === 0 ? (
          <div className="h-60 flex items-center justify-center text-muted-foreground">No data available</div>
        ) : (
          <div className="space-y-4">
            <div className="relative h-48 w-48 mx-auto">
              <SimplePieChart data={data} donut={donut} />
            </div>

            {showLegend && (
              <div className="flex flex-wrap gap-4 justify-center mt-4">
                {data.map((item, index) => (
                  <div key={index} className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }}></div>
                    <span className="text-xs">
                      {item.name} ({item.value})
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function LineChartWidget({
  title,
  data,
  showLegend = true,
  loading,
}: {
  title: string
  data: any[]
  showLegend?: boolean
  loading: boolean
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-60 flex items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !data || data.length === 0 ? (
          <div className="h-60 flex items-center justify-center text-muted-foreground">No data available</div>
        ) : (
          <div className="space-y-4">
            <div className="h-60 w-full">
              <div className="relative flex-1 border-l border-b border-border h-full">
                {/* Y-axis labels */}
                <div className="absolute -left-8 top-0 h-full flex flex-col justify-between text-xs text-muted-foreground">
                  <span>{Math.max(...data.map((t) => t.total))}</span>
                  <span>0</span>
                </div>

                {/* Trend lines */}
                <div className="h-full flex gap-1 items-end pt-6 pb-2">
                  {data.map((point, index) => (
                    <div
                      key={index}
                      className="flex-1 flex flex-col items-center gap-1"
                      title={`${point.date}: ${point.completed}/${point.total}`}
                    >
                      <div className="w-full flex flex-col items-center">
                        <div
                          className="w-full bg-gray-200"
                          style={{
                            height: `${(point.total / Math.max(...data.map((t) => t.total))) * 100}%`,
                            minHeight: "4px",
                          }}
                        ></div>
                        <div
                          className="w-full bg-orange-500"
                          style={{
                            height: `${(point.completed / Math.max(...data.map((t) => t.total))) * 100}%`,
                            minHeight: "4px",
                            marginTop: `-${(point.completed / Math.max(...data.map((t) => t.total))) * 100}%`,
                          }}
                        ></div>
                      </div>
                      {/* Only show every nth label to prevent overcrowding */}
                      {index % Math.max(1, Math.floor(data.length / 10)) === 0 && (
                        <span className="text-xs text-muted-foreground -rotate-45 origin-top-left whitespace-nowrap">
                          {point.date}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {showLegend && (
              <div className="flex gap-4 justify-center mt-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-orange-500"></div>
                  <span>Completed</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-gray-200"></div>
                  <span>Total</span>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function TableWidget({
  title,
  data,
  columns = ["system", "complete", "total", "percentage"],
  pageSize = 5,
  loading,
}: {
  title: string
  data: any[]
  columns?: string[]
  pageSize?: number
  loading: boolean
}) {
  const [page, setPage] = useState(0)

  const totalPages = data ? Math.ceil(data.length / pageSize) : 0
  const paginatedData = data ? data.slice(page * pageSize, (page + 1) * pageSize) : []

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-muted-foreground">No data available</div>
        ) : (
          <div className="space-y-4">
            <div className="border rounded-md">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    {columns.includes("system") && <th className="text-left p-2 text-xs font-medium">System</th>}
                    {columns.includes("complete") && <th className="text-right p-2 text-xs font-medium">Complete</th>}
                    {columns.includes("total") && <th className="text-right p-2 text-xs font-medium">Total</th>}
                    {columns.includes("percentage") && <th className="text-right p-2 text-xs font-medium">Progress</th>}
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((item, index) => (
                    <tr key={index} className="border-b last:border-0">
                      {columns.includes("system") && <td className="p-2 text-sm">{item.system}</td>}
                      {columns.includes("complete") && <td className="p-2 text-sm text-right">{item.complete}</td>}
                      {columns.includes("total") && <td className="p-2 text-sm text-right">{item.total}</td>}
                      {columns.includes("percentage") && (
                        <td className="p-2">
                          <div className="flex items-center justify-end gap-2">
                            <Progress value={item.percentage} className="h-2 w-20" />
                            <span className="text-xs">{item.percentage}%</span>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  Previous
                </Button>
                <span className="text-xs text-muted-foreground">
                  Page {page + 1} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page === totalPages - 1}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Simple SVG pie chart component
function SimplePieChart({ data, donut = false }: { data: any[]; donut?: boolean }) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  let startAngle = 0

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      {data.map((item, index) => {
        const percentage = item.value / total
        const angle = percentage * 360
        const endAngle = startAngle + angle

        // Calculate the SVG arc path
        const x1 = 50 + 50 * Math.cos((startAngle * Math.PI) / 180)
        const y1 = 50 + 50 * Math.sin((startAngle * Math.PI) / 180)
        const x2 = 50 + 50 * Math.cos((endAngle * Math.PI) / 180)
        const y2 = 50 + 50 * Math.sin((endAngle * Math.PI) / 180)

        // Determine if the arc should be drawn as a large arc
        const largeArcFlag = angle > 180 ? 1 : 0

        // Create the path for the slice
        const path = [`M 50 50`, `L ${x1} ${y1}`, `A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2}`, `Z`].join(" ")

        const slice = <path key={index} d={path} fill={item.color} stroke="#fff" strokeWidth="0.5" />

        startAngle = endAngle

        return slice
      })}

      {donut && <circle cx="50" cy="50" r="25" fill="white" />}
    </svg>
  )
}

// Helper functions
function getWidgetIcon(icon: string, color: string) {
  const colorClass = `text-${color}-500`

  switch (icon) {
    case "gauge":
      return <Gauge className={`h-5 w-5 ${colorClass}`} />
    case "settings":
      return <Settings className={`h-5 w-5 ${colorClass}`} />
    case "check":
      return <Check className={`h-5 w-5 ${colorClass}`} />
    case "alert":
      return <AlertTriangle className={`h-5 w-5 ${colorClass}`} />
    default:
      return <Gauge className={`h-5 w-5 ${colorClass}`} />
  }
}

function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    Completed: "#22c55e", // green-500
    "In Progress": "#3b82f6", // blue-500
    "Not Started": "#94a3b8", // slate-400
    Delayed: "#ef4444", // red-500
    "On Hold": "#eab308", // yellow-500
    "Pending Inspection": "#a855f7", // purple-500
    "Failed Inspection": "#f59e0b", // amber-500
    Unknown: "#cbd5e1", // slate-300
  }

  return statusColors[status] || "#cbd5e1"
}

function getInspectionStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    Passed: "#22c55e", // green-500
    Failed: "#ef4444", // red-500
    Pending: "#3b82f6", // blue-500
    "Not Required": "#94a3b8", // slate-400
    "Not Inspected": "#cbd5e1", // slate-300
  }

  return statusColors[status] || "#cbd5e1"
}

function getRandomColor(seed: string): string {
  // Simple hash function to generate a consistent color for a given string
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  }

  // Convert to hex color
  const colors = [
    "#3b82f6", // blue-500
    "#22c55e", // green-500
    "#ef4444", // red-500
    "#eab308", // yellow-500
    "#a855f7", // purple-500
    "#f59e0b", // amber-500
    "#ec4899", // pink-500
    "#14b8a6", // teal-500
    "#f97316", // orange-500
    "#8b5cf6", // violet-500
  ]

  return colors[Math.abs(hash) % colors.length]
}

// Generate mock trend data based on timeframe for demonstration
function generateMockTrendData(timeframe: string) {
  const now = new Date()
  const trendData: any[] = []

  let days = 7
  let increment = 1
  let format = "short" // 'short' for daily, 'month' for monthly

  if (timeframe === "month") {
    days = 30
    increment = 3
    format = "short"
  } else if (timeframe === "quarter") {
    days = 90
    increment = 7
    format = "short"
  } else if (timeframe === "year") {
    days = 365
    increment = 30
    format = "month"
  }

  let total = Math.floor(Math.random() * 50) + 100 // Random starting total

  for (let i = days; i >= 0; i -= increment) {
    const date = new Date(now)
    date.setDate(now.getDate() - i)

    const completed = Math.floor(total * (Math.min(100, days - i + Math.random() * 20) / 100))

    trendData.push({
      date: date.toLocaleDateString("en-US", {
        month: format === "short" ? "short" : "long",
        day: format === "short" ? "numeric" : undefined,
      }),
      completed,
      total,
    })

    // Randomly increase total over time for more realistic data
    if (Math.random() > 0.7) {
      total += Math.floor(Math.random() * 5) + 1
    }
  }

  return trendData
}
