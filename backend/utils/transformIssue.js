/**
 * Transform MongoDB issue to web portal format
 */
function transformIssueForWebPortal(issue) {
  const statusMap = {
    Pending: "NEW",
    Acknowledged: "ACKNOWLEDGED",
    "In Progress": "IN_PROGRESS",
    Resolved: "RESOLVED",
  };

  const categoryMap = {
    Roads: "POTHOLES",
    Water: "WATER",
    Sanitation: "GARBAGE",
    Electricity: "STREETLIGHTS",
    Other: "OTHER",
  };

  const now = new Date();
  const createdAt = new Date(issue.createdAt);
  const ageInHours = Math.floor((now - createdAt) / (1000 * 60 * 60));

  return {
    id: issue._id.toString(),
    title: issue.description.substring(0, 50) + (issue.description.length > 50 ? "..." : ""),
    description: issue.description,
    category: issue.category || "Other", // Keep original category name for display
    categoryCode: categoryMap[issue.category] || "OTHER", // For filtering
    status: issue.status || "Pending", // Keep original status for display
    statusCode: statusMap[issue.status] || "NEW", // For filtering
    location: {
      address: issue.location?.address || "Address not provided",
      ward: issue.location?.ward || "N/A",
      city: issue.location?.city || "N/A",
      lat: parseFloat(issue.location?.latitude) || 0,
      lng: parseFloat(issue.location?.longitude) || 0,
    },
    reporter: {
      name: issue.user?.name || "Unknown",
      phone: issue.user?.phone || "N/A",
    },
    user: issue.user ? {
      name: issue.user.name,
      email: issue.user.email,
      phone: issue.user.phone,
    } : undefined,
    assignedTo: issue.assignedDepartment
      ? {
          department: issue.assignedDepartment,
          officerName: issue.assignedOfficerName || "Not assigned",
        }
      : undefined,
    images: issue.media?.filter((m) => m.type === "image").map((m) => m.url) || [],
    videos: issue.media?.filter((m) => m.type === "video").map((m) => m.url) || [],
    media: issue.media?.map((m) => ({ url: m.url, type: m.type })) || [],
    reportedDate: issue.createdAt,
    updatedDate: issue.updatedAt,
    history: issue.timeline?.map((entry) => ({
      timestamp: entry.timestamp,
      status: statusMap[entry.status] || entry.status || "NEW",
      updatedBy: "System",
      department: issue.assignedDepartment || "N/A",
      notes: entry.note,
    })) || [],
    slaBreached: ageInHours > 48 && issue.status !== "Resolved",
    ageInHours,
    rating: issue.rating || null,
    priority: issue.priority || "Medium",
  };
}

module.exports = { transformIssueForWebPortal };


