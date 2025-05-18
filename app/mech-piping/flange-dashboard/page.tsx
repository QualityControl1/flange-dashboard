"use client"

import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings, RefreshCw, AlertCircle, Gauge, Check, GripVertical, Plus, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"
import { v4 as uuidv4 } from "uuid"

// Types for Flange data
interface Flange {
  id: number
  job: string
  job_number: string
  status?: string
  percent_complete?: number
  system?: string
  system_no?: string
  created_at?: string
  updated_at?: string
  inspection_date?: string
  line_number?: string
  flange_number?: number
  flange_type?: string
  flange_size?: string
  flange_rating?: string
  flange_material?: string
  gasket_type?: string
  gasket_material?: string
  inspection_status?: string
  client?: string
}

// Widget definition
interface Widget {
  id: string
  type: string
  title: string
  size: "small" | "medium" | "large"
  [key: string]: any
}

// Available metrics for summary cards
const AVAILABLE_METRICS = [
  { id: "total_flanges", name: "Total Flanges", icon: "gauge", color: "blue" },
  { id: "completed_flanges", name: "Completed Flanges", icon: "check", color: "green" },
  { id: "in_progress_flanges", name: "In Progress Flanges", icon: "settings", color: "blue" },
  { id: "not_started_flanges", name: "Not Started Flanges", icon: "alert", color: "red" },
  { id: "delayed_flanges", name: "Delayed Flanges", icon: "alert", color: "orange" },
  { id: "on_hold_flanges", name: "On Hold Flanges", icon: "alert", color: "yellow" },
  { id: "inspection_passed", name: "Inspection Passed", icon: "check", color: "green" },
  { id: "inspection_failed", name: "Inspection Failed", icon: "alert", color: "red" },
  { id: "pending_inspection", name: "Pending Inspection", icon: "alert", color: "purple" },
]

// Default widgets
const DEFAULT_WIDGETS: Widget[] = [
  {
    id: "summary-total",
    type: "summary",
    title: "Total Flanges",
    size: "small",
    metric: "total_flanges",
    icon: "gauge",
    color: "blue",
  },
  {
    id: "summary-completed",
    type: "summary",
    title: "Completed",
    size: "small",
    metric: "completed_flanges",
    icon: "check",
    color: "green",
  },
  {
    id: "summary-in-progress",
    type: "summary",
    title: "In Progress",
    size: "small",
    metric: "in_progress_flanges",
    icon: "settings",
    color: "blue",
  },
  {
    id: "summary-not-started",
    type: "summary",
    title: "Not Started",
    size: "small",
    metric: "not_started_flanges",
    icon: "alert",
    color: "red",
  },
  {
    id: "bar-status",
    type: "bar",
    title: "Status Breakdown",
    size: "medium",
    metric: "status_breakdown",
    orientation: "vertical",
    showLegend: true,
  },
  {
    id: "pie-types",
    type: "pie",
    title: "Flange Types",
    size: "medium",
    metric: "flange_type_distribution",
    donut: true,
    showLegend: true,
  },
  {
    id: "table-systems",
    type: "table",
    title: "System Progress",
    size: "large",
    metric: "system_progress",
    pageSize: 5,
    columns: ["system", "complete", "total", "percentage"],
  },
]

export default function FlangeDashboardPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [flanges, setFlanges] = useState<Flange[]>([])
  const [widgets, setWidgets] = useState<Widget[]>([])
  const [columnSettings, setColumnSettings] = useState<Record<string, boolean>>({
    system: true,
    complete: true,
    total: true,
    percentage: true,
  })
  const [isEditMode, setIsEditMode] = useState(false)
  const [isAddWidgetDialogOpen, setIsAddWidgetDialogOpen] = useState(false)
  const [newWidgetType, setNewWidgetType] = useState<string>("summary")
  const [newWidgetMetric, setNewWidgetMetric] = useState<string>("")
  const [newWidgetTitle, setNewWidgetTitle] = useState<string>("")

  // Load saved layout or use default
  useEffect(() => {
    const savedLayout = localStorage.getItem("flange-dashboard-layout")
    if (savedLayout) {
      try {
        setWidgets(JSON.parse(savedLayout))
      } catch (e) {
        console.error("Error loading saved layout:", e)
        setWidgets(DEFAULT_WIDGETS)
      }
    } else {
      setWidgets(DEFAULT_WIDGETS)
    }

    // Load saved column settings
    const savedColumnSettings = localStorage.getItem("flange-dashboard-columns")
    if (savedColumnSettings) {
      try {
        setColumnSettings(JSON.parse(savedColumnSettings))
      } catch (e) {
        console.error("Error loading saved column settings:", e)
      }
    }
  }, [])

  // Save layout when it changes
  useEffect(() => {
    if (widgets.length > 0) {
      localStorage.setItem("flange-dashboard-layout", JSON.stringify(widgets))
    }
  }, [widgets])

  // Save column settings when they change
  useEffect(() => {
    localStorage.setItem("flange-dashboard-columns", JSON.stringify(columnSettings))
  }, [columnSettings])

  // Fetch flange data on mount
  useEffect(() => {
    fetchFlangeData()
  }, [])

  // Fetch flange data
  const fetchFlangeData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch flange data from API
      const response = await fetch("/api/flange-log?limit=500")
      if (!response.ok) {
        throw new Error("Failed to fetch flange data")
      }

      const result = await response.json()
      const data = result.data || []
      setFlanges(data)
    } catch (err) {
      console.error("Error fetching flange data:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setLoading(false)
    }
  }, [])

  const handleColumnToggle = (column: string, checked: boolean) => {
    setColumnSettings((prev) => ({
      ...prev,
      [column]: checked,
    }))
  }

  // Handle drag end
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const items = Array.from(widgets)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setWidgets(items)
  }

  // Reset layout to default
  const resetLayout = () => {
    setWidgets(DEFAULT_WIDGETS)
    toast({
      title: "Layout reset",
      description: "Dashboard layout has been reset to default",
    })
  }

  // Add a new widget
  const addWidget = () => {
    if (!newWidgetType) {
      toast({
        title: "Widget type required",
        description: "Please select a widget type",
        variant: "destructive",
      })
      return
    }

    if (newWidgetType === "summary" && !newWidgetMetric) {
      toast({
        title: "Metric required",
        description: "Please select a metric for the summary widget",
        variant: "destructive",
      })
      return
    }

    const selectedMetric = AVAILABLE_METRICS.find((m) => m.id === newWidgetMetric)

    const newWidget: Widget = {
      id: uuidv4(),
      type: newWidgetType,
      title: newWidgetTitle || (selectedMetric ? selectedMetric.name : "New Widget"),
      size: "small",
      metric: newWidgetMetric || "total_flanges",
      icon: selectedMetric?.icon || "gauge",
      color: selectedMetric?.color || "blue",
    }

    setWidgets([...widgets, newWidget])
    setIsAddWidgetDialogOpen(false)
    setNewWidgetType("summary")
    setNewWidgetMetric("")
    setNewWidgetTitle("")

    toast({
      title: "Widget added",
      description: "New widget has been added to the dashboard",
    })
  }

  // Delete a widget
  const deleteWidget = (id: string) => {
    setWidgets(widgets.filter((widget) => widget.id !== id))
    toast({
      title: "Widget removed",
      description: "Widget has been removed from the dashboard",
    })
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Button
            variant={isEditMode ? "default" : "outline"}
            onClick={() => setIsEditMode(!isEditMode)}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            {isEditMode ? "Done Editing" : "Edit Layout"}
          </Button>

          {isEditMode && (
            <>
              <Dialog open={isAddWidgetDialogOpen} onOpenChange={setIsAddWidgetDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Widget
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Widget</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="widget-type">Widget Type</Label>
                      <Select value={newWidgetType} onValueChange={setNewWidgetType}>
                        <SelectTrigger id="widget-type">
                          <SelectValue placeholder="Select widget type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="summary">Summary Card</SelectItem>
                          <SelectItem value="bar">Bar Chart</SelectItem>
                          <SelectItem value="pie">Pie Chart</SelectItem>
                          <SelectItem value="table">Table</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {newWidgetType === "summary" && (
                      <div className="space-y-2">
                        <Label htmlFor="widget-metric">Metric</Label>
                        <Select value={newWidgetMetric} onValueChange={setNewWidgetMetric}>
                          <SelectTrigger id="widget-metric">
                            <SelectValue placeholder="Select metric" />
                          </SelectTrigger>
                          <SelectContent>
                            {AVAILABLE_METRICS.map((metric) => (
                              <SelectItem key={metric.id} value={metric.id}>
                                {metric.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="widget-title">Custom Title (Optional)</Label>
                      <Input
                        id="widget-title"
                        value={newWidgetTitle}
                        onChange={(e) => setNewWidgetTitle(e.target.value)}
                        placeholder="Enter custom title"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddWidgetDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={addWidget}>Add Widget</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button variant="outline" onClick={resetLayout} className="flex items-center gap-2">
                Reset Layout
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Column Settings
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <h4 className="font-medium">Display Columns</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="column-system"
                      checked={columnSettings.system}
                      onCheckedChange={(checked) => handleColumnToggle("system", checked as boolean)}
                    />
                    <Label htmlFor="column-system">System</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="column-complete"
                      checked={columnSettings.complete}
                      onCheckedChange={(checked) => handleColumnToggle("complete", checked as boolean)}
                    />
                    <Label htmlFor="column-complete">Complete</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="column-total"
                      checked={columnSettings.total}
                      onCheckedChange={(checked) => handleColumnToggle("total", checked as boolean)}
                    />
                    <Label htmlFor="column-total">Total</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="column-percentage"
                      checked={columnSettings.percentage}
                      onCheckedChange={(checked) => handleColumnToggle("percentage", checked as boolean)}
                    />
                    <Label htmlFor="column-percentage">Percentage</Label>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button variant="outline" onClick={fetchFlangeData} disabled={loading} className="flex items-center gap-2">
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh Data
          </Button>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 p-4 rounded-md text-red-700 border border-red-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <p className="font-medium">Error loading dashboard data</p>
          </div>
          <p className="mt-1 text-sm">{error}</p>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="widgets">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
              >
                {widgets.map((widget, index) => (
                  <Draggable key={widget.id} draggableId={widget.id} index={index} isDragDisabled={!isEditMode}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`${
                          widget.size === "small"
                            ? "col-span-1"
                            : widget.size === "large"
                              ? "md:col-span-2 lg:col-span-4"
                              : "lg:col-span-2"
                        } ${snapshot.isDragging ? "opacity-70" : ""} ${isEditMode ? "ring-2 ring-primary/30" : ""}`}
                      >
                        <Card className="overflow-hidden relative">
                          {isEditMode && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-destructive"
                              onClick={() => deleteWidget(widget.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                          <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                              <h3 className="text-lg font-medium">{widget.title}</h3>
                              {isEditMode && (
                                <div {...provided.dragHandleProps} className="cursor-grab">
                                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                                </div>
                              )}
                            </div>

                            {renderWidget(widget, flanges, columnSettings, loading)}
                          </div>
                        </Card>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  )
}

// Render widget based on type
function renderWidget(widget: Widget, flanges: Flange[], columnSettings: Record<string, boolean>, loading: boolean) {
  switch (widget.type) {
    case "summary":
      return (
        <SummaryWidget
          title={widget.title}
          metric={widget.metric}
          icon={widget.icon}
          color={widget.color}
          flanges={flanges}
          loading={loading}
        />
      )
    case "bar":
      return (
        <BarChartWidget
          title={widget.title}
          metric={widget.metric}
          orientation={widget.orientation}
          showLegend={widget.showLegend}
          flanges={flanges}
          loading={loading}
        />
      )
    case "pie":
      return (
        <PieChartWidget
          title={widget.title}
          metric={widget.metric}
          donut={widget.donut}
          showLegend={widget.showLegend}
          flanges={flanges}
          loading={loading}
        />
      )
    case "table":
      return (
        <TableWidget
          title={widget.title}
          metric={widget.metric}
          columns={
            columnSettings
              ? Object.entries(columnSettings)
                  .filter(([_, enabled]) => enabled)
                  .map(([column]) => column)
              : widget.columns
          }
          pageSize={widget.pageSize}
          flanges={flanges}
          loading={loading}
        />
      )
    default:
      return <div>Unknown widget type</div>
  }
}

// Widget components
function SummaryWidget({
  title,
  metric,
  icon,
  color,
  flanges,
  loading,
}: {
  title: string
  metric: string
  icon: string
  color: string
  flanges: Flange[]
  loading: boolean
}) {
  let value = 0

  if (!loading) {
    switch (metric) {
      case "total_flanges":
        value = flanges.length
        break
      case "completed_flanges":
        value = flanges.filter((f) => f.status === "Completed" || f.percent_complete === 100).length
        break
      case "in_progress_flanges":
        value = flanges.filter(
          (f) =>
            f.status === "In Progress" || (f.percent_complete && f.percent_complete > 0 && f.percent_complete < 100),
        ).length
        break
      case "not_started_flanges":
        value = flanges.filter(
          (f) => f.status === "Not Started" || f.percent_complete === 0 || !f.percent_complete,
        ).length
        break
      case "delayed_flanges":
        value = flanges.filter((f) => f.status === "Delayed").length
        break
      case "on_hold_flanges":
        value = flanges.filter((f) => f.status === "On Hold").length
        break
      case "inspection_passed":
        value = flanges.filter((f) => f.inspection_status === "Passed").length
        break
      case "inspection_failed":
        value = flanges.filter((f) => f.inspection_status === "Failed").length
        break
      case "pending_inspection":
        value = flanges.filter((f) => f.inspection_status === "Pending").length
        break
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center">
        {loading ? (
          <div className="h-7 w-16 bg-muted animate-pulse rounded"></div>
        ) : (
          <div className="text-2xl font-bold">{value?.toLocaleString() || 0}</div>
        )}
        {getWidgetIcon(icon, color)}
      </div>
    </div>
  )
}

function BarChartWidget({
  metric,
  orientation = "vertical",
  showLegend = true,
  flanges,
  loading,
}: {
  title: string
  metric: string
  orientation?: string
  showLegend?: boolean
  flanges: Flange[]
  loading: boolean
}) {
  let data: any[] = []

  if (!loading) {
    switch (metric) {
      case "status_breakdown":
        data = getStatusBreakdown(flanges)
        break
      case "flange_type_distribution":
        data = getFlangeTypeDistribution(flanges)
        break
      // Add more metrics as needed
    }
  }

  return (
    <div>
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
    </div>
  )
}

function PieChartWidget({
  metric,
  donut = false,
  showLegend = true,
  flanges,
  loading,
}: {
  title: string
  metric: string
  donut?: boolean
  showLegend?: boolean
  flanges: Flange[]
  loading: boolean
}) {
  let data: any[] = []

  if (!loading) {
    switch (metric) {
      case "status_breakdown":
        data = getStatusBreakdown(flanges)
        break
      case "flange_type_distribution":
        data = getFlangeTypeDistribution(flanges)
        break
      // Add more metrics as needed
    }
  }

  return (
    <div>
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
    </div>
  )
}

function TableWidget({
  metric,
  columns = ["system", "complete", "total", "percentage"],
  pageSize = 5,
  flanges,
  loading,
}: {
  title: string
  metric: string
  columns?: string[]
  pageSize?: number
  flanges: Flange[]
  loading: boolean
}) {
  const [page, setPage] = useState(0)
  let data: any[] = []

  if (!loading) {
    switch (metric) {
      case "system_progress":
        data = getSystemProgress(flanges)
        break
      // Add more metrics as needed
    }
  }

  const totalPages = data ? Math.ceil(data.length / pageSize) : 0
  const paginatedData = data ? data.slice(page * pageSize, (page + 1) * pageSize) : []

  return (
    <div>
      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-8 w-full bg-muted animate-pulse rounded"></div>
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
                          <div className="h-2 w-20 bg-muted overflow-hidden rounded-full">
                            <div className="h-full bg-orange-500" style={{ width: `${item.percentage}%` }}></div>
                          </div>
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
    </div>
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

// Data processing functions
function getStatusBreakdown(flanges: Flange[]) {
  const statusCounts: Record<string, number> = {}
  flanges.forEach((flange) => {
    const status = flange.status || "Unknown"
    statusCounts[status] = (statusCounts[status] || 0) + 1
  })
  return Object.entries(statusCounts).map(([status, count]) => ({
    name: status,
    value: count,
    color: getStatusColor(status),
  }))
}

function getFlangeTypeDistribution(flanges: Flange[]) {
  const typeCounts: Record<string, number> = {}
  flanges.forEach((flange) => {
    const type = flange.flange_type || "Unknown"
    typeCounts[type] = (typeCounts[type] || 0) + 1
  })
  return Object.entries(typeCounts).map(([type, count]) => ({
    name: type,
    value: count,
    color: getRandomColor(type),
  }))
}

function getSystemProgress(flanges: Flange[]) {
  const systemData: Record<string, { total: number; complete: number }> = {}

  flanges.forEach((flange) => {
    const system = flange.system || flange.system_no || "Unspecified"

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
}

// Helper functions
function getWidgetIcon(icon: string, color: string) {
  const colorClass = `text-${color}-500`

  switch (icon) {
    case "gauge":
      return <Gauge className={`h-5 w-5 ${colorClass}`} />
    case "settings":
      return <Gauge className={`h-5 w-5 ${colorClass}`} />
    case "check":
      return <Check className={`h-5 w-5 ${colorClass}`} />
    case "alert":
      return <AlertCircle className={`h-5 w-5 ${colorClass}`} />
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
