const mongoose = require("mongoose");

const IssueSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    description: { type: String, required: true },
    category: { type: String, required: true },
    priority: { type: String, enum: ["High", "Medium", "Low"], required: true },

    location: {
      latitude: String,
      longitude: String,
      address: String,
    },

    media: [
      {
        url: String,
        type: { type: String }, // "image" or "video"
      },
    ],

    status: {
      type: String,
      enum: ["Pending", "Acknowledged", "In Progress", "Resolved"],
      default: "Pending",
    },

    timeline: [
      {
        status: String,
        timestamp: Date,
        note: String,
      },
    ],

    assignedDepartment: String,
    assignedOfficerName: String,
    assignedTo: {
      authority: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      assignedAt: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Issue", IssueSchema);
