import { connectMongo, disconnectMongo, col } from "./db/mongo.js";
import { OWNERS_SEED } from "../../frontend/src/referral-app/data/owners-seed.js";
import { PGS } from "../../frontend/src/referral-app/data/pgs-seed.js";
import { ulid } from "./contracts/ids.js";
import { hash } from "argon2";

const TENANT_ID = "gharpayy";

async function run() {
  console.log("Connecting to MongoDB...");
  const db = await connectMongo();
  console.log("Connected.");

  console.log(`Found ${OWNERS_SEED.length} owners and ${PGS.length} PGs to seed.`);

  // 1. Insert Owners into users collection
  const usersCol = col("users");
  let ownersInserted = 0;

  for (const owner of OWNERS_SEED) {
    const existing = await usersCol.findOne({ tenantId: TENANT_ID, email: `${owner.username}@gharpayy.internal` });
    if (!existing) {
      const passwordHash = await hash(owner.password);
      await usersCol.insertOne({
        _id: owner.id, // using their mock id as user _id
        tenantId: TENANT_ID,
        email: `${owner.username}@gharpayy.internal`,
        username: owner.username,
        fullName: owner.name,
        phone: owner.phone,
        passwordHash,
        role: owner.role.toLowerCase() === "manager" ? "manager" : "owner",
        propertyIds: owner.propertyIds,
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      ownersInserted++;
    }
  }

  console.log(`Inserted ${ownersInserted} owners.`);

  // 2. Insert PGs into properties collection
  const propertiesCol = col("properties");
  let propsInserted = 0;

  for (const pg of PGS) {
    const existing = await propertiesCol.findOne({ tenantId: TENANT_ID, _id: pg.id });
    if (!existing) {
      // Find the owner associated with this property if any
      const owner = OWNERS_SEED.find(o => o.propertyIds.includes(pg.id));
      
      const totalBeds = parseInt(pg.rooms?.match(/(\d+)/)?.[1] || "12");
      const minPrice = pg.prices?.min || pg.prices?.single || pg.prices?.double || pg.prices?.triple || 0;
      
      const doc = {
        _id: pg.id,
        tenantId: TENANT_ID,
        ownerId: owner?.id || null,
        ownerName: owner?.name || pg.owner?.name || null,
        name: pg.name,
        area: pg.area,
        address: pg.locality,
        totalBeds: totalBeds,
        vacantBeds: Math.max(1, [pg.prices?.single, pg.prices?.double, pg.prices?.triple].filter(v => v > 0).length),
        pricePerBed: minPrice,
        basePrice: minPrice,
        zoneId: "z-seed",
        amenities: pg.amenities || [],
        description: pg.furnishing || "",
        gateRules: pg.rules || "",
        securityInfo: pg.safety?.join(", ") || "",
        propertyType: "PG",
        genderCategory: pg.gender,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await propertiesCol.insertOne(doc);
      propsInserted++;
    }
  }

  console.log(`Inserted ${propsInserted} properties.`);

  await disconnectMongo();
  console.log("Done.");
}

run().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
