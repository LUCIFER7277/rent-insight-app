import { connectMongo, disconnectMongo, col } from "./db/mongo.js";
import { OWNERS_SEED } from "../../frontend/src/referral-app/data/owners-seed.js";

async function run() {
  console.log("Connecting to MongoDB...");
  await connectMongo();
  console.log("Connected. Updating plain passwords...");

  const usersCol = col("users");
  let updated = 0;

  for (const owner of OWNERS_SEED) {
    const res = await usersCol.updateOne(
      { _id: owner.id },
      { $set: { plainPassword: owner.password } }
    );
    if (res.modifiedCount > 0) {
      updated++;
    }
  }

  console.log(`Updated ${updated} owners with plain passwords.`);
  await disconnectMongo();
  console.log("Done.");
}

run().catch((err) => {
  console.error("Update failed:", err);
  process.exit(1);
});
