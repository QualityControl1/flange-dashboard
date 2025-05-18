import { NextResponse } from "next/server"

// Mock data based on the schema provided
const generateMockFlangeData = (count = 500) => {
  const data = []

  for (let i = 0; i < count; i++) {
    const jobNumbers = ["81148-", "999999", "75432-", "88123-"]
    const flangeTypes = ["RFWN", "RFSW", "RFBL", "RFTJ", null]
    const flangeSizes = ["6.000", "8.000", "10.000", "12.000", "16.000", null]
    const flangeRatings = ["150", "300", "600", null]
    const flangeMaterials = ["CS", "SS", "AL", null]
    const gasketTypes = ["SPIRAL WOUND", "RING", "FLAT", null]
    const gasketMaterials = ["304SS", "316SS", "GRAPHITE", null]
    const systems = ["CA1-030", "CA1-031", "HY-CB-0262", "Test System", "Main System"]
    const statuses = ["Completed", "In Progress", "Not Started", "Delayed", "On Hold"]
    const clients = ["OCI Clean Ammonia LLC", "Test", "Client A", "Client B"]

    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const percentComplete =
      status === "Completed" ? 100 : status === "Not Started" ? 0 : Math.floor(Math.random() * 90) + 5

    data.push({
      id: i + 1,
      job: jobNumbers[Math.floor(Math.random() * jobNumbers.length)],
      job_number: jobNumbers[Math.floor(Math.random() * jobNumbers.length)],
      drawing_id:
        Math.random() > 0.3 ? `${Math.floor(Math.random() * 999)}-${Math.random().toString(36).substring(2, 7)}` : null,
      flange_number: Math.floor(Math.random() * 5000) + 1,
      flange_type: flangeTypes[Math.floor(Math.random() * flangeTypes.length)],
      flange_size: flangeSizes[Math.floor(Math.random() * flangeSizes.length)],
      flange_rating: flangeRatings[Math.floor(Math.random() * flangeRatings.length)],
      flange_material: flangeMaterials[Math.floor(Math.random() * flangeMaterials.length)],
      gasket_type: gasketTypes[Math.floor(Math.random() * gasketTypes.length)],
      gasket_material: gasketMaterials[Math.floor(Math.random() * gasketMaterials.length)],
      created_at: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
      created_by: ["cmccall", "test", "user1", "user2"][Math.floor(Math.random() * 4)],
      updated_at: new Date(Date.now() - Math.floor(Math.random() * 10) * 24 * 60 * 60 * 1000).toISOString(),
      updated_by: ["cmccall", "test", "user1", "user2"][Math.floor(Math.random() * 4)],
      primary_scope: Math.random() > 0.5 ? "TCM" : null,
      system_no: systems[Math.floor(Math.random() * systems.length)],
      system: systems[Math.floor(Math.random() * systems.length)],
      client: clients[Math.floor(Math.random() * clients.length)],

      // Additional fields for dashboard functionality
      status,
      percent_complete: percentComplete,
      inspection_status: ["Passed", "Failed", "Pending", "Not Inspected"][Math.floor(Math.random() * 4)],
      inspection_date:
        Math.random() > 0.5
          ? new Date(Date.now() - Math.floor(Math.random() * 20) * 24 * 60 * 60 * 1000).toISOString()
          : null,
      line_number: Math.random() > 0.3 ? `LINE-${Math.floor(Math.random() * 999)}` : null,
    })
  }

  return data
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = searchParams.get("limit") ? Number.parseInt(searchParams.get("limit") as string) : 100

  // Simulate database query delay
  await new Promise((resolve) => setTimeout(resolve, 300))

  try {
    const data = generateMockFlangeData(limit)

    return NextResponse.json({
      success: true,
      data,
      count: data.length,
    })
  } catch (error) {
    console.error("Error fetching flange data:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch flange data" }, { status: 500 })
  }
}
