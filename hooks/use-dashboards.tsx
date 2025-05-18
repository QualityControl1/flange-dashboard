"use client"

import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"

// Mock data for demonstration
const MOCK_FLANGE_DATA = [
  {
    id: 1,
    job_number: "81148-",
    flange_number: 3389,
    status: "Completed",
    percent_complete: 100,
    system: "CA1-030",
    flange_type: "RFWN",
    flange_size: "16.000",
    flange_rating: "300",
    flange_material: "CS",
    created_at: "2025-05-17T06:23:07.993Z",
    updated_at: "2025-05-17T19:23:55.850Z",
    inspection_status: "Passed",
  },
  {
    id: 2,
    job_number: "81148-",
    flange_number: 3388,
    status: "In Progress",
    percent_complete: 60,
    system: "CA1-030",
    flange_type: "RFWN",
    flange_size: "10.000",
    flange_rating: "300",
    flange_material: "CS",
    created_at: "2025-05-17T06:23:07.993Z",
    updated_at: "2025-05-17T19:23:55.850Z",
    inspection_status: "Pending",
  },
  {
    id: 3,
    job_number: "81148-",
    flange_number: 3387,
    status: "Not Started",
    percent_complete: 0,
    system: "CA1-030",
    flange_type: "RFWN",
    flange_size: "10.000",
    flange_rating: "300",
    flange_material: "CS",
    created_at: "2025-05-17T06:23:07.993Z",
    updated_at: "2025-05-17T19:23:55.850Z",
    inspection_status: "Not Inspected",
  },
  {
    id: 4,
    job_number: "999999",
    flange_number: 6,
    status: "Completed",
    percent_complete: 100,
    system: "Test System",
    flange_type: null,
    flange_size: null,
    flange_rating: null,
    flange_material: null,
    created_at: "2025-05-17T15:25:22.284Z",
    updated_at: "2025-05-17T15:25:22.284Z",
    inspection_status: "Passed",
  },
  // Generate more mock data
  ...Array.from({ length: 20 }, (_, i) => {
    const systems = ["CA1-030", "CA1-031", "HY-CB-0262", "Test System", "Main System"]
    const statuses = ["Completed", "In Progress", "Not Started", "Delayed", "On Hold"]
    const types = ["RFWN", "RFSW", "RFBL", "RFTJ", null]
    const sizes = ["6.000", "8.000", "10.000", "12.000", "16.000", null]
    const materials = ["CS", "SS", "AL", null]
    const inspectionStatuses = ["Passed", "Failed", "Pending", "Not Inspected"]

    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const percentComplete =
      status === "Completed" ? 100 : status === "Not Started" ? 0 : Math.floor(Math.random() * 90) + 5

    return {
      id: i + 5,
      job_number: Math.random() > 0.7 ? "999999" : "81148-",
      flange_number: 1000 + i,
      status,
      percent_complete: percentComplete,
      system: systems[Math.floor(Math.random() * systems.length)],
      flange_type: types[Math.floor(Math.random() * types.length)],
      flange_size: sizes[Math.floor(Math.random() * sizes.length)],
      flange_rating: Math.random() > 0.3 ? "300" : "150",
      flange_material: materials[Math.floor(Math.random() * materials.length)],
      created_at: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - Math.floor(Math.random() * 10) * 24 * 60 * 60 * 1000).toISOString(),
      inspection_status: inspectionStatuses[Math.floor(Math.random() * inspectionStatuses.length)],
    }
  }),
]

// Sample dashboard for demonstration
const SAMPLE_DASHBOARDS = [
  {
    id: "sample-dashboard-1",
    name: "Flange Overview",
    description: "Overview of flange status and progress",
    layout: "grid",
    widgets: [
      {
        id: "widget-1",
        type: "summary",
        size: "medium",
        title: "Total Flanges",
        metric: "total_flanges",
        icon: "gauge",
        color: "blue",
      },
      {
        id: "widget-2",
        type: "summary",
        size: "medium",
        title: "Completed",
        metric: "completed_flanges",
        icon: "check",
        color: "green",
      },
      {
        id: "widget-3",
        type: "summary",
        size: "medium",
        title: "In Progress",
        metric: "in_progress_flanges",
        icon: "settings",
        color: "blue",
      },
      {
        id: "widget-4",
        type: "bar",
        size: "large",
        title: "Status Breakdown",
        metric: "status_breakdown",
        showLegend: true,
        orientation: "vertical",
      },
      {
        id: "widget-5",
        type: "pie",
        size: "medium",
        title: "Flange Types",
        metric: "flange_type_distribution",
        showLegend: true,
        donut: true,
      },
      {
        id: "widget-6",
        type: "table",
        size: "large",
        title: "System Progress",
        metric: "system_progress",
        pageSize: 5,
        columns: ["system", "complete", "total", "percentage"],
      },
    ],
    filters: [
      { id: "job", name: "Job Number", enabled: true },
      { id: "system", name: "System", enabled: true },
    ],
  },
]

export function useDashboards() {
  const [dashboards, setDashboards] = useState<any[]>([])
  const [activeDashboard, setActiveDashboard] = useState<string | null>(null)
  const [flangeData, setFlangeData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  // Load dashboards from localStorage on mount
  useEffect(() => {
    const loadDashboards = () => {
      try {
        const savedDashboards = localStorage.getItem("flange-dashboards")
        if (savedDashboards) {
          const parsed = JSON.parse(savedDashboards)
          setDashboards(parsed)

          // Set first dashboard as active if none is active
          if (parsed.length > 0 && !activeDashboard) {
            setActiveDashboard(parsed[0].id)
          }
        } else {
          // Use sample dashboards if none exist
          setDashboards(SAMPLE_DASHBOARDS)
          if (SAMPLE_DASHBOARDS.length > 0) {
            setActiveDashboard(SAMPLE_DASHBOARDS[0].id)
          }
        }
      } catch (error) {
        console.error("Error loading dashboards:", error)
        toast({
          title: "Error loading dashboards",
          description: "There was an error loading your saved dashboards.",
          variant: "destructive",
        })
      }
    }

    loadDashboards()
    fetchFlangeData()
  }, [])

  // Save dashboards to localStorage whenever they change
  useEffect(() => {
    if (dashboards.length > 0) {
      localStorage.setItem("flange-dashboards", JSON.stringify(dashboards))
    }
  }, [dashboards])

  // Fetch flange data
  const fetchFlangeData = useCallback(async () => {
    setIsLoading(true)

    try {
      // In a real app, this would be an API call
      // For demo, we'll use mock data with a delay to simulate loading
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setFlangeData(MOCK_FLANGE_DATA)
    } catch (error) {
      console.error("Error fetching flange data:", error)
      toast({
        title: "Error fetching data",
        description: "There was an error fetching the flange data.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  // Save a dashboard
  const saveDashboard = useCallback(
    async (dashboard: any) => {
      setIsLoading(true)

      try {
        // Check if dashboard already exists
        const existingIndex = dashboards.findIndex((d) => d.id === dashboard.id)

        if (existingIndex >= 0) {
          // Update existing dashboard
          const updatedDashboards = [...dashboards]
          updatedDashboards[existingIndex] = dashboard
          setDashboards(updatedDashboards)
        } else {
          // Add new dashboard
          setDashboards([...dashboards, dashboard])
        }

        // Set as active dashboard
        setActiveDashboard(dashboard.id)

        return dashboard
      } catch (error) {
        console.error("Error saving dashboard:", error)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [dashboards],
  )

  // Delete a dashboard
  const deleteDashboard = useCallback(
    async (id: string) => {
      setIsLoading(true)

      try {
        const updatedDashboards = dashboards.filter((d) => d.id !== id)
        setDashboards(updatedDashboards)

        // If the active dashboard was deleted, set a new active dashboard
        if (activeDashboard === id) {
          setActiveDashboard(updatedDashboards.length > 0 ? updatedDashboards[0].id : null)
        }

        return true
      } catch (error) {
        console.error("Error deleting dashboard:", error)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [dashboards, activeDashboard],
  )

  // Refresh data
  const refreshData = useCallback(() => {
    fetchFlangeData()
  }, [fetchFlangeData])

  return {
    dashboards,
    activeDashboard,
    setActiveDashboard,
    flangeData,
    isLoading,
    saveDashboard,
    deleteDashboard,
    refreshData,
  }
}
