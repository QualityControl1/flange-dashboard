"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"
import {
  Plus,
  Save,
  X,
  Trash2,
  GripVertical,
  BarChart3,
  PieChart,
  LineChart,
  Table2,
  Gauge,
  ArrowLeft,
} from "lucide-react"
import { useDashboards } from "@/hooks/use-dashboards"
import { useToast } from "@/hooks/use-toast"
import { v4 as uuidv4 } from "uuid"
import WidgetPreview from "./widget-preview"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

// Widget types and their icons
const WIDGET_TYPES = [
  { id: "summary", name: "Summary Card", icon: <Gauge className="h-5 w-5" /> },
  { id: "bar", name: "Bar Chart", icon: <BarChart3 className="h-5 w-5" /> },
  { id: "pie", name: "Pie Chart", icon: <PieChart className="h-5 w-5" /> },
  { id: "line", name: "Line Chart", icon: <LineChart className="h-5 w-5" /> },
  { id: "table", name: "Data Table", icon: <Table2 className="h-5 w-5" /> },
]

// Available metrics for widgets
const AVAILABLE_METRICS = [
  { id: "total_flanges", name: "Total Flanges", category: "count" },
  { id: "completed_flanges", name: "Completed Flanges", category: "count" },
  { id: "in_progress_flanges", name: "In Progress Flanges", category: "count" },
  { id: "not_started_flanges", name: "Not Started Flanges", category: "count" },
  { id: "status_breakdown", name: "Status Breakdown", category: "breakdown" },
  { id: "system_progress", name: "System Progress", category: "progress" },
  { id: "flange_size_distribution", name: "Flange Size Distribution", category: "breakdown" },
  { id: "flange_type_distribution", name: "Flange Type Distribution", category: "breakdown" },
  { id: "flange_material_distribution", name: "Flange Material Distribution", category: "breakdown" },
  { id: "completion_trend", name: "Completion Trend", category: "trend" },
  { id: "inspection_status", name: "Inspection Status", category: "breakdown" },
]

// Available filters
const AVAILABLE_FILTERS = [
  { id: "job", name: "Job Number" },
  { id: "system", name: "System" },
  { id: "flange_type", name: "Flange Type" },
  { id: "flange_size", name: "Flange Size" },
  { id: "flange_material", name: "Flange Material" },
  { id: "date_range", name: "Date Range" },
]

// Default widget configurations by type
const DEFAULT_WIDGET_CONFIGS = {
  summary: {
    title: "Summary",
    metric: "total_flanges",
    icon: "gauge",
    color: "blue",
  },
  bar: {
    title: "Bar Chart",
    metric: "status_breakdown",
    showLegend: true,
    orientation: "vertical",
  },
  pie: {
    title: "Pie Chart",
    metric: "status_breakdown",
    showLegend: true,
    donut: false,
  },
  line: {
    title: "Line Chart",
    metric: "completion_trend",
    showLegend: true,
    timeframe: "week",
  },
  table: {
    title: "Data Table",
    metric: "system_progress",
    pageSize: 5,
    columns: ["system", "complete", "total", "percentage"],
  },
}

interface DashboardBuilderProps {
  dashboardId: string | null
  onSave: (dashboard: any) => void
  onCancel: () => void
}

export default function DashboardBuilder({ dashboardId, onSave, onCancel }: DashboardBuilderProps) {
  const { dashboards, isLoading } = useDashboards()
  const { toast } = useToast()
  const [dashboard, setDashboard] = useState<any>({
    id: "",
    name: "New Dashboard",
    description: "",
    layout: "grid",
    widgets: [],
    filters: [],
  })
  const [activeWidgetId, setActiveWidgetId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("layout")

  // Load existing dashboard if editing
  useEffect(() => {
    if (dashboardId) {
      const existingDashboard = dashboards.find((d) => d.id === dashboardId)
      if (existingDashboard) {
        setDashboard(existingDashboard)
      }
    } else {
      // Create new dashboard with UUID
      setDashboard({
        id: uuidv4(),
        name: "New Dashboard",
        description: "",
        layout: "grid",
        widgets: [],
        filters: [],
      })
    }
  }, [dashboardId, dashboards])

  // Handle drag and drop reordering
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const items = Array.from(dashboard.widgets)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setDashboard({
      ...dashboard,
      widgets: items,
    })
  }

  // Add a new widget
  const addWidget = (type: string) => {
    const newWidget = {
      id: uuidv4(),
      type,
      size: "medium",
      ...DEFAULT_WIDGET_CONFIGS[type as keyof typeof DEFAULT_WIDGET_CONFIGS],
    }

    setDashboard({
      ...dashboard,
      widgets: [...dashboard.widgets, newWidget],
    })

    setActiveWidgetId(newWidget.id)
    setActiveTab("widget")
  }

  // Remove a widget
  const removeWidget = (id: string) => {
    setDashboard({
      ...dashboard,
      widgets: dashboard.widgets.filter((w: any) => w.id !== id),
    })

    if (activeWidgetId === id) {
      setActiveWidgetId(null)
    }
  }

  // Update widget properties
  const updateWidget = (id: string, updates: any) => {
    setDashboard({
      ...dashboard,
      widgets: dashboard.widgets.map((widget: any) => (widget.id === id ? { ...widget, ...updates } : widget)),
    })
  }

  // Add a filter
  const addFilter = (filterId: string) => {
    if (dashboard.filters.some((f: any) => f.id === filterId)) {
      toast({
        title: "Filter already added",
        description: "This filter is already in use on this dashboard.",
      })
      return
    }

    const filterConfig = AVAILABLE_FILTERS.find((f) => f.id === filterId)

    setDashboard({
      ...dashboard,
      filters: [
        ...dashboard.filters,
        {
          id: filterId,
          name: filterConfig?.name || filterId,
          enabled: true,
        },
      ],
    })
  }

  // Remove a filter
  const removeFilter = (filterId: string) => {
    setDashboard({
      ...dashboard,
      filters: dashboard.filters.filter((f: any) => f.id !== filterId),
    })
  }

  // Toggle filter enabled state
  const toggleFilter = (filterId: string, enabled: boolean) => {
    setDashboard({
      ...dashboard,
      filters: dashboard.filters.map((filter: any) => (filter.id === filterId ? { ...filter, enabled } : filter)),
    })
  }

  // Handle save
  const handleSave = () => {
    if (!dashboard.name.trim()) {
      toast({
        title: "Dashboard name required",
        description: "Please provide a name for your dashboard.",
        variant: "destructive",
      })
      return
    }

    onSave(dashboard)
  }

  // Get active widget
  const activeWidget = dashboard.widgets.find((w: any) => w.id === activeWidgetId)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onCancel} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboards
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Save Dashboard
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Dashboard Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dashboard-name">Dashboard Name</Label>
                    <Input
                      id="dashboard-name"
                      value={dashboard.name}
                      onChange={(e) => setDashboard({ ...dashboard, name: e.target.value })}
                      placeholder="Enter dashboard name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dashboard-layout">Layout</Label>
                    <Select
                      value={dashboard.layout}
                      onValueChange={(value) => setDashboard({ ...dashboard, layout: value })}
                    >
                      <SelectTrigger id="dashboard-layout">
                        <SelectValue placeholder="Select layout" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="grid">Grid</SelectItem>
                        <SelectItem value="columns">Columns</SelectItem>
                        <SelectItem value="rows">Rows</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dashboard-description">Description (Optional)</Label>
                  <Textarea
                    id="dashboard-description"
                    value={dashboard.description}
                    onChange={(e) => setDashboard({ ...dashboard, description: e.target.value })}
                    placeholder="Enter dashboard description"
                    rows={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="layout">Layout & Widgets</TabsTrigger>
              <TabsTrigger value="widget" disabled={!activeWidgetId}>
                Widget Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="layout" className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle>Dashboard Widgets</CardTitle>
                    <div className="flex gap-2">
                      <Select onValueChange={addWidget}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Add widget" />
                        </SelectTrigger>
                        <SelectContent>
                          {WIDGET_TYPES.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              <div className="flex items-center gap-2">
                                {type.icon}
                                <span>{type.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {dashboard.widgets.length === 0 ? (
                    <div className="border border-dashed rounded-md p-8 text-center">
                      <h3 className="text-lg font-medium mb-2">No widgets added yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Add widgets to your dashboard using the dropdown above.
                      </p>
                    </div>
                  ) : (
                    <DragDropContext onDragEnd={handleDragEnd}>
                      <Droppable droppableId="widgets">
                        {(provided) => (
                          <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                            {dashboard.widgets.map((widget: any, index: number) => {
                              const widgetType = WIDGET_TYPES.find((t) => t.id === widget.type)

                              return (
                                <Draggable key={widget.id} draggableId={widget.id} index={index}>
                                  {(provided) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className={`border rounded-md p-3 flex items-center justify-between ${
                                        activeWidgetId === widget.id ? "border-primary bg-primary/5" : ""
                                      }`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div {...provided.dragHandleProps} className="cursor-grab">
                                          <GripVertical className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {widgetType?.icon}
                                          <span className="font-medium">{widget.title}</span>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Select
                                          value={widget.size}
                                          onValueChange={(value) => updateWidget(widget.id, { size: value })}
                                        >
                                          <SelectTrigger className="w-[100px] h-8">
                                            <SelectValue placeholder="Size" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="small">Small</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="large">Large</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <Button variant="ghost" size="sm" onClick={() => setActiveWidgetId(widget.id)}>
                                          Edit
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => removeWidget(widget.id)}>
                                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              )
                            })}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle>Dashboard Filters</CardTitle>
                    <Select onValueChange={addFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Add filter" />
                      </SelectTrigger>
                      <SelectContent>
                        {AVAILABLE_FILTERS.map((filter) => (
                          <SelectItem key={filter.id} value={filter.id}>
                            {filter.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  {dashboard.filters.length === 0 ? (
                    <div className="border border-dashed rounded-md p-8 text-center">
                      <h3 className="text-lg font-medium mb-2">No filters added yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Add filters to allow users to refine the dashboard data.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {dashboard.filters.map((filter: any) => (
                        <div key={filter.id} className="flex items-center justify-between border rounded-md p-3">
                          <div className="flex items-center gap-3">
                            <span className="font-medium">{filter.name}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={filter.enabled}
                                onCheckedChange={(checked) => toggleFilter(filter.id, checked)}
                                id={`filter-${filter.id}`}
                              />
                              <Label htmlFor={`filter-${filter.id}`} className="text-sm">
                                Enabled
                              </Label>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => removeFilter(filter.id)}>
                              <Trash2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="widget" className="space-y-4">
              {activeWidget && (
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle>Widget Settings</CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => setActiveTab("layout")}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="widget-title">Widget Title</Label>
                          <Input
                            id="widget-title"
                            value={activeWidget.title}
                            onChange={(e) => updateWidget(activeWidget.id, { title: e.target.value })}
                            placeholder="Enter widget title"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="widget-metric">Metric</Label>
                          <Select
                            value={activeWidget.metric}
                            onValueChange={(value) => updateWidget(activeWidget.id, { metric: value })}
                          >
                            <SelectTrigger id="widget-metric">
                              <SelectValue placeholder="Select metric" />
                            </SelectTrigger>
                            <SelectContent>
                              {AVAILABLE_METRICS.filter((metric) => {
                                // Filter metrics based on widget type compatibility
                                if (activeWidget.type === "summary") {
                                  return metric.category === "count"
                                }
                                if (activeWidget.type === "pie") {
                                  return metric.category === "breakdown"
                                }
                                if (activeWidget.type === "line") {
                                  return metric.category === "trend"
                                }
                                return true
                              }).map((metric) => (
                                <SelectItem key={metric.id} value={metric.id}>
                                  {metric.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Type-specific settings */}
                      {activeWidget.type === "summary" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="widget-icon">Icon</Label>
                            <Select
                              value={activeWidget.icon}
                              onValueChange={(value) => updateWidget(activeWidget.id, { icon: value })}
                            >
                              <SelectTrigger id="widget-icon">
                                <SelectValue placeholder="Select icon" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="gauge">Gauge</SelectItem>
                                <SelectItem value="settings">Settings</SelectItem>
                                <SelectItem value="check">Check</SelectItem>
                                <SelectItem value="alert">Alert</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="widget-color">Color</Label>
                            <Select
                              value={activeWidget.color}
                              onValueChange={(value) => updateWidget(activeWidget.id, { color: value })}
                            >
                              <SelectTrigger id="widget-color">
                                <SelectValue placeholder="Select color" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="blue">Blue</SelectItem>
                                <SelectItem value="green">Green</SelectItem>
                                <SelectItem value="red">Red</SelectItem>
                                <SelectItem value="yellow">Yellow</SelectItem>
                                <SelectItem value="purple">Purple</SelectItem>
                                <SelectItem value="orange">Orange</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}

                      {activeWidget.type === "bar" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="widget-orientation">Orientation</Label>
                            <Select
                              value={activeWidget.orientation}
                              onValueChange={(value) => updateWidget(activeWidget.id, { orientation: value })}
                            >
                              <SelectTrigger id="widget-orientation">
                                <SelectValue placeholder="Select orientation" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="vertical">Vertical</SelectItem>
                                <SelectItem value="horizontal">Horizontal</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center space-x-2 pt-8">
                            <Switch
                              checked={activeWidget.showLegend}
                              onCheckedChange={(checked) => updateWidget(activeWidget.id, { showLegend: checked })}
                              id="show-legend"
                            />
                            <Label htmlFor="show-legend">Show Legend</Label>
                          </div>
                        </div>
                      )}

                      {activeWidget.type === "pie" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={activeWidget.donut}
                              onCheckedChange={(checked) => updateWidget(activeWidget.id, { donut: checked })}
                              id="donut-chart"
                            />
                            <Label htmlFor="donut-chart">Donut Chart</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={activeWidget.showLegend}
                              onCheckedChange={(checked) => updateWidget(activeWidget.id, { showLegend: checked })}
                              id="show-legend-pie"
                            />
                            <Label htmlFor="show-legend-pie">Show Legend</Label>
                          </div>
                        </div>
                      )}

                      {activeWidget.type === "line" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="widget-timeframe">Timeframe</Label>
                            <Select
                              value={activeWidget.timeframe}
                              onValueChange={(value) => updateWidget(activeWidget.id, { timeframe: value })}
                            >
                              <SelectTrigger id="widget-timeframe">
                                <SelectValue placeholder="Select timeframe" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="week">Last Week</SelectItem>
                                <SelectItem value="month">Last Month</SelectItem>
                                <SelectItem value="quarter">Last Quarter</SelectItem>
                                <SelectItem value="year">Last Year</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center space-x-2 pt-8">
                            <Switch
                              checked={activeWidget.showLegend}
                              onCheckedChange={(checked) => updateWidget(activeWidget.id, { showLegend: checked })}
                              id="show-legend-line"
                            />
                            <Label htmlFor="show-legend-line">Show Legend</Label>
                          </div>
                        </div>
                      )}

                      {activeWidget.type === "table" && (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="widget-pageSize">Rows Per Page</Label>
                            <Select
                              value={activeWidget.pageSize.toString()}
                              onValueChange={(value) =>
                                updateWidget(activeWidget.id, { pageSize: Number.parseInt(value) })
                              }
                            >
                              <SelectTrigger id="widget-pageSize">
                                <SelectValue placeholder="Select rows per page" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="5">5 rows</SelectItem>
                                <SelectItem value="10">10 rows</SelectItem>
                                <SelectItem value="15">15 rows</SelectItem>
                                <SelectItem value="20">20 rows</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Columns to Display</Label>
                            <div className="grid grid-cols-2 gap-2">
                              {["system", "complete", "total", "percentage"].map((column) => (
                                <div key={column} className="flex items-center space-x-2">
                                  <Switch
                                    checked={activeWidget.columns.includes(column)}
                                    onCheckedChange={(checked) => {
                                      const newColumns = checked
                                        ? [...activeWidget.columns, column]
                                        : activeWidget.columns.filter((c: string) => c !== column)
                                      updateWidget(activeWidget.id, { columns: newColumns })
                                    }}
                                    id={`column-${column}`}
                                  />
                                  <Label htmlFor={`column-${column}`} className="capitalize">
                                    {column}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md p-4 bg-muted/20">
                <h3 className="text-lg font-semibold mb-4">{dashboard.name}</h3>

                {dashboard.description && <p className="text-sm text-muted-foreground mb-4">{dashboard.description}</p>}

                {dashboard.filters.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4 p-2 bg-muted/30 rounded-md">
                    {dashboard.filters
                      .filter((f: any) => f.enabled)
                      .map((filter: any) => (
                        <div key={filter.id} className="text-xs bg-background px-2 py-1 rounded border">
                          {filter.name}: All
                        </div>
                      ))}
                  </div>
                )}

                <div
                  className={`grid gap-4 ${
                    dashboard.layout === "grid"
                      ? "grid-cols-2"
                      : dashboard.layout === "columns"
                        ? "grid-cols-1"
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
                            ? "col-span-2"
                            : dashboard.layout === "grid"
                              ? "col-span-1"
                              : "col-span-1"
                      }`}
                    >
                      <WidgetPreview
                        widget={widget}
                        isActive={widget.id === activeWidgetId}
                        onClick={() => {
                          setActiveWidgetId(widget.id)
                          setActiveTab("widget")
                        }}
                      />
                    </div>
                  ))}
                </div>

                {dashboard.widgets.length === 0 && (
                  <div className="text-center p-8 text-muted-foreground">Add widgets to see a preview</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Widget Library</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <Accordion type="single" collapsible className="w-full">
                  {WIDGET_TYPES.map((type) => (
                    <AccordionItem key={type.id} value={type.id}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-2">
                          {type.icon}
                          <span>{type.name}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="p-2 space-y-2">
                          <p className="text-sm text-muted-foreground">{getWidgetDescription(type.id)}</p>
                          <Button variant="outline" size="sm" className="w-full" onClick={() => addWidget(type.id)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add to Dashboard
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Helper function to get widget descriptions
function getWidgetDescription(widgetType: string): string {
  switch (widgetType) {
    case "summary":
      return "Summary cards display a single metric with an optional icon. Ideal for key performance indicators."
    case "bar":
      return "Bar charts visualize comparative data across categories. Can be displayed as vertical or horizontal bars."
    case "pie":
      return "Pie charts show proportional data as slices of a circle. Can be configured as a donut chart."
    case "line":
      return "Line charts display trends over time. Useful for showing progress or changes in metrics."
    case "table":
      return "Data tables display detailed information in rows and columns. Configurable with pagination."
    default:
      return "A customizable widget for your dashboard."
  }
}
