import { NextResponse } from "next/server";
import { db } from "@/db";
import { rooms, users } from "@/db/schema";
import bcrypt from "bcryptjs";
import { ROOM_DATA } from "@/lib/room-utils";

export async function POST() {
  try {
    // Seed rooms if they don't exist
    const existingRooms = await db.select().from(rooms);

    if (existingRooms.length === 0) {
      const roomValues = [];

      for (const [category, data] of Object.entries(ROOM_DATA)) {
        for (const roomNum of data.roomNumbers) {
          roomValues.push({
            roomNumber: roomNum,
            category: data.category,
            price: data.price,
            status: "available" as const,
            bedType: data.bedType,
            amenities: data.amenities,
            description: data.description,
            floor: roomNum <= 10 ? 1 : roomNum <= 20 ? 2 : 3,
          });
        }
      }

      await db.insert(rooms).values(roomValues);
    }

    // Seed admin user if doesn't exist
    const existingAdmin = await db.select().from(users).limit(1);

    if (existingAdmin.length === 0) {
      const hashedPassword = await bcrypt.hash("admin123", 12);

      await db.insert(users).values({
        email: "admin@williamsyesumo.com",
        password: hashedPassword,
        firstName: "Admin",
        lastName: "User",
        phone: "+233200000000",
        role: "admin",
      });

      // Create reception user
      const receptionPassword = await bcrypt.hash("reception123", 12);
      await db.insert(users).values({
        email: "reception@williamsyesumo.com",
        password: receptionPassword,
        firstName: "Reception",
        lastName: "Desk",
        phone: "+233200000001",
        role: "reception",
      });
    }

    return NextResponse.json({
      message: "Database seeded successfully",
      roomsCreated: existingRooms.length === 0 ? 30 : 0,
      adminCreated: existingAdmin.length === 0,
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "Failed to seed database" }, { status: 500 });
  }
}
