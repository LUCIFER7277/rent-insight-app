import type { FastifyInstance } from "fastify";
import { z } from "zod";
import crypto from "node:crypto";
import argon2 from "argon2";
import { col } from "../../db/mongo.js";
import { requireAuth } from "../../middleware/auth.js";
import { signAccessToken, buildClaims, type UserDoc } from "../../auth/auth.js";
import { env } from "../../config/env.js";
import { PGS } from "../../../../frontend/src/referral-app/data/pgs-seed.js";
import { OWNERS_SEED } from "../../../../frontend/src/referral-app/data/owners-seed.js";


// Schemas & Types
const LoginBody = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const RoomStatusFields = z.object({
  kind: z.enum(["occupied", "vacating", "vacant", "blocked"]),
  rentConfirmed: z.number().optional(),
  floorPrice: z.number().optional(),
  vacatingDate: z.string().optional(),
  notes: z.string().optional(),
  actualRent: z.number().optional(),
  expectedRent: z.number().optional(),
  lowestAcceptableRent: z.number().optional(),
  // Readiness fields
  commercial: z.string().optional(),
  operational: z.string().optional(),
  turnaround: z.string().optional(),
  reason: z.string().optional(),
  availableFrom: z.string().optional(),
  // USP fields
  uspSize: z.string().optional(),
  uspVentilation: z.string().optional(),
  uspWindow: z.string().optional(),
  uspSunlight: z.string().optional(),
  uspView: z.string().optional(),
  uspWashroom: z.string().optional(),
  uspNoise: z.string().optional(),
  uspPosition: z.string().optional(),
  uspFurniture: z.string().optional(),
});

// Seed function to ensure mock owners and their properties exist in the DB
export async function seedOwnersAndProperties() {
  const usersCol = col<UserDoc>("users");
  const propertiesCol = col<any>("properties");
  const roomsCol = col<any>("rooms");
  const roomStatusesCol = col<any>("room_statuses");

  const defaultTenant = env.DEFAULT_TENANT || "t-gharpayy";
  const passwordHash = await argon2.hash("Password123");
  const now = new Date().toISOString();

  // Helper to generate deterministic credentials
  function getSeededCredentials(name: string, phone: string, index: number) {
    const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, "");
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    let email = "";
    if (cleanName && !["nil", "unknown", "-"].includes(cleanName)) {
      email = `${cleanName}_${cleanPhone || index}@gharpayy.com`;
    } else if (cleanPhone) {
      email = `owner_${cleanPhone}@gharpayy.com`;
    } else {
      email = `owner_unknown_${index}@gharpayy.com`;
    }
    return {
      email,
      password: "Password123"
    };
  }

  // Pre-seed the legacy mock owners first
  const mockOwners = [
    { id: "own-1", username: "rakesh@propertyplay.com", email: "rakesh@propertyplay.com", fullName: "Rakesh Sharma", phone: "+919876543210", propertyIds: ["p-koramangala-1"], isDedicated: true, tier: "priority" as const },
    { id: "own-2", username: "meera@propertyplay.com", email: "meera@propertyplay.com", fullName: "Meera Iyer", phone: "+919812345678", propertyIds: ["p-indiranagar-1"], isDedicated: true, tier: "standard" as const },
    { id: "own-3", username: "ankit@propertyplay.com", email: "ankit@propertyplay.com", fullName: "Ankit Verma", phone: "+919900112233", propertyIds: ["p-hsr-1"], isDedicated: false, tier: "throttled" as const },
    { id: "own-4", username: "deepa@propertyplay.com", email: "deepa@propertyplay.com", fullName: "Deepa Krishnan", phone: "+919876501122", propertyIds: ["p-whitefield-1"], isDedicated: true, tier: "priority" as const },
  ];

  for (const owner of mockOwners) {
    const exists = await usersCol.findOne({ email: owner.email });
    const mongoId = `mock-own-${owner.id}`;
    if (!exists) {
      const doc: UserDoc = {
        _id: mongoId,
        username: owner.username,
        email: owner.email,
        phone: owner.phone,
        passwordHash,
        fullName: owner.fullName,
        role: "owner",
        status: "active",
        zones: ["zone-1"],
        tenantId: defaultTenant,
        createdAt: now,
        updatedAt: now,
      };
      (doc as any).propertyIds = owner.propertyIds;
      (doc as any).isDedicated = owner.isDedicated;
      (doc as any).tier = owner.tier;
      await usersCol.insertOne(doc);
    }
  }

  // Seed owners from OWNERS_SEED
  for (const owner of OWNERS_SEED) {
    const exists = await usersCol.findOne({ username: owner.username });
    let ownerMongoId = owner.id;
    if (!exists) {
      const doc = {
        _id: ownerMongoId,
        username: owner.username.toLowerCase(),
        email: owner.email || `${owner.username}@gharpayy.com`,
        phone: owner.phone,
        passwordHash: await argon2.hash(owner.password),
        fullName: owner.name,
        role: "owner" as import("../../contracts/roles.ts").TopRole,
        status: "active" as import("../../contracts/roles.ts").UserStatus,
        zones: ["zone-1"],
        tenantId: defaultTenant,
        createdAt: now,
        updatedAt: now,
      };
      (doc as any).propertyIds = owner.propertyIds;
      (doc as any).isDedicated = true;
      (doc as any).tier = "standard";
      try {
        await usersCol.insertOne(doc);
      } catch (err: any) {
        if (err.code !== 11000) throw err;
      }
    } else {
      ownerMongoId = exists._id;
      await usersCol.updateOne(
        { username: owner.username.toLowerCase() },
        {
          $set: {
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
        const roomId = `r-${pg.id}-${type}`;
        const roomExists = await roomsCol.findOne({ _id: roomId });
        if (!roomExists) {
          await roomsCol.insertOne({
            _id: roomId,
            customId: roomId,
            propertyId: pg.id,
            type,
            bedsTotal,
            bedsOccupied: rIdx === 0 ? 1 : 0,
            currentPrice: (pg.prices as any)[type] || basePrice,
          });

          await roomStatusesCol.insertOne({
            roomId,
            propertyId: pg.id,
            ownerId: ownerMongoId,
            kind: rIdx === 0 ? "occupied" : "vacant",
            rentConfirmed: (pg.prices as any)[type] || basePrice,
            floorPrice: Math.round(((pg.prices as any)[type] || basePrice) * 0.9),
            actualRent: (pg.prices as any)[type] || basePrice,
            expectedRent: (pg.prices as any)[type] || basePrice,
            lowestAcceptableRent: Math.round(((pg.prices as any)[type] || basePrice) * 0.9),
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

  // Pre-seed some default properties/rooms for mock owners if they don't exist
  const mockProperties = [
    { id: "p-koramangala-1", ownerId: "mock-own-own-1", ownerName: "Rakesh Sharma", name: "Tranquil Nest Koramangala", area: "Koramangala", address: "12th Main, Koramangala 4th Block, Bengaluru, Karnataka 560034", basePrice: 15000 },
    { id: "p-indiranagar-1", ownerId: "mock-own-own-2", ownerName: "Meera Iyer", name: "Meera Oasis Indiranagar", area: "Indiranagar", address: "100 Feet Road, Indiranagar", basePrice: 18000 },
    { id: "p-hsr-1", ownerId: "mock-own-own-3", ownerName: "Ankit Verma", name: "HSR Elite Residency", area: "HSR Layout", address: "Sector 3, HSR Layout", basePrice: 12000 },
    { id: "p-whitefield-1", ownerId: "mock-own-own-4", ownerName: "Deepa Krishnan", name: "Whitefield Manor", area: "Whitefield", address: "ITPL Main Road, Whitefield", basePrice: 16000 },
  ];

  for (const prop of mockProperties) {
    if (prop.id === "p-koramangala-1") {
      await propertiesCol.deleteOne({ _id: prop.id });
      await roomsCol.deleteMany({ propertyId: prop.id });
      await roomStatusesCol.deleteMany({ propertyId: prop.id });
    }
    const exists = await propertiesCol.findOne({ _id: prop.id });
    if (!exists) {
      if (prop.id === "p-koramangala-1") {
        await propertiesCol.insertOne({
          _id: prop.id,
          customId: prop.id,
          tenantId: defaultTenant,
          ownerId: prop.ownerId,
          ownerName: prop.ownerName,
          name: prop.name,
          area: prop.area,
          address: prop.address,
          basePrice: prop.basePrice,
          pricePerBed: prop.basePrice,
          foodRating: 4,
          hygieneRating: 4,
          amenities: ["WiFi", "Laundry", "AC", "Daily housekeeping"],
          photos: [
            "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80"
          ],
          description: "Premium co-living facility designed for young professionals. High comfort, regular cleaning, healthy home-style meals, and a vibrant community.",
          gateRules: "Gate curfew at 11:30 PM",
          securityInfo: "24/7 guard, biometric gate",
          propertyType: "pg",
          pgSubtype: "Co-living Space",
          genderCategory: "Co-live (Mixed / Any)",
          sharingTypes: ["Single Sharing", "Double Sharing"],
          flatConfig: "studio",
          pageViews: 124,
          shares: 12,
          photoCount: 2,
          createdAt: now,
          updatedAt: now,
          zoneId: "zone-1",
          totalBeds: 6,
          vacantBeds: 5,
        });

        const roomsToSeed = [
          { roomId: "r-koramangala-1", type: "single", bedsTotal: 1, bedsOccupied: 1, kind: "occupied", views: 12, isDedicated: false },
          { roomId: "r-koramangala-2", type: "double", bedsTotal: 2, bedsOccupied: 0, kind: "vacant", views: 24, isDedicated: true },
          { roomId: "r-koramangala-3", type: "triple", bedsTotal: 3, bedsOccupied: 0, kind: "vacant", views: 36, isDedicated: false },
        ];

        for (const rSeed of roomsToSeed) {
          await roomsCol.insertOne({
            _id: rSeed.roomId,
            customId: rSeed.roomId,
            propertyId: prop.id,
            type: rSeed.type,
            bedsTotal: rSeed.bedsTotal,
            bedsOccupied: rSeed.bedsOccupied,
            currentPrice: prop.basePrice,
          });

          await roomStatusesCol.insertOne({
            roomId: rSeed.roomId,
            propertyId: prop.id,
            ownerId: prop.ownerId,
            kind: rSeed.kind,
            rentConfirmed: prop.basePrice,
            floorPrice: 13500,
            actualRent: prop.basePrice,
            expectedRent: prop.basePrice,
            lowestAcceptableRent: 13500,
            updatedAt: now,
            verifiedToday: true,
            lockedUnsellable: false,
            isDedicated: rSeed.isDedicated,
            views: rSeed.views,
          });
        }
      } else {
        await propertiesCol.insertOne({
          _id: prop.id,
          customId: prop.id,
          tenantId: defaultTenant,
          ownerId: prop.ownerId,
          ownerName: prop.ownerName,
          name: prop.name,
          area: prop.area,
          address: prop.address,
          basePrice: prop.basePrice,
          pricePerBed: prop.basePrice,
          foodRating: 4,
          hygieneRating: 4,
          amenities: ["WiFi", "Laundry", "AC"],
          photos: [],
          description: "Pre-seeded property for Gharpayy mock owners.",
          gateRules: "No gates rules.",
          securityInfo: "24/7 Security",
          propertyType: "pg",
          genderCategory: "unisex",
          sharingTypes: ["single", "double"],
          flatConfig: "studio",
          pageViews: 124,
          shares: 12,
          photoCount: 0,
          createdAt: now,
          updatedAt: now,
          zoneId: "zone-1",
          totalBeds: 6,
          vacantBeds: 5,
        });

        const roomTypes: ("single" | "double" | "triple" | "studio")[] = ["single", "double", "triple", "studio"];
        for (let i = 1; i <= 3; i++) {
          const roomId = `r-${prop.id.split("-")[1]}-${i}`;
          const roomType = roomTypes[(i - 1) % roomTypes.length];
          const bedsTotal = roomType === "single" ? 1 : roomType === "double" ? 2 : roomType === "triple" ? 3 : 1;

          await roomsCol.insertOne({
            _id: roomId,
            customId: roomId,
            propertyId: prop.id,
            type: roomType,
            bedsTotal,
            bedsOccupied: i === 1 ? bedsTotal : 0,
            currentPrice: prop.basePrice,
          });

          await roomStatusesCol.insertOne({
            roomId,
            propertyId: prop.id,
            ownerId: prop.ownerId,
            kind: i === 1 ? "occupied" : "vacant",
            rentConfirmed: prop.basePrice,
            floorPrice: Math.round(prop.basePrice * 0.9),
            actualRent: prop.basePrice,
            expectedRent: prop.basePrice,
            lowestAcceptableRent: Math.round(prop.basePrice * 0.9),
            updatedAt: now,
            verifiedToday: true,
            lockedUnsellable: false,
            isDedicated: i === 2,
            views: 12 * i,
          });
        }
      }
    } else {
      await propertiesCol.updateOne(
        { _id: prop.id },
        { $set: { totalBeds: 6, vacantBeds: 5 } }
      );
    }
  }

  const blockRequestsCol = col<any>("block_requests");
  await blockRequestsCol.deleteOne({ id: "blk-1" });
  await blockRequestsCol.insertOne({
    _id: "blk-1",
    id: "blk-1",
    roomId: "r-koramangala-2",
    propertyId: "p-koramangala-1",
    ownerId: "mock-own-own-1",
    leadId: "l-101",
    leadName: "Priya Reddy",
    intent: "hard",
    requestedAt: "2026-06-02T17:36:42.000Z",
    expiresAt: "2026-06-02T17:51:42.000Z",
    state: "pending",
  });

  const objectionsCol = col<any>("objections");
  await objectionsCol.deleteMany({ id: { $in: ["obj-1", "obj-2", "obj-3", "obj-4"] } });
  await objectionsCol.insertMany([
    {
      _id: "obj-1",
      id: "obj-1",
      roomId: "r-koramangala-1",
      ownerId: "mock-own-own-1",
      reason: "price",
      notes: "Asked for ₹1k less on the double sharing option.",
      loggedAt: "2026-06-02T17:44:42.000Z",
      loggedBy: "Anil (Sales)",
    },
    {
      _id: "obj-2",
      id: "obj-2",
      roomId: "r-indiranagar-1",
      ownerId: "mock-own-own-2",
      reason: "location",
      notes: "Too far from Metro station.",
      loggedAt: "2026-06-02T18:12:00.000Z",
      loggedBy: "Anil (Sales)",
    },
    {
      _id: "obj-3",
      id: "obj-3",
      roomId: "r-hsr-1",
      ownerId: "mock-own-own-3",
      reason: "price",
      notes: "Budget mismatch, wanted ₹1.5k discount.",
      loggedAt: "2026-06-02T19:05:00.000Z",
      loggedBy: "Sanjay (Sales)",
    },
    {
      _id: "obj-4",
      id: "obj-4",
      roomId: "r-whitefield-1",
      ownerId: "mock-own-own-4",
      reason: "amenities",
      notes: "Requested AC unit in room.",
      loggedAt: "2026-06-02T20:30:00.000Z",
      loggedBy: "Sanjay (Sales)",
    }
  ]);

  const mediaCol = col<any>("room_media");
  await mediaCol.deleteOne({ roomId: "r-koramangala-2" });
  await mediaCol.insertOne({
    _id: "m-koramangala-2-seed",
    roomId: "r-koramangala-2",
    ownerId: "mock-own-own-1",
    photos: [
      "/placeholder.svg",
      "/placeholder.svg",
      "/placeholder.svg"
    ],
    videoUrl: "https://example.com/room-video.mp4",
    uploadedAt: "2026-05-31T17:44:42.000Z",
    expiresAt: "2026-06-07T17:44:42.000Z"
  });
}


export function registerOwnerRoutes(app: FastifyInstance) {
  // Trigger seeding on module registration
  seedOwnersAndProperties().catch((err) => {
    app.log.warn({ err }, "seedOwnersAndProperties failed on startup");
  });

  // ---------- ADMIN ROUTES (OWNER MANAGEMENT) ----------
  // ---------- ADMIN ROUTES (OWNER MANAGEMENT) ----------
  app.get("/api/admin/owners", async (req, reply) => {
    const users = col<UserDoc>("users");
    const list = await users
      .find({ role: "owner" })
      .project({
        _id: 1,
        fullName: 1,
        phone: 1,
        role: 1,
        username: 1,
        plainPassword: 1,
        propertyIds: 1,
      })
      .sort({ fullName: 1 })
      .toArray();

    return reply.send(list.map((u: any) => ({
      id: u._id,
      name: u.fullName,
      phone: u.phone || "",
      role: u.role === "manager" ? "Manager" : "Owner",
      username: u.username,
      password: u.plainPassword || "••••••••",
      propertyIds: u.propertyIds || [],
    })));
  });

  app.post("/api/admin/owners/:id/rotate-password", async (req, reply) => {
    const { id } = req.params as { id: string };
    const users = col<UserDoc>("users");
    
    // Generate a simple new password (e.g., random 7 chars)
    const newPassword = Math.random().toString(36).slice(2, 9);
    const passwordHash = await argon2.hash(newPassword);

    const r = await users.findOneAndUpdate(
      { _id: id, role: "owner" },
      { $set: { passwordHash, plainPassword: newPassword, updatedAt: new Date().toISOString() } },
      { returnDocument: "after" }
    );

    if (!r) {
      return reply.code(404).send({ success: false, message: "Owner not found" });
    }

    return reply.send({ success: true, newPassword });
  });

  // ---------- ADMIN ROUTES (OWNER ACTIONS / LEDGER) ----------
  app.get("/api/admin/actions", async (req, reply) => {
    const { ownerId } = req.query as any;
    const actionsCol = col<any>("room_actions");
    const filter = ownerId ? { ownerId } : {};
    const list = await actionsCol.find(filter).sort({ at: -1 }).limit(1000).toArray();
    return reply.send({ success: true, data: list });
  });

  app.post("/api/admin/actions", async (req, reply) => {
    const body = req.body as any;
    const { roomId, type, note, by } = body;
    
    // Auto lookup ownerId from roomId
    const roomsCol = col<any>("rooms");
    const propsCol = col<any>("properties");
    
    const room = await roomsCol.findOne({ $or: [{ _id: roomId }, { customId: roomId }] });
    let ownerId = body.ownerId || "admin-fallback";
    
    if (room) {
      const prop = await propsCol.findOne({ $or: [{ _id: room.propertyId }, { customId: room.propertyId }] });
      if (prop) ownerId = prop.ownerId;
    }

    const actionsCol = col<any>("room_actions");
    const actionId = `a-${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();

    const action = {
      _id: actionId,
      id: actionId,
      ownerId,
      roomId,
      type,
      note,
      by: by || "Admin",
      at: now,
    };

    await actionsCol.insertOne(action);
    return reply.send({ success: true, data: action });
  });

  // ---------- ADMIN ROUTES (ROOMS) ----------
  app.get("/api/admin/rooms", async (req, reply) => {
    const { ownerId } = req.query as { ownerId?: string };
    if (!ownerId) {
      return reply.code(400).send({ success: false, message: "ownerId is required" });
    }
    const propertiesCol = col<any>("properties");
    const roomsCol = col<any>("rooms");
    const roomStatusesCol = col<any>("room_statuses");
    const mediaCol = col<any>("room_media");

    const ownerProps = await propertiesCol.find({ ownerId }).toArray();
    const propIds = ownerProps.map((p) => p.customId || p._id);

    const rooms = await roomsCol.find({ propertyId: { $in: propIds } }).toArray();
    const roomIds = rooms.map((r) => r.customId || r._id);
    const roomStatuses = await roomStatusesCol.find({ roomId: { $in: roomIds } }).toArray();
    const roomMedia = await mediaCol.find({ roomId: { $in: roomIds } }).toArray();

    return reply.send({
      success: true,
      data: {
        rooms,
        roomStatuses,
        roomMedia,
      },
    });
  });

  // ---------- ADMIN ROUTES (ROOM DEMAND) ----------
  app.post("/api/admin/rooms/:roomId/demand", async (req, reply) => {
    const { roomId } = req.params as { roomId: string };
    const { demandScore } = req.body as { demandScore: number };

    if (typeof demandScore !== "number" || demandScore < 0 || demandScore > 100) {
      return reply.code(400).send({ success: false, message: "Invalid demand score (must be 0-100)" });
    }

    const roomStatusesCol = col<any>("room_statuses");
    
    // Upsert the room status with the new demand score
    await roomStatusesCol.updateOne(
      { roomId },
      { 
        $set: { 
          demandScore,
          updatedAt: new Date().toISOString() 
        } 
      },
      { upsert: true }
    );

    return reply.send({ success: true, demandScore });
  });

  // ---------- ADMIN DELETE ROOM ----------
  app.delete("/api/admin/rooms/:roomId", async (req, reply) => {
    const { roomId } = req.params as { roomId: string };
    const roomsCol = col<any>("rooms");
    const roomStatusesCol = col<any>("room_statuses");
    
    await roomsCol.deleteOne({ $or: [{ customId: roomId }, { _id: roomId }] });
    await roomStatusesCol.deleteOne({ roomId });

    return reply.send({ success: true, message: "Room deleted" });
  });

  // ---------- ADMIN UPDATE ROOM STATUS ----------
  app.put("/api/admin/rooms/:roomId/status", async (req, reply) => {
    const { roomId } = req.params as { roomId: string };
    const body = req.body as any;
    const roomStatusesCol = col<any>("room_statuses");
    
    await roomStatusesCol.updateOne(
      { roomId },
      { $set: { kind: body.status, updatedAt: new Date().toISOString() } },
      { upsert: true }
    );

    return reply.send({ success: true, message: "Room status updated" });
  });

  // ---------- OWNER LOGIN ----------
  app.post("/api/v1/owner/login", async (req, reply) => {
    const { username, password } = LoginBody.parse(req.body);
    const users = col<UserDoc>("users");
    const owner = await users.findOne({ username: username.trim().toLowerCase(), role: "owner" });

    if (!owner) {
      return reply.code(401).send({ success: false, message: "Invalid credentials" });
    }

    // Accept seed password "Password123"
    const isOk = await argon2.verify(owner.passwordHash, password);
    if (!isOk) {
      return reply.code(401).send({ success: false, message: "Invalid credentials" });
    }

    const claims = buildClaims(owner);
    const token = await signAccessToken(claims);

    return reply.send({
      success: true,
      data: {
        accessToken: token,
        owner: {
          _id: owner._id,
          username: owner.username,
          email: owner.email,
          fullName: owner.fullName,
          phone: owner.phone ?? "",
          propertyIds: (owner as any).propertyIds ?? [],
          isDedicated: (owner as any).isDedicated ?? false,
          tier: (owner as any).tier ?? "standard",
        },
      },
    });
  });

  // ---------- CURRENT OWNER ----------
  app.get("/api/v1/owner/current-owner", { preHandler: [requireAuth] }, async (req, reply) => {
    const userId = req.user!.sub;
    const users = col<UserDoc>("users");
    const owner = await users.findOne({ _id: userId });

    if (!owner) {
      return reply.code(404).send({ success: false, message: "Owner not found" });
    }

    return reply.send({
      success: true,
      data: {
        _id: owner._id,
        email: owner.email,
        username: owner.username,
        fullName: owner.fullName,
        phone: owner.phone ?? "",
        propertyIds: (owner as any).propertyIds ?? [],
        isDedicated: (owner as any).isDedicated ?? false,
        tier: (owner as any).tier ?? "standard",
        createdAt: owner.createdAt,
      },
    });
  });

  // ---------- OWNER PROPERTIES ----------
  app.get("/api/v1/owner/properties", { preHandler: [requireAuth] }, async (req, reply) => {
    const userId = req.user!.sub;
    const propertiesCol = col<any>("properties");
    const list = await propertiesCol.find({ ownerId: userId }).toArray();

    const propIds = list.map(p => p.customId || p._id);
    const allRooms = await col<any>("rooms").find({ propertyId: { $in: propIds } }).toArray();
    const roomIds = allRooms.map((r: any) => r.customId || r._id);
    const allRoomStatuses = await col<any>("room_statuses").find({ roomId: { $in: roomIds } }).toArray();

    const propertiesWithLiveStats = list.map(p => {
      const pRooms = allRooms.filter((r: any) => r.propertyId === (p.customId || p._id));
      const pStatuses = pRooms.map((r: any) => allRoomStatuses.find((s: any) => s.roomId === (r.customId || r._id)));
      const vacantCount = pStatuses.filter((s: any) => s && (s.kind === 'vacant' || s.kind === 'vacating')).length;
      
      const rents = pStatuses.map((s: any) => s ? (s.expectedRent || s.actualRent || s.floorPrice || 0) : 0).filter((r: any) => r > 0);
      const minRent = rents.length > 0 ? Math.min(...rents) : (p.basePrice || p.pricePerBed || 0);

      const food = p.foodRating || 0;
      const hygiene = p.hygieneRating || 0;
      let calculatedRating = 0;
      if (food > 0 && hygiene > 0) calculatedRating = (food + hygiene) / 2;
      else if (food > 0) calculatedRating = food;
      else if (hygiene > 0) calculatedRating = hygiene;

      return {
        ...p,
        basePrice: minRent,
        totalRooms: pRooms.length,
        availableRooms: vacantCount,
        vacantBeds: vacantCount, // for backward compatibility with frontend
        totalBeds: pRooms.length, // for backward compatibility with frontend
        avgRating: calculatedRating > 0 ? calculatedRating : undefined,
      };
    });

    return reply.send({ success: true, data: propertiesWithLiveStats });
  });

  // ---------- OWNER STATS (occupancy, bed counts) ----------
  // Returns bed-based occupancy for the owner overall and per property.
  // Matches the rooms page KPI formula: occupiedBeds / totalBeds * 100
  app.get("/api/v1/owner/stats", { preHandler: [requireAuth] }, async (req, reply) => {
    const userId = req.user!.sub;
    const propertiesCol = col<any>("properties");
    const roomsCol = col<any>("rooms");
    const roomStatusesCol = col<any>("room_statuses");

    const ownerProps = await propertiesCol.find({ ownerId: userId }).toArray();
    const propIds = ownerProps.map((p: any) => p.customId || p._id);

    // Guard: no properties → return zero stats immediately
    if (propIds.length === 0) {
      return reply.send({
        success: true,
        data: {
          overall: { totalProperties: 0, totalBeds: 0, occupiedBeds: 0, vacantBeds: 0, blockedBeds: 0, occupancyPct: 0 },
          properties: [],
        },
      });
    }

    const allRooms = await roomsCol.find({ propertyId: { $in: propIds } }).toArray();
    const roomIds = allRooms.map((r: any) => r.customId || r._id);
    const allStatuses = roomIds.length > 0
      ? await roomStatusesCol.find({ roomId: { $in: roomIds } }).toArray()
      : [];


    // Build per-property stats (bed-based)
    let overallTotalBeds = 0;
    let overallOccupiedBeds = 0;
    let overallVacantBeds = 0;
    let overallBlockedBeds = 0;

    const propertyStats = ownerProps.map((p: any) => {
      const propId = p.customId || p._id;
      const propRooms = allRooms.filter((r: any) => r.propertyId === propId);

      let totalBeds = 0, occupiedBeds = 0, vacantBeds = 0, blockedBeds = 0;

      propRooms.forEach((room: any) => {
        const roomId = room.customId || room._id;
        const beds = room.bedsTotal || 1;
        const s = allStatuses.find((stat: any) => stat.roomId === roomId);
        const kind = s?.kind || "vacant";

        totalBeds += beds;
        if (s?.lockedUnsellable || kind === "blocked") blockedBeds += beds;
        else if (kind === "vacant" || kind === "vacating") vacantBeds += beds;
        else occupiedBeds += beds; // "occupied"
      });

      overallTotalBeds += totalBeds;
      overallOccupiedBeds += occupiedBeds;
      overallVacantBeds += vacantBeds;
      overallBlockedBeds += blockedBeds;

      return {
        propertyId: propId,
        propertyName: p.name,
        totalBeds,
        occupiedBeds,
        vacantBeds,
        blockedBeds,
        occupancyPct: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
      };
    });

    return reply.send({
      success: true,
      data: {
        overall: {
          totalProperties: ownerProps.length,
          totalBeds: overallTotalBeds,
          occupiedBeds: overallOccupiedBeds,
          vacantBeds: overallVacantBeds,
          blockedBeds: overallBlockedBeds,
          occupancyPct: overallTotalBeds > 0
            ? Math.round((overallOccupiedBeds / overallTotalBeds) * 100)
            : 0,
        },
        properties: propertyStats,
      },
    });
  });

  // ---------- OWNER ROOMS ----------

  app.get("/api/v1/owner/rooms", { preHandler: [requireAuth] }, async (req, reply) => {
    const userId = req.user!.sub;
    const propertiesCol = col<any>("properties");
    const roomsCol = col<any>("rooms");
    const roomStatusesCol = col<any>("room_statuses");
    const mediaCol = col<any>("room_media");

    const ownerProps = await propertiesCol.find({ ownerId: userId }).toArray();
    const propIds = ownerProps.map((p) => p.customId || p._id);

    const rooms = await roomsCol.find({ propertyId: { $in: propIds } }).toArray();
    const roomIds = rooms.map((r) => r.customId || r._id);
    const roomStatuses = await roomStatusesCol.find({ roomId: { $in: roomIds } }).toArray();
    const roomMedia = await mediaCol.find({ roomId: { $in: roomIds } }).toArray();

    return reply.send({
      success: true,
      data: {
        rooms,
        roomStatuses,
        roomMedia,
      },
    });
  });


  // ---------- UPDATE ROOM STATUS ----------
  app.put("/api/v1/owner/rooms/:roomId/status", { preHandler: [requireAuth] }, async (req, reply) => {
    const { roomId } = req.params as { roomId: string };
    const body = RoomStatusFields.partial().parse(req.body);
    const roomStatusesCol = col<any>("room_statuses");
    const roomsCol = col<any>("rooms");
    const propertiesCol = col<any>("properties");

    const existing = await roomStatusesCol.findOne({ roomId });
    if (!existing) {
      return reply.code(404).send({ success: false, message: "Room status not found" });
    }

    const update: Record<string, any> = {
      ...body,
      verifiedToday: true,
      lockedUnsellable: false,
      updatedAt: new Date().toISOString(),
    };

    const r = await roomStatusesCol.findOneAndUpdate(
      { roomId },
      { $set: update },
      { returnDocument: "after" }
    );

    // Notify Admin of changes
    let changeDetails: string[] = [];
    if (body.kind && body.kind !== existing.kind) {
      changeDetails.push(`status changed to ${body.kind}`);
    }
    if (body.actualRent && body.actualRent !== existing.actualRent) {
      changeDetails.push(`price changed to ₹${body.actualRent}`);
    }
    // Remove occupancy block as it's not part of RoomStatusFields


    if (changeDetails.length > 0) {
      const room = await roomsCol.findOne({ customId: roomId });
      let propName = "Unknown Property";
      let roomNumber = room?.roomNumber || roomId;
      if (room?.propertyId) {
        const prop = await propertiesCol.findOne({ customId: room.propertyId });
        if (prop) propName = prop.name;
      }

      await col("notifications").insertOne({
        _id: crypto.randomUUID(),
        tenantId: req.user!.tenantId,
        recipient: "ADMIN",
        type: "ADMIN_PROPERTY_UPDATED",
        title: "Room Updated",
        message: `Owner ${req.user!.fullName || 'Unknown'} updated Room ${roomNumber} in ${propName}. Changes: ${changeDetails.join(', ')}.`,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }

    return reply.send({ success: true, data: r });
  });


  // ---------- VERIFY ROOM ----------
  app.post("/api/v1/owner/rooms/:roomId/verify", { preHandler: [requireAuth] }, async (req, reply) => {
    const { roomId } = req.params as { roomId: string };
    const roomStatusesCol = col<any>("room_statuses");

    const r = await roomStatusesCol.findOneAndUpdate(
      { roomId },
      { $set: { verifiedToday: true, lockedUnsellable: false, updatedAt: new Date().toISOString() } },
      { returnDocument: "after" }
    );

    if (!r) {
      return reply.code(404).send({ success: false, message: "Room status not found" });
    }

    return reply.send({ success: true, data: r });
  });


  // ---------- ADD ROOM ----------
  app.post("/api/v1/owner/rooms", { preHandler: [requireAuth] }, async (req, reply) => {
    const userId = req.user!.sub;
    const body = req.body as any;
    const { propertyId, type, bedsTotal, price, floorPrice, actualRent, expectedRent, lowestAcceptableRent, floorNumber } = body;

    if (!propertyId || !type || !bedsTotal || !price) {
      return reply.code(400).send({ success: false, message: "Missing required fields" });
    }

    const roomsCol = col<any>("rooms");
    const roomStatusesCol = col<any>("room_statuses");

    const roomId = `r-custom-${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();

    await roomsCol.insertOne({
      _id: roomId,
      customId: roomId,
      propertyId,
      type,
      bedsTotal: Number(bedsTotal),
      bedsOccupied: 0,
      currentPrice: Number(price),
      floorNumber: floorNumber ? Number(floorNumber) : 1,
    });

    await roomStatusesCol.insertOne({
      roomId,
      propertyId,
      ownerId: userId,
      kind: "vacant",
      commercialStatus: "vacant",
      operationalStatus: "ready",
      turnaroundStatus: "none",
      rentConfirmed: Number(price),
      floorPrice: floorPrice ? Number(floorPrice) : Math.round(Number(price) * 0.9),
      actualRent: actualRent ? Number(actualRent) : Number(price),
      expectedRent: expectedRent ? Number(expectedRent) : Number(price),
      lowestAcceptableRent: lowestAcceptableRent ? Number(lowestAcceptableRent) : (floorPrice ? Number(floorPrice) : Math.round(Number(price) * 0.9)),
      updatedAt: now,
      verifiedToday: true,
      lockedUnsellable: false,
      isDedicated: false,
      views: 0,
    });

    const propertiesCol = col<any>("properties");
    let propName = "Unknown Property";
    const prop = await propertiesCol.findOne({ customId: propertyId });
    if (prop) propName = prop.name;

    await col("notifications").insertOne({
      _id: crypto.randomUUID(),
      tenantId: req.user!.tenantId,
      recipient: "ADMIN",
      type: "ADMIN_PROPERTY_UPDATED",
      title: "New Room Added",
      message: `Owner ${req.user!.fullName || 'Unknown'} added a new room (ID: ${roomId}, Floor ${floorNumber || 1}) to ${propName}.`,
      isRead: false,
      createdAt: now,
    });

    return reply.send({ success: true, data: { roomId } });
  });

  // ---------- UPDATE ROOM DETAILS (commercial/operational/turnaround status) ----------
  app.put("/api/v1/owner/rooms/:roomId/details", { preHandler: [requireAuth] }, async (req, reply) => {
    const { roomId } = req.params as { roomId: string };
    const body = req.body as any;
    const { commercialStatus, operationalStatus, turnaroundStatus, usp, availability } = body;
    const roomStatusesCol = col<any>("room_statuses");
    const now = new Date().toISOString();

    const validCommercial = ["occupied", "vacant", "quoted", "booked", "reserved", "on_notice"];
    const validOperational = ["ready", "cleaning", "maintenance", "blocked"];
    const validTurnaround = ["none", "checkout", "checkin"];

    const update: Record<string, any> = { updatedAt: now };
    if (commercialStatus && validCommercial.includes(commercialStatus)) {
      update.commercialStatus = commercialStatus;
      // Sync legacy kind field
      if (commercialStatus === "occupied") update.kind = "occupied";
      else if (commercialStatus === "on_notice") update.kind = "vacating";
      else if (commercialStatus === "vacant") update.kind = "vacant";
      else if (["quoted", "booked", "reserved"].includes(commercialStatus)) update.kind = "vacant";
    }
    if (operationalStatus && validOperational.includes(operationalStatus)) {
      update.operationalStatus = operationalStatus;
      if (operationalStatus === "blocked" || operationalStatus === "maintenance") {
        update.lockedUnsellable = true;
        update.kind = "blocked";
      } else {
        update.lockedUnsellable = false;
      }
    }
    if (turnaroundStatus && validTurnaround.includes(turnaroundStatus)) {
      update.turnaroundStatus = turnaroundStatus;
    }
    
    // Save USP and Availability objects
    if (usp) {
      update.usp = usp; // e.g. { size, ventilation, window, sunlight, view, washroom, noise, position, furniture }
    }
    if (availability) {
      update.availability = availability; // e.g. { reason, availableFrom }
    }

    const existing = await roomStatusesCol.findOne({ roomId });
    if (!existing) {
      return reply.code(404).send({ success: false, message: "Room status not found" });
    }

    const r = await roomStatusesCol.findOneAndUpdate(
      { roomId },
      { $set: update },
      { returnDocument: "after" }
    );

    return reply.send({ success: true, data: r });
  });

  // ---------- DELETE ROOM ----------
  app.delete("/api/v1/owner/rooms/:roomId", { preHandler: [requireAuth] }, async (req, reply) => {
    const { roomId } = req.params as { roomId: string };
    const roomsCol = col<any>("rooms");
    const roomStatusesCol = col<any>("room_statuses");
    const propertiesCol = col<any>("properties");

    // Get room to find property details for notification
    const room = await roomsCol.findOne({ customId: roomId });
    if (!room) {
      return reply.code(404).send({ success: false, message: "Room not found" });
    }

    let propName = "Unknown Property";
    let roomNumber = room.roomNumber || roomId;
    if (room.propertyId) {
      const prop = await propertiesCol.findOne({ customId: room.propertyId });
      if (prop) propName = prop.name;
    }

    // Delete room and status
    await roomsCol.deleteOne({ customId: roomId });
    await roomStatusesCol.deleteOne({ roomId });

    // Send notification
    await col("notifications").insertOne({
      _id: crypto.randomUUID(),
      tenantId: req.user!.tenantId,
      recipient: "ADMIN",
      type: "ADMIN_PROPERTY_UPDATED",
      title: "Room Deleted",
      message: `Owner ${req.user!.fullName || 'Unknown'} deleted Room ${roomNumber} from ${propName}.`,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    return reply.send({ success: true, message: "Room deleted" });
  });

  // ---------- OWNER VISITS ----------
  app.get("/api/v1/owner/visits", { preHandler: [requireAuth] }, async (req, reply) => {
    const userId = req.user!.sub;
    const visitsCol = col<any>("visits");
    const roomsCol = col<any>("rooms");
    const propertiesCol = col<any>("properties");

    const list = await visitsCol.find({ ownerId: userId }).sort({ scheduledAt: 1 }).toArray();

    // Enrich with room + property data
    const enriched = await Promise.all(list.map(async (v: any) => {
      let room = null;
      let property = null;
      if (v.roomId) {
        room = await roomsCol.findOne({ $or: [{ _id: v.roomId }, { customId: v.roomId }] });
      }
      if (room?.propertyId) {
        property = await propertiesCol.findOne({ $or: [{ _id: room.propertyId }, { customId: room.propertyId }] });
      } else if (v.propertyId) {
        property = await propertiesCol.findOne({ $or: [{ _id: v.propertyId }, { customId: v.propertyId }] });
      }
      return {
        ...v,
        id: v.id || v._id,
        room: room ? { id: room.customId || room._id, type: room.type, bedsTotal: room.bedsTotal, currentPrice: room.currentPrice } : null,
        property: property ? { id: property.customId || property._id, name: property.name, area: property.area, address: property.address } : null,
      };
    }));

    return reply.send({ success: true, data: enriched });
  });

  // Owner responds to a visit: confirm availability or request reschedule + optional message to admin
  app.post("/api/v1/owner/visits/:visitId/respond", { preHandler: [requireAuth] }, async (req, reply) => {
    const { visitId } = req.params as { visitId: string };
    const { response, message, proposedAt } = req.body as {
      response: "confirmed" | "reschedule_requested";
      message?: string;
      proposedAt?: string;
    };
    const visitsCol = col<any>("visits");
    const notifCol = col<any>("notifications");

    const visit = await visitsCol.findOne({ $or: [{ id: visitId }, { _id: visitId }] });
    if (!visit) return reply.code(404).send({ success: false, message: "Visit not found" });

    const newStatus = response === "confirmed" ? "owner_confirmed" : "reschedule_requested";
    const now = new Date().toISOString();

    const updated = await visitsCol.findOneAndUpdate(
      { $or: [{ id: visitId }, { _id: visitId }] },
      {
        $set: {
          status: newStatus,
          ownerResponse: response,
          ownerMessage: message || null,
          proposedAt: proposedAt || null,
          ownerRespondedAt: now,
          updatedAt: now,
        }
      },
      { returnDocument: "after" }
    );

    // Notify admin
    await notifCol.insertOne({
      _id: crypto.randomUUID(),
      tenantId: req.user!.tenantId,
      recipient: "ADMIN",
      type: response === "confirmed" ? "OWNER_VISIT_CONFIRMED" : "OWNER_RESCHEDULE_REQUESTED",
      title: response === "confirmed" ? "Owner Confirmed Visit" : "Owner Requested Reschedule",
      message: message
        ? `Owner responded: "${message}"${proposedAt ? ` Proposed new time: ${new Date(proposedAt).toLocaleString("en-IN")}` : ""}`
        : (response === "confirmed" ? "Owner is available and confirmed the visit." : "Owner requested a reschedule."),
      visitId,
      ownerId: req.user!.sub,
      isRead: false,
      createdAt: now,
    });

    return reply.send({ success: true, data: updated });
  });

  app.put("/api/v1/owner/visits/:visitId/status", { preHandler: [requireAuth] }, async (req, reply) => {
    const { visitId } = req.params as { visitId: string };
    const { status } = req.body as { status: string };
    const visitsCol = col<any>("visits");

    const r = await visitsCol.findOneAndUpdate(
      { $or: [{ id: visitId }, { _id: visitId }] },
      { $set: { status, updatedAt: new Date().toISOString() } },
      { returnDocument: "after" }
    );

    if (!r) {
      return reply.code(404).send({ success: false, message: "Visit not found" });
    }

    return reply.send({ success: true, data: r });
  });

  // ---------- OWNER ACTIONS (LEDGER) ----------
  app.get("/api/v1/owner/actions", { preHandler: [requireAuth] }, async (req, reply) => {
    const userId = req.user!.sub;
    const actionsCol = col<any>("room_actions");
    const list = await actionsCol.find({ ownerId: userId }).sort({ at: -1 }).limit(200).toArray();
    return reply.send({ success: true, data: list });
  });

  app.post("/api/v1/owner/actions", { preHandler: [requireAuth] }, async (req, reply) => {
    const userId = req.user!.sub;
    const body = req.body as any;
    const { roomId, type, note, by } = body;

    const actionsCol = col<any>("room_actions");
    const actionId = `a-${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();

    const action = {
      _id: actionId,
      id: actionId,
      ownerId: userId,
      roomId,
      type,
      note,
      by: by || "Owner",
      at: now,
    };

    await actionsCol.insertOne(action);
    return reply.send({ success: true, data: action });
  });

  // ---------- OWNER NOTIFICATIONS ----------
  app.get("/api/v1/owner/notifications", { preHandler: [requireAuth] }, async (req, reply) => {
    const userId = req.user!.sub;
    const now = new Date();

    const propertiesCol = col<any>("properties");
    const roomsCol = col<any>("rooms");
    const roomStatusesCol = col<any>("room_statuses");
    const visitsCol = col<any>("visits");
    const actionsCol = col<any>("room_actions");

    // Load persisted read state for this owner
    const readDocs = await col<any>("owner_notif_reads").find({ ownerId: userId }).toArray();
    const readIds = new Set(readDocs.map((d: any) => d.notifId));

    // Fetch owner's properties and rooms
    const ownerProps = await propertiesCol.find({ ownerId: userId }).toArray();
    const propIds = ownerProps.map((p: any) => p.customId || p._id);
    const rooms = await roomsCol.find({ propertyId: { $in: propIds } }).toArray();
    const roomIds = rooms.map((r: any) => r.customId || r._id);
    const statuses = await roomStatusesCol.find({ roomId: { $in: roomIds } }).toArray();

    const notifications: any[] = [];

    // 1. Scheduled visits (from admin or owner)
    const upcoming = await visitsCol.find({
      ownerId: userId,
      status: { $in: ["scheduled", "confirmed"] },
      scheduledAt: { $gte: now.toISOString() },
    }).sort({ scheduledAt: 1 }).limit(10).toArray();

    for (const v of upcoming) {
      const room = rooms.find((r: any) => (r.customId || r._id) === v.roomId);
      const prop = room ? ownerProps.find((p: any) => (p.customId || p._id) === room.propertyId) : null;
      notifications.push({
        id: `visit-${v._id}`,
        type: "VISIT_SCHEDULED",
        category: "visit",
        title: `${v.type === "virtual" ? "🖥 Virtual" : "🏠 Physical"} Tour Scheduled`,
        message: `${v.customerName || "A prospect"} is visiting ${prop?.name || "your property"}${room ? ` (${room.type} room)` : ""} on ${new Date(v.scheduledAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}.`,
        tourType: v.type || "physical",
        propertyName: prop?.name,
        scheduledAt: v.scheduledAt,
        isRead: v.notifRead || false,
        createdAt: v.createdAt,
        priority: "high",
      });
    }

    // 2. Price alerts from admin actions
    const priceActions = await actionsCol.find({
      ownerId: userId,
      type: { $in: ["PRICE_INCREASE_SUGGESTED", "PRICE_DECREASE_SUGGESTED", "price_alert"] },
    }).sort({ at: -1 }).limit(10).toArray();

    for (const a of priceActions) {
      const room = rooms.find((r: any) => (r.customId || r._id) === a.roomId);
      const prop = room ? ownerProps.find((p: any) => (p.customId || p._id) === room.propertyId) : null;
      const isUp = a.type === "PRICE_INCREASE_SUGGESTED" || (a.note && a.note.toLowerCase().includes("high demand"));
      notifications.push({
        id: `price-${a._id}`,
        type: isUp ? "PRICE_UP_ALERT" : "PRICE_DOWN_ALERT",
        category: "pricing",
        title: isUp ? "📈 High Demand — Price Up" : "📉 Low Demand — Price Review",
        message: a.note || (isUp
          ? `Your ${room?.type || ""} room in ${prop?.name || "your property"} is in high demand. Consider increasing the rent.`
          : `Your ${room?.type || ""} room in ${prop?.name || "your property"} needs a pricing review to attract tenants.`),
        propertyName: prop?.name,
        isRead: a.notifRead || false,
        createdAt: a.at,
        priority: "medium",
      });
    }

    // 3. Occupancy alert — always shown, read state from DB
    const totalRooms = statuses.length;
    const occupiedRooms = statuses.filter((s: any) => s.kind === "occupied").length;
    const occupancyPct = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
    if (totalRooms > 0) {
      const isLow = occupancyPct < 60;
      const occId = `occupancy-${userId}-${now.toDateString()}`;
      notifications.push({
        id: occId,
        type: "OCCUPANCY_ALERT",
        category: "stats",
        title: isLow ? "⚠️ Low Occupancy Alert" : "✅ Occupancy Update",
        message: `Your current occupancy is ${occupancyPct}% (${occupiedRooms}/${totalRooms} rooms). ${isLow ? "Consider reviewing your pricing or listing visibility." : "Great job keeping rooms filled!"}`,
        occupancyPct,
        isRead: readIds.has(occId),
        createdAt: new Date(new Date().setHours(8, 0, 0, 0)).toISOString(),
        priority: isLow ? "high" : "low",
      });
    }

    // 4. Inventory: locked/unsellable rooms
    const locked = statuses.filter((s: any) => s.lockedUnsellable);
    if (locked.length > 0) {
      const revenueAtRisk = locked.reduce((sum: number, s: any) => sum + (s.expectedRent || s.rentConfirmed || 0), 0);
      notifications.push({
        id: `locked-${userId}-${now.toDateString()}`,
        type: "ROOMS_LOCKED",
        category: "inventory",
        title: "🔒 Rooms Locked / Unsellable",
        message: `${locked.length} room(s) are marked as locked/unsellable. Revenue at risk: ₹${revenueAtRisk.toLocaleString("en-IN")}/mo. Unlock them to start receiving leads.`,
        lockedCount: locked.length,
        revenueAtRisk,
        isRead: false,
        createdAt: new Date(new Date().setHours(8, 5, 0, 0)).toISOString(),
        priority: "high",
      });
    }

    // 5. Sellable (vacant) rooms summary — read state from DB
    const sellable = statuses.filter((s: any) => s.kind === "vacant" && !s.lockedUnsellable);
    if (sellable.length > 0) {
      const sellId = `sellable-${userId}-${now.toDateString()}`;
      notifications.push({
        id: sellId,
        type: "SELLABLE_ROOMS",
        category: "inventory",
        title: "🟢 Sellable Rooms Today",
        message: `You have ${sellable.length} vacant, sellable room(s) available for new tenants across ${ownerProps.length} properties.`,
        sellableCount: sellable.length,
        isRead: readIds.has(sellId),
        createdAt: new Date(new Date().setHours(8, 10, 0, 0)).toISOString(),
        priority: "low",
      });
    }

    // 6. Revenue at risk from vacating rooms
    const vacating = statuses.filter((s: any) => s.kind === "vacating");
    if (vacating.length > 0) {
      const revenueAtRisk = vacating.reduce((sum: number, s: any) => sum + (s.rentConfirmed || s.actualRent || 0), 0);
      notifications.push({
        id: `vacating-${userId}-${now.toDateString()}`,
        type: "REVENUE_AT_RISK",
        category: "revenue",
        title: "💸 Revenue at Risk",
        message: `${vacating.length} tenant(s) vacating soon. ₹${revenueAtRisk.toLocaleString("en-IN")}/mo at risk. Start prospecting now!`,
        vacatingCount: vacating.length,
        revenueAtRisk,
        isRead: false,
        createdAt: new Date(new Date().setHours(8, 15, 0, 0)).toISOString(),
        priority: "high",
      });
    }

    // 7. Daily streak — based on real verifiedToday field, read state from DB
    const todayStr = now.toDateString();
    const verifiedToday = statuses.some((s: any) => s.verifiedToday && new Date(s.updatedAt).toDateString() === todayStr);
    const streakId = `streak-${userId}-${todayStr}`;
    notifications.push({
      id: streakId,
      type: "STREAK",
      category: "streak",
      title: verifiedToday ? "🔥 Streak Active!" : "❄️ Keep Your Streak Going",
      message: verifiedToday
        ? "You've verified your rooms today. Keep it up for uninterrupted lead flow!"
        : "You haven't verified your room statuses today. Update them to maintain your streak and get leads.",
      isRead: readIds.has(streakId),
      createdAt: new Date(new Date().setHours(9, 0, 0, 0)).toISOString(),
      priority: verifiedToday ? "low" : "medium",
    });

    // Sort: unread first, then by priority, then by date desc
    const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    notifications.sort((a, b) => {
      if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
      if (priorityOrder[a.priority] !== priorityOrder[b.priority])
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return reply.send({ success: true, data: notifications });
  });

  // Mark owner notification read
  app.patch("/api/v1/owner/notifications/:id/read", { preHandler: [requireAuth] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    // Persist read state per notification id per owner
    await col<any>("owner_notif_reads").updateOne(
      { ownerId: req.user!.sub, notifId: id },
      { $set: { ownerId: req.user!.sub, notifId: id, readAt: new Date().toISOString() } },
      { upsert: true }
    );
    return reply.send({ success: true });
  });

  // Mark ALL owner notifications read
  app.post("/api/v1/owner/notifications/mark-all-read", { preHandler: [requireAuth] }, async (req, reply) => {
    const userId = req.user!.sub;
    const visitsCol = col<any>("visits");
    const actionsCol = col<any>("room_actions");
    await visitsCol.updateMany({ ownerId: userId }, { $set: { notifRead: true } });
    await actionsCol.updateMany({ ownerId: userId }, { $set: { notifRead: true } });
    return reply.send({ success: true });
  });

  // Admin: schedule a visit for an owner's property
  app.post("/api/admin/visits", async (req, reply) => {
    const body = req.body as any;
    const { ownerId, roomId, customerName, customerPhone, scheduledAt, type, notes } = body;

    const visitsCol = col<any>("visits");
    const visitId = `v-adm-${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();

    const visit = {
      _id: visitId,
      id: visitId,
      ownerId,
      roomId,
      customerName,
      customerPhone,
      scheduledAt,
      type: type || "physical",
      status: "scheduled",
      scheduledBy: "admin",
      notes,
      notifRead: false,
      createdAt: now,
    };

    await visitsCol.insertOne(visit);
    return reply.send({ success: true, data: visit });
  });

  // Admin: push a price alert action for an owner's room
  app.post("/api/admin/price-alert", async (req, reply) => {
    const body = req.body as any;
    const { ownerId, roomId, direction, note } = body;
    const type = direction === "up" ? "PRICE_INCREASE_SUGGESTED" : "PRICE_DECREASE_SUGGESTED";

    const actionsCol = col<any>("room_actions");
    const actionId = `a-adm-${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();

    const action = {
      _id: actionId,
      id: actionId,
      ownerId,
      roomId,
      type,
      note: note || (direction === "up" ? "High demand — consider increasing price." : "Low demand — consider reducing price."),
      by: "Admin",
      notifRead: false,
      at: now,
    };

    await actionsCol.insertOne(action);
    return reply.send({ success: true, data: action });
  });
}

