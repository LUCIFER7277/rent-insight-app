import type { FastifyInstance } from "fastify";
import { z } from "zod";
import crypto from "node:crypto";
import { col } from "../../db/mongo.js";
import { requireAuth, requireScope } from "../../middleware/auth.js";
import { ulid } from "../../contracts/ids.js";

export interface PropertyDoc {
  _id: string;
  tenantId: string;
  name: string;
  zoneId: string;
  area: string;
  address: string;
  totalBeds: number;
  vacantBeds: number;
  pricePerBed: number;
  createdAt: string;
  updatedAt: string;
}

const PropertyFields = {
  name: z.string().min(1).max(120),
  zoneId: z.string().min(1),
  area: z.string().max(120),
  address: z.string().max(250).optional().default(""),
  totalBeds: z.number().int().min(0).default(0),
  vacantBeds: z.number().int().min(0).default(0),
  pricePerBed: z.number().int().min(0).default(0),
};

const CreateBody = z.object(PropertyFields);
const UpdateBody = z.object(PropertyFields);

function propertyOut(p: PropertyDoc) {
  return {
    id: p._id,
    name: p.name,
    zoneId: p.zoneId,
    area: p.area,
    address: p.address,
    totalBeds: p.totalBeds,
    vacantBeds: p.vacantBeds,
    pricePerBed: p.pricePerBed,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

export function registerPropertyRoutes(app: FastifyInstance) {
  const properties = () => col<PropertyDoc>("properties");

  // List properties
  app.get("/api/properties", { preHandler: [requireAuth] }, async (req, reply) => {
    const list = await properties()
      .find({ tenantId: req.user!.tenantId })
      .sort({ name: 1 })
      .toArray();
    return reply.send(list.map(propertyOut));
  });

  // Admin list properties (bypasses auth for the dashboard mockup)
  app.get("/api/admin/properties", async (req, reply) => {
    const { ownerId } = req.query as { ownerId?: string };
    const query: any = { tenantId: "gharpayy" };
    if (ownerId) query.ownerId = ownerId;

    const list = await properties()
      .find(query)
      .sort({ name: 1 })
      .toArray();
    const propIds = list.map(p => (p as any).customId || p._id);
    const allRooms = await col<any>("rooms").find({ propertyId: { $in: propIds } }).toArray();
    const roomIds = allRooms.map((r: any) => r.customId || r._id);
    const allRoomStatuses = await col<any>("room_statuses").find({ roomId: { $in: roomIds } }).toArray();

    // Return more fields since admin dashboard needs them
    return reply.send(list.map(p => {
      const pRooms = allRooms.filter((r: any) => r.propertyId === ((p as any).customId || p._id));
      const pStatuses = pRooms.map((r: any) => allRoomStatuses.find((s: any) => s.roomId === (r.customId || r._id)));
      const vacantCount = pStatuses.filter((s: any) => s && (s.kind === 'vacant' || s.kind === 'vacating')).length;
      
      const rents = pStatuses.map((s: any) => s ? (s.expectedRent || s.actualRent || s.floorPrice || 0) : 0).filter((r: any) => r > 0);
      const minRent = rents.length > 0 ? Math.min(...rents) : ((p as any).pricePerBed || (p as any).basePrice || 0);

      const food = (p as any).foodRating || 0;
      const hygiene = (p as any).hygieneRating || 0;
      let calculatedRating = 0;
      if (food > 0 && hygiene > 0) calculatedRating = (food + hygiene) / 2;
      else if (food > 0) calculatedRating = food;
      else if (hygiene > 0) calculatedRating = hygiene;

      return {
        id: p._id,
        name: p.name,
        area: p.area,
        address: p.address,
        monthlyRent: minRent,
        availability: "AVAILABLE",
        availableRooms: vacantCount,
        totalRooms: pRooms.length,
        ownerId: (p as any).ownerId,
        isVerified: (p as any).isVerified ?? true,
        avgRating: calculatedRating > 0 ? calculatedRating : undefined,
      };
    }));
  });

  // Create property
  app.post("/api/properties", { preHandler: [requireAuth, requireScope("inventory.block")] }, async (req, reply) => {
    try {
      const body = CreateBody.parse(req.body);
      const name = body.name.trim();
      const exists = await properties().findOne({ tenantId: req.user!.tenantId, name });
      if (exists) return reply.code(409).send({ code: "CONFLICT", message: "Property name already exists" });
      
      const now = new Date().toISOString();
      const doc: PropertyDoc = {
        _id: ulid(),
        tenantId: req.user!.tenantId,
        name,
        zoneId: body.zoneId,
        area: body.area.trim(),
        address: body.address.trim(),
        totalBeds: body.totalBeds,
        vacantBeds: body.vacantBeds,
        pricePerBed: body.pricePerBed,
        createdAt: now,
        updatedAt: now,
      };
      await properties().insertOne(doc);
      return reply.code(201).send(propertyOut(doc));
    } catch (e) {
      const err = e as Error;
      return reply.code(400).send({ code: "BAD_REQUEST", message: err.message });
    }
  });

  // Create property as Owner
  app.post("/api/v1/owner/properties", { preHandler: [requireAuth] }, async (req, reply) => {
    try {
      const body = req.body as any;
      const name = body.name?.trim();
      if (!name) return reply.code(400).send({ code: "BAD_REQUEST", message: "Property name is required" });
      
      const exists = await properties().findOne({ tenantId: req.user!.tenantId, name });
      if (exists) return reply.code(409).send({ code: "CONFLICT", message: "Property name already exists" });
      
      const now = new Date().toISOString();
      const customId = `p-custom-${crypto.randomUUID()}`;
      
      const doc = {
        _id: customId,
        customId,
        tenantId: req.user!.tenantId,
        ownerId: req.user!.sub,
        ownerName: req.user!.fullName,
        name,
        area: (body.area ?? "").trim(),
        address: (body.address ?? "").trim(),
        basePrice: Number(body.basePrice ?? body.rentPrice ?? 0),
        foodRating: Number(body.foodRating ?? 0),
        hygieneRating: Number(body.hygieneRating ?? 0),
        amenities: body.amenities ?? [],
        photos: body.photos ?? [],
        description: body.description ?? "",
        gateRules: body.gateRules ?? "",
        securityInfo: body.securityInfo ?? "",
        propertyType: body.propertyType ?? "",
        genderCategory: body.genderCategory ?? "",
        sharingTypes: body.sharingTypes ?? [],
        flatConfig: body.flatConfig ?? "",
        pageViews: 0,
        shares: 0,
        photoCount: body.photos?.length ?? 0,
        createdAt: now,
        updatedAt: now,
        zoneId: "z-custom",
        totalBeds: Number(body.totalRooms ?? 1),
        vacantBeds: Number(body.availableRooms ?? body.totalRooms ?? 1),
        pricePerBed: Number(body.basePrice ?? body.rentPrice ?? 0),
      };
      
      await properties().insertOne(doc);
      
      // ── Create placeholder room records so GET live-count reflects the numbers ──
      const totalRooms = Math.max(0, Number(body.totalRooms ?? 0));
      const availableRooms = Math.min(Math.max(0, Number(body.availableRooms ?? 0)), totalRooms);
      const basePrice = Number(body.basePrice ?? body.rentPrice ?? 0);

      if (totalRooms > 0) {
        const roomsCol = col<any>("rooms");
        const roomStatusesCol = col<any>("room_statuses");

        for (let i = 0; i < totalRooms; i++) {
          const roomId = `room-${customId}-${i + 1}`;
          // First `availableRooms` rooms are vacant, the rest are occupied
          const kind = i < availableRooms ? "vacant" : "occupied";

          await roomsCol.insertOne({
            _id: roomId,
            customId: roomId,
            propertyId: customId,
            type: `Room ${i + 1}`,
            bedsTotal: 1,
            currentPrice: basePrice,
            createdAt: now,
          });

          await roomStatusesCol.insertOne({
            _id: `status-${roomId}`,
            roomId,
            kind,
            expectedRent: basePrice,
            actualRent: kind === "occupied" ? basePrice : 0,
            floorPrice: basePrice,
            updatedAt: now,
          });
        }
      }

      // Update owner's database document inside "users" collection
      await col("users").updateOne(
        { _id: req.user!.sub },
        { $push: { propertyIds: customId } as any }
      );
      
      // Notify Admin
      await col("notifications").insertOne({
        _id: ulid(),
        tenantId: req.user!.tenantId,
        recipient: "ADMIN",
        type: "ADMIN_PROPERTY_ADDED",
        title: "New Property Added",
        message: `Owner ${req.user!.fullName || 'Unknown'} added a new property: ${name}.`,
        isRead: false,
        createdAt: now,
      });

      return reply.code(201).send({ ...doc, totalRooms, availableRooms });
    } catch (e) {
      const err = e as Error;
      return reply.code(400).send({ code: "BAD_REQUEST", message: err.message });
    }
  });


  // Update property as Owner
  app.put("/api/v1/owner/properties/:id", { preHandler: [requireAuth] }, async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      const body = req.body as any;
      const now = new Date().toISOString();

      const existing = await properties().findOne({ _id: id, tenantId: req.user!.tenantId, ownerId: req.user!.sub });
      if (!existing) return reply.code(404).send({ code: "NOT_FOUND", message: "Property not found" });

      const updates: any = { updatedAt: now };
      if (body.vacantBeds !== undefined) updates.vacantBeds = body.vacantBeds;
      if (body.totalBeds !== undefined) updates.totalBeds = body.totalBeds;
      if (body.pricePerBed !== undefined) updates.pricePerBed = body.pricePerBed;
      let changeDetails: string[] = [];
      if (body.vacantBeds !== undefined && body.vacantBeds !== existing.vacantBeds) {
        changeDetails.push(`vacant beds from ${existing.vacantBeds} to ${body.vacantBeds}`);
      }
      if (body.totalBeds !== undefined && body.totalBeds !== existing.totalBeds) {
        changeDetails.push(`total beds from ${existing.totalBeds} to ${body.totalBeds}`);
      }
      if (body.pricePerBed !== undefined && body.pricePerBed !== existing.pricePerBed) {
        changeDetails.push(`price from ₹${existing.pricePerBed} to ₹${body.pricePerBed}`);
      }
      if (body.availability !== undefined && body.availability === "FULL") {
         updates.vacantBeds = 0;
         if (existing.vacantBeds !== 0) {
             changeDetails.push(`marked as FULL`);
         }
      }

      const r = await properties().findOneAndUpdate(
        { _id: id },
        { $set: updates },
        { returnDocument: "after" }
      );

      let changeString = changeDetails.length > 0 ? ` Changes: ${changeDetails.join(', ')}.` : '';

      // Notify Admin
      await col("notifications").insertOne({
        _id: ulid(),
        tenantId: req.user!.tenantId,
        recipient: "ADMIN",
        type: "ADMIN_PROPERTY_UPDATED",
        title: "Property Updated",
        message: `Owner ${req.user!.fullName || 'Unknown'} updated ${existing.name}.${changeString}`,
        isRead: false,
        createdAt: now,
      });

      return reply.send(r);
    } catch (e) {
      const err = e as Error;
      return reply.code(400).send({ code: "BAD_REQUEST", message: err.message });
    }
  });

  // Update property
  app.put("/api/properties/:id", { preHandler: [requireAuth, requireScope("inventory.block")] }, async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      const body = UpdateBody.parse(req.body);
      const name = body.name.trim();
      
      const dupe = await properties().findOne({ tenantId: req.user!.tenantId, name, _id: { $ne: id } });
      if (dupe) return reply.code(409).send({ code: "CONFLICT", message: "Property name already exists" });
      
      const r = await properties().findOneAndUpdate(
        { _id: id, tenantId: req.user!.tenantId },
        {
          $set: {
            name,
            zoneId: body.zoneId,
            area: body.area.trim(),
            address: body.address.trim(),
            totalBeds: body.totalBeds,
            vacantBeds: body.vacantBeds,
            pricePerBed: body.pricePerBed,
            updatedAt: new Date().toISOString(),
          },
        },
        { returnDocument: "after" },
      );
      if (!r) return reply.code(404).send({ code: "NOT_FOUND", message: "Property not found" });
      return reply.send(propertyOut(r));
    } catch (e) {
      const err = e as Error;
      return reply.code(400).send({ code: "BAD_REQUEST", message: err.message });
    }
  });

  // Delete property
  app.delete("/api/properties/:id", { preHandler: [requireAuth, requireScope("inventory.block")] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const r = await properties().deleteOne({ _id: id, tenantId: req.user!.tenantId });
    if (r.deletedCount === 0) return reply.code(404).send({ code: "NOT_FOUND", message: "Property not found" });
    return reply.send({ ok: true });
  });
}

