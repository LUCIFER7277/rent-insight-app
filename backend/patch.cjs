const fs = require('fs');
const file = 'src/modules/owner/routes.ts';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('import { OWNERS_SEED }')) {
  code = code.replace(
    'import { PGS } from "../../../../frontend/src/referral-app/data/pgs-seed.js";',
    'import { PGS } from "../../../../frontend/src/referral-app/data/pgs-seed.js";\nimport { OWNERS_SEED } from "../../../../frontend/src/referral-app/data/owners-seed.js";'
  );
}

code = code.replace(
  /const LoginBody = z\.object\(\{\s*email: z\.string\(\)\.email\(\),\s*password: z\.string\(\)\.min\(1\),\s*\}\);/g,
  'const LoginBody = z.object({\n  username: z.string().min(1),\n  password: z.string().min(1),\n});'
);

code = code.replace(
  'const { email, password } = LoginBody.parse(req.body);',
  'const { username, password } = LoginBody.parse(req.body);'
);

code = code.replace(
  'const owner = await users.findOne({ email: email.trim().toLowerCase(), role: "owner" });',
  'const owner = await users.findOne({ username: username.trim().toLowerCase(), role: "owner" });'
);

const oldSeedBodyRegex = /\/\/ Group properties from PGS by unique manager contact details[\s\S]*?\/\/ Pre-seed some default properties\/rooms for mock owners if they don't exist/;

const newSeedBody = `// Seed owners from OWNERS_SEED
  for (const owner of OWNERS_SEED) {
    const exists = await usersCol.findOne({ username: owner.username });
    let ownerMongoId = owner.id;
    if (!exists) {
      const doc = {
        _id: ownerMongoId,
        username: owner.username.toLowerCase(),
        email: owner.email || \`\${owner.username}@gharpayy.com\`,
        phone: owner.phone,
        passwordHash: await argon2.hash(owner.password),
        fullName: owner.name,
        role: "owner",
        status: "active",
        zones: ["zone-1"],
        tenantId: defaultTenant,
        createdAt: now,
        updatedAt: now,
      };
      doc.propertyIds = owner.propertyIds;
      doc.isDedicated = true;
      doc.tier = "standard";
      await usersCol.insertOne(doc);
    } else {
      ownerMongoId = exists._id;
      await usersCol.updateOne(
        { username: owner.username.toLowerCase() },
        { $set: { 
            propertyIds: owner.propertyIds, 
            passwordHash: await argon2.hash(owner.password),
            updatedAt: now 
          } 
        }
      );
    }

    const ownerPgs = PGS.filter(pg => owner.propertyIds.includes(pg.id));
    for (const pg of ownerPgs) {
      const propExists = await propertiesCol.findOne({ _id: pg.id });
      const basePrice = pg.prices.single || pg.prices.double || pg.prices.triple || 12000;
      
      const propDoc = {
        _id: pg.id,
        customId: pg.id,
        tenantId: defaultTenant,
        ownerId: ownerMongoId,
        ownerName: owner.name,
        name: pg.name,
        area: pg.area,
        address: pg.locality || pg.area,
        basePrice: basePrice,
        pricePerBed: basePrice,
        foodRating: 4,
        hygieneRating: 4,
        amenities: pg.amenities || [],
        photos: [
          "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80"
        ],
        description: pg.usp || "Premium co-living facility.",
        gateRules: pg.rules || "Curfew rules apply",
        securityInfo: pg.safety?.join(", ") || "CCTV",
        propertyType: "pg",
        genderCategory: pg.gender,
        sharingTypes: pg.rooms?.split(", ") || [],
        flatConfig: "studio",
        pageViews: 0,
        shares: 0,
        photoCount: 1,
        createdAt: now,
        updatedAt: now,
        zoneId: "zone-1",
        totalBeds: 6,
        vacantBeds: 5,
      };

      if (!propExists) {
        await propertiesCol.insertOne(propDoc);
      } else {
        await propertiesCol.updateOne(
          { _id: pg.id },
          { $set: { ownerId: ownerMongoId, ownerName: owner.name, name: pg.name, area: pg.area, basePrice, totalBeds: 6, vacantBeds: 5 } }
        );
      }

      // Seed 3 rooms (single, double, triple)
      const roomTypes = ["single", "double", "triple"];
      for (let rIdx = 0; rIdx < roomTypes.length; rIdx++) {
        const type = roomTypes[rIdx];
        const bedsTotal = type === "single" ? 1 : type === "double" ? 2 : 3;
        const roomId = \`r-\${pg.id}-\${type}\`;
        const roomExists = await roomsCol.findOne({ _id: roomId });
        if (!roomExists) {
          await roomsCol.insertOne({
            _id: roomId,
            customId: roomId,
            propertyId: pg.id,
            type,
            bedsTotal,
            bedsOccupied: rIdx === 0 ? 1 : 0,
            currentPrice: pg.prices[type] || basePrice,
          });

          await roomStatusesCol.insertOne({
            roomId,
            propertyId: pg.id,
            ownerId: ownerMongoId,
            kind: rIdx === 0 ? "occupied" : "vacant",
            rentConfirmed: pg.prices[type] || basePrice,
            floorPrice: Math.round((pg.prices[type] || basePrice) * 0.9),
            actualRent: pg.prices[type] || basePrice,
            expectedRent: pg.prices[type] || basePrice,
            lowestAcceptableRent: Math.round((pg.prices[type] || basePrice) * 0.9),
            updatedAt: now,
            verifiedToday: true,
            lockedUnsellable: false,
            isDedicated: rIdx === 1,
            views: 5 * rIdx,
          });
        }
      }
    }
  }

  // Pre-seed some default properties/rooms for mock owners if they don't exist`;

code = code.replace(oldSeedBodyRegex, newSeedBody);

fs.writeFileSync(file, code);
console.log('Patch complete!');
