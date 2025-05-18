"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Settings, RefreshCw } from "lucide-react"
import { useDashboards } from "@/hooks/use-dashboards"
import DashboardView from "@/components/dashboard/dashboard-view"

export default function DashboardPage() {
  const { dashboards, activeDashboard, setActiveDashboard, isLoading, refreshData } = useDashboards()
  const [selectedDashboard, setSelectedDashboard] = useState<string | null>(null)
  const [columnSettings, setColumnSettings] = useState<Record<string, boolean>>({
    system: true,
    complete: true,
    total: true,
    percentage: true,
  })

  // Set first dashboard as active on load
  useEffect(() => {
    if (dashboards.length > 0 && !selectedDashboard) {
      const firstDashboard = dashboards[0]
      setSelectedDashboard(firstDashboard.id)
      setActiveDashboard(firstDashboard.id)
    }
  }, [dashboards, selectedDashboard, setActiveDashboard])

  // Update column settings in the dashboard
  useEffect(() => {
    if (selectedDashboard && dashboards.length > 0) {
      const dashboard = dashboards.find((d) => d.id === selectedDashboard)
      if (dashboard) {
        // Update widgets that have columns property
        const updatedWidgets = dashboard.widgets.map((widget) => {
          if (widget.type === "table" && widget.columns) {
            return {
              ...widget,
              columns: Object.entries(columnSettings)
                .filter(([_, enabled]) => enabled)
                .map(([column]) => column),
            }
          }
          return widget
        })

        // We're not actually saving this change permanently, just passing it to the view
        // In a real app, you would save this to your state management or backend
      }
    }
  }, [columnSettings, selectedDashboard, dashboards])

  const handleColumnToggle = (column: string, checked: boolean) => {
    setColumnSettings((prev) => ({
      ...prev,
      [column]: checked,
    }))
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={refreshData} disabled={isLoading} className="flex items-center gap-2">
          {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh Data
        </Button>

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
      </div>

      <Card>
        <CardContent className="p-6">
          {selectedDashboard ? (
            <DashboardView
              dashboardId={selectedDashboard}
              onEdit={() => {}} // Empty function since we're removing edit functionality
              columnSettings={columnSettings}
            />
          ) : (
            <div className="flex items-center justify-center h-[60vh]">
              {isLoading ? <p>Loading dashboard...</p> : <p>No dashboard available</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
