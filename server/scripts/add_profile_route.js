// Append this at the end of workers.js before module.exports
const fs = require('fs');
const path = require('path');
const workersJsPath = path.join(__dirname, '..', 'routes', 'workers.js');

let content = fs.readFileSync(workersJsPath, 'utf8');

const newRoute = `
// PUT update worker profile (bank details, personal info)
router.put('/:id/profile', async (req, res) => {
  try {
    const { id } = req.params;
    const { phone, bankDetails } = req.body;
    
    const worker = await Worker.findById(id);
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    if (phone) worker.phone = phone;
    if (bankDetails) {
      worker.bankDetails = {
        ...worker.bankDetails,
        ...bankDetails
      };
    }

    await worker.save();
    
    // Create notification
    await Notification.create({
      workerId: worker._id,
      title: "Profile Updated",
      message: "Your profile and bank details have been successfully updated.",
      type: "success"
    });

    res.json(worker);
  } catch (error) {
    console.error('Error updating worker profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

`;

content = content.replace('module.exports = router;', newRoute + 'module.exports = router;');
fs.writeFileSync(workersJsPath, content);
console.log("Successfully appended PUT /:id/profile to workers.js");
