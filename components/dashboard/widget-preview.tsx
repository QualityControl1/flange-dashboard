"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings, Gauge, Check, AlertTriangle } from "lucide-react"

interface WidgetPreviewProps {
  widget: any
  isActive?: boolean
  onClick?: () => void
}

export default function WidgetPreview({ widget, isActive, onClick }: WidgetPreviewProps) {
  const handleClick = () => {
    if (onClick) onClick()
  }

  return (
    <Card
      className={`overflow-hidden cursor-pointer transition-all ${isActive ? "ring-2 ring-primary" : "hover:border-primary/50"}`}
      onClick={handleClick}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4">{renderWidgetPreview(widget)}</CardContent>
    </Card>
  )
}

function renderWidgetPreview(widget: any) {
  switch (widget.type) {
    case "summary":
      return (
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold">123</div>
          {getWidgetIcon(widget.icon, widget.color)}
        </div>
      )

    case "bar":
      return (
        <div className="h-20 flex items-end justify-between gap-1">
          {[40, 70, 30, 60, 50].map((height, i) => (
            <div key={i} className="w-4 bg-primary/80" style={{ height: `${height}%` }}></div>
          ))}
        </div>
      )

    case "pie":
      return (
        <div className="flex justify-center">
          <div className="relative h-20 w-20">
            <svg viewBox="0 0 100 100">
              <path d="M 50 50 L 100 50 A 50 50 0 0 1 50 100 Z" fill="#3b82f6" />
              <path d="M 50 50 L 50 100 A 50 50 0 0 1 0 50 Z" fill="#22c55e" />
              <path d="M 50 50 L 0 50 A 50 50 0 0 1 50 0 Z" fill="#ef4444" />
              <path d="M 50 50 L 50 0 A 50 50 0 0 1 100 50 Z" fill="#eab308" />
              {widget.donut && <circle cx="50" cy="50" r="25" fill="white" />}
            </svg>
          </div>
        </div>
      )

    case "line":
      return (
        <div className="h-20 flex items-end">
          <svg viewBox="0 0 100 50" className="w-full h-full">
            <polyline points="0,50 20,35 40,40 60,20 80,25 100,10" fill="none" stroke="#3b82f6" strokeWidth="2" />
            <polyline points="0,45 20,40 40,30 60,35 80,15 100,20" fill="none" stroke="#22c55e" strokeWidth="2" />
          </svg>
        </div>
      )

    case "table":
      return (
        <div className="space-y-2">
          <div className="h-4 bg-muted/50 rounded w-full"></div>
          <div className="h-4 bg-muted/50 rounded w-full"></div>
          <div className="h-4 bg-muted/50 rounded w-full"></div>
          <div className="h-4 bg-muted/50 rounded w-3/4"></div>
        </div>
      )

    default:
      return <div className="h-20 flex items-center justify-center text-muted-foreground">Widget Preview</div>
  }
}

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
