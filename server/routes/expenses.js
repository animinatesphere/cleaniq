const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const Expense = require("../models/Expense");
const { moveToTrash } = require("../utils/trash");

const receiptsDir = path.join(__dirname, "../uploads/receipts");
fs.mkdirSync(receiptsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, receiptsDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = ["image/jpeg", "image/png", "application/pdf"].includes(file.mimetype);
    cb(ok ? null : new Error("Only JPG, PNG and PDF files are allowed"), ok);
  },
});

// GET /api/expenses?from=&to=&category= — list expenses, newest first
router.get("/", async (req, res) => {
  try {
    const { from, to, category } = req.query;
    const filter = {};
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }
    if (category && category !== "all") filter.category = category;

    const expenses = await Expense.find(filter).sort({ date: -1 });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/expenses/stats — totals for this month, this year, and by category
router.get("/stats", async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const all = await Expense.find({});
    const thisMonth = all
      .filter((e) => new Date(e.date) >= startOfMonth)
      .reduce((s, e) => s + e.amount, 0);
    const thisYear = all
      .filter((e) => new Date(e.date) >= startOfYear)
      .reduce((s, e) => s + e.amount, 0);
    const allTime = all.reduce((s, e) => s + e.amount, 0);

    const byCategory = {};
    all.forEach((e) => {
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
    });

    res.json({ thisMonth, thisYear, allTime, byCategory });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/expenses — log a new expense (supports optional receipt file)
router.post("/", upload.single("receipt"), async (req, res) => {
  try {
    const data = { ...req.body, amount: Number(req.body.amount) };
    if (req.file) data.receiptUrl = `/uploads/receipts/${req.file.filename}`;
    const expense = new Expense(data);
    await expense.save();
    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/expenses/:id — edit an expense (supports optional receipt file)
router.put("/:id", upload.single("receipt"), async (req, res) => {
  try {
    const data = { ...req.body, amount: Number(req.body.amount) };
    if (req.file) data.receiptUrl = `/uploads/receipts/${req.file.filename}`;
    const expense = await Expense.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!expense) return res.status(404).json({ message: "Expense not found" });
    res.json(expense);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/expenses/:id — move to bin (recoverable for 30 days)
router.delete("/:id", async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: "Expense not found" });
    await moveToTrash(
      "Expense",
      expense,
      `${expense.description} — £${expense.amount}`,
    );
    await expense.deleteOne();
    res.json({ message: "Expense deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
