const mongoose = require("mongoose");
require("dotenv").config();

const ThriftFundEntry = require("../models/ThriftFundEntry");
const ThriftFundWithdrawal = require("../models/ThriftFundWithdrawal");

const MONGO_URI = process.env.MONGO_URI;

const migrate = async () => {
  try {
    await mongoose.connect(MONGO_URI);

    console.log("MongoDB connected");

    // Thrift Fund Entry
    const entryResult = await ThriftFundEntry.updateMany(
      { particular: { $exists: false } },
      {
        $set: {
          particular: "By Installement",
        },
      }
    );

    console.log(
      `ThriftFundEntry updated: ${entryResult.modifiedCount}`
    );

    // Thrift Fund Withdrawal
    const withdrawalResult =
      await ThriftFundWithdrawal.updateMany(
        { particular: { $exists: false } },
        {
          $set: {
            particular: "Balance refund to member",
          },
        }
      );

    console.log(
      `ThriftFundWithdrawal updated: ${withdrawalResult.modifiedCount}`
    );

    console.log("Migration completed successfully");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);

    await mongoose.connection.close();
    process.exit(1);
  }
};

migrate();