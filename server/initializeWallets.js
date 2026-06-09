const mongoose = require("mongoose");
const Worker = require("./models/Worker");

const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/cleaniq";

async function initializeWallets() {
  try {
    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");

    // Find all workers without wallet data
    const workersWithoutWallet = await Worker.find({
      $or: [{ wallet: { $exists: false } }, { wallet: null }],
    });

    console.log(
      `\n📊 Found ${workersWithoutWallet.length} workers without wallet data`,
    );

    if (workersWithoutWallet.length === 0) {
      console.log("✅ All workers already have wallet data initialized!");
      await mongoose.disconnect();
      return;
    }

    // Initialize wallet for each worker
    let updated = 0;
    for (const worker of workersWithoutWallet) {
      worker.wallet = {
        totalEarned: 0,
        balance: 0,
        onHold: 0,
        withdrawn: 0,
        lastUpdated: new Date(),
      };
      await worker.save();
      updated++;
      console.log(
        `✅ Initialized wallet for: ${worker.firstName} ${worker.lastName} (${worker.workerId})`,
      );
    }

    console.log(
      `\n✅ Successfully initialized ${updated} workers with wallet data!`,
    );
    await mongoose.disconnect();
  } catch (error) {
    console.error("❌ Error initializing wallets:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

initializeWallets();
