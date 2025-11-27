const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    age: { type: Number },
    phone: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // hashed password
    role: { type: String, enum: ["citizen", "authority", "admin"], default: "citizen" },
    city: String,
    municipalityType: String,
    // Authority-specific fields
    department: { type: String }, // e.g., "Roads", "Water", "Sanitation", "Electricity"
    departmentLocation: {
      address: String,
      city: String,
      latitude: String,
      longitude: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
