const express = require("express");
const router = express.Router();
const Service = require("../models/Service");
const { moveToTrash } = require("../utils/trash");

// Get all services for a region
router.get("/", async (req, res) => {
  try {
    const { region } = req.query;
    const filter = region ? { region } : {};
    // Sort by updatedAt desc to get newest first
    const services = await Service.find(filter).sort({ updatedAt: -1 });

    // Deduplicate by trimmed name
    const uniqueServices = [];
    const seenNames = new Set();

    services.forEach((s) => {
      const trimmedName = s.name.trim();
      if (!seenNames.has(trimmedName)) {
        seenNames.add(trimmedName);
        uniqueServices.push(s);
      }
    });

    res.json(uniqueServices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create or update a service
router.post("/", async (req, res) => {
  try {
    const { _id, name, region, rate, type, category, description, bullets } =
      req.body;
    const trimmedName = name?.trim();
    const bulletList = Array.isArray(bullets)
      ? bullets.filter((b) => b && b.trim())
      : undefined;

    let service;

    // If a valid MongoDB _id is provided, update that specific record (prevents duplicates on rename)
    if (_id && _id.match(/^[0-9a-fA-F]{24}$/)) {
      const updateFields = {
        name: trimmedName,
        rate,
        type,
        category,
        description,
        region,
        updatedAt: Date.now(),
      };
      if (bulletList !== undefined) updateFields.bullets = bulletList;
      service = await Service.findByIdAndUpdate(_id, updateFields, {
        new: true,
      });
    }

    // Fallback: find existing by name+region or create new
    if (!service) {
      const updateFields = {
        rate,
        type,
        category,
        description,
        updatedAt: Date.now(),
      };
      if (bulletList !== undefined) updateFields.bullets = bulletList;
      service = await Service.findOneAndUpdate(
        { name: trimmedName, region },
        updateFields,
        { new: true, upsert: true },
      );
    }

    res.status(201).json(service);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a service by ID
router.put("/:id", async (req, res) => {
  try {
    const {
      name,
      region,
      rate,
      type,
      category,
      description,
      bullets,
      workerHourlyRate,
      workerPaymentRate,
    } = req.body;

    // Only update fields that are explicitly provided
    const updateFields = { updatedAt: Date.now() };

    // Only add fields if they're in the request body
    if (name !== undefined) updateFields.name = name;
    if (region !== undefined) updateFields.region = region;
    if (rate !== undefined) updateFields.rate = rate;
    if (type !== undefined) updateFields.type = type;
    if (category !== undefined) updateFields.category = category;
    if (description !== undefined) updateFields.description = description;
    if (Array.isArray(bullets))
      updateFields.bullets = bullets.filter((b) => b && b.trim());
    if (workerHourlyRate !== undefined)
      updateFields.workerHourlyRate = workerHourlyRate;
    if (workerPaymentRate !== undefined)
      updateFields.workerPaymentRate = workerPaymentRate;

    const service = await Service.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true },
    );
    if (!service) return res.status(404).json({ message: "Service not found" });

    // Sync updated rate to pending/assigned bookings so workers see the new rate instantly
    if (workerHourlyRate !== undefined || workerPaymentRate !== undefined) {
      try {
        const Booking = require("../models/Booking");
        const newRate = service.type === "hourly" ? service.workerHourlyRate : service.workerPaymentRate;
        
        const updateResult = await Booking.updateMany(
          { 
            service: service.name, 
            status: { $nin: ["Completed", "Cancelled"] } 
          },
          { $set: { workerRate: newRate || 0 } }
        );
        console.log(`✅ Synced new rate (£${newRate}) to ${updateResult.modifiedCount} pending bookings for ${service.name}`);
      } catch (syncErr) {
        console.error("⚠️ Failed to sync rate to pending bookings:", syncErr);
      }
    }

    console.log(
      `✅ Updated service ${service.name}: hourlyRate=${service.workerHourlyRate}`,
    );
    res.json(service);
  } catch (err) {
    console.error("Error updating service:", err);
    res.status(400).json({ message: err.message });
  }
});

// Cleanup: remove duplicate services (keep newest per name+region)
router.post("/cleanup-duplicates", async (req, res) => {
  try {
    const all = await Service.find({}).sort({ updatedAt: -1 });
    const seen = new Set();
    const toDelete = [];

    all.forEach((s) => {
      const key = `${s.name.trim().toLowerCase()}__${s.region}`;
      if (seen.has(key)) {
        toDelete.push(s._id);
      } else {
        seen.add(key);
      }
    });

    if (toDelete.length > 0) {
      await Service.deleteMany({ _id: { $in: toDelete } });
    }

    res.json({
      message: `Cleaned up ${toDelete.length} duplicate(s).`,
      removed: toDelete.length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Migrate Categories (One-time use)
router.post("/migrate-categories", async (req, res) => {
  try {
    const services = await Service.find({});
    const clean = (str) =>
      str
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .trim();
    const baseNames = [
      "Residential Cleaning",
      "Deep Clean",
      "Airbnb Cleaning",
      "Office Cleaning",
      "End of Tenancy",
    ];
    const roomNames = [
      "Bedroom",
      "Bathroom",
      "Cloakroom",
      "Kitchen",
      "Utility Room",
      "Reception Room",
      "Conservatory",
    ];

    let updated = 0;
    for (let s of services) {
      let cat = "Extras";
      if (baseNames.some((b) => clean(b) === clean(s.name))) cat = "Base";
      else if (roomNames.some((r) => clean(r) === clean(s.name))) cat = "Rooms";

      await Service.updateOne({ _id: s._id }, { $set: { category: cat } });
      updated++;
    }

    res.json({ message: `Migrated ${updated} services successfully.` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete a service
router.delete("/:id", async (req, res) => {
  try {
    // Safety check to prevent 500 CastError on invalid ObjectIds
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.json({ message: "Fallback pseudo-service ignored" });
    }

    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: "Service not found" });
    await moveToTrash("Service", service, service.name);
    await service.deleteOne();
    res.json({ message: "Service deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
