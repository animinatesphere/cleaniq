const mongoose = require("mongoose");
require("dotenv").config({ path: "../.env" });

const Booking = require("../models/Booking");
const Worker = require("../models/Worker");
const Withdrawal = require("../models/Withdrawal");

async function fixMissingWithdrawals() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to DB");

  // Find all completed bookings
  const completedBookings = await Booking.find({ status: "Completed" });
  let fixed = 0;

  for (const booking of completedBookings) {
    if (!booking.assignedWorker) continue;

    // Check if this booking is already in any withdrawal
    const existing = await Withdrawal.findOne({
      "completedJobs.bookingId": booking.bookingId,
    });

    if (!existing) {
      console.log(`Missing withdrawal for booking: ${booking.bookingId}`);
      
      const worker = await Worker.findById(booking.assignedWorker);
      if (!worker) continue;

      const workerEarnings =
        (booking.workerRate || 0) *
        (booking.details?.duration || booking.workerDuration || booking.duration || 0);

      if (workerEarnings > 0) {
        const expectedPayoutDate = new Date(booking.jobEndTime || booking.updatedAt);
        expectedPayoutDate.setDate(expectedPayoutDate.getDate() + 8);
        expectedPayoutDate.setHours(0, 0, 0, 0);

        const jobRecord = {
          bookingId: booking.bookingId,
          service: booking.service,
          amount: workerEarnings,
          completedDate: booking.jobEndTime || booking.updatedAt,
        };

        const withdrawal = new Withdrawal({
          workerId: worker._id,
          workerName: `${worker.firstName} ${worker.lastName}`,
          workerEmail: worker.email,
          workerPhone: worker.phone,
          workerAddress: worker.address,
          workerPostcode: worker.postcode,
          amount: workerEarnings,
          completedJobs: [jobRecord],
          bankDetails: {
            accountName: worker.bankDetails?.accountName || "Pending Setup",
            accountNumber: worker.bankDetails?.accountNumber || "Pending Setup",
            sortCode: worker.bankDetails?.sortCode || "Pending Setup",
            bankName: worker.bankDetails?.bankName || "Pending Setup",
          },
          status: "pending",
          payoutType: "fixed_8days",
          expectedPayoutDate,
        });

        await withdrawal.save();
        
        // Ensure wallet onHold is correct
        worker.wallet = worker.wallet || { totalEarned: 0, balance: 0, onHold: 0, withdrawn: 0 };
        worker.wallet.onHold = (worker.wallet.onHold || 0) + workerEarnings;
        await worker.save();
        
        console.log(`Created missing withdrawal for ${booking.bookingId}`);
        fixed++;
      }
    }
  }

  console.log(`Fixed ${fixed} missing withdrawals.`);
  process.exit(0);
}

fixMissingWithdrawals();
