const mongoose = require("mongoose");

const orgPositionSchema = new mongoose.Schema({
  name: { type: String, default: "Vacant" }, // person's name, or "Vacant" if unfilled
  title: { type: String, required: true }, // job title / role, e.g. "Operations Manager"
  department: { type: String, default: "" },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "OrgPosition",
    default: null,
  },
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("OrgPosition", orgPositionSchema);
