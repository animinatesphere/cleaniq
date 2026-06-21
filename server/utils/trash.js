const Trash = require("../models/Trash");

// Snapshot a document into the Bin before it's permanently deleted, so it
// can be restored later from the admin Bin page.
async function moveToTrash(entityType, doc, label) {
  if (!doc) return;
  const data = typeof doc.toObject === "function" ? doc.toObject() : doc;
  await Trash.create({
    entityType,
    originalId: String(data._id),
    label: label || "",
    data,
  });
}

module.exports = { moveToTrash };
