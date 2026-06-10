const express = require("express");
const router = express.Router();

// Placeholder properties routes
// This module can be expanded later for property management

router.get("/", (req, res) => {
  res.json({ message: "Properties API - placeholder" });
});

module.exports = router;
