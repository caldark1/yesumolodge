import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { rooms, bookings } from "@/db/schema";
import { eq, and, ne, lte, gte } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { updateRoomStatuses } from "@/lib/room-utils";

export async function GET(request: NextRequest) {
  try {
    await updateRoomStatuses();

    const session = await getSession();
    const isAdminOrReception = session && (session.role === "admin" || session.role === "reception");

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const checkIn = searchParams.get("checkIn");
    const checkOut = searchParams.get("checkOut");
    const view = searchParams.get("view"); // "categories" for customer view

    const conditions = [];
    if (category) conditions.push(eq(rooms.category, category as "queen" | "deluxe" | "standard"));
    if (status) conditions.push(eq(rooms.status, status as "available" | "booked" | "maintenance"));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const allRooms = await db.select().from(rooms).where(whereClause);

    // Check date-based availability for each room
    const roomsWithAvailability = [];
    for (const room of allRooms) {
      if (checkIn && checkOut && room.status !== "maintenance") {
        const conflicting = await db
          .select({ id: bookings.id })
          .from(bookings)
          .where(
            and(
              eq(bookings.roomId, room.id),
              ne(bookings.status, "cancelled"),
              lte(bookings.checkIn, checkOut),
              gte(bookings.checkOut, checkIn)
            )
          )
          .limit(1);
        roomsWithAvailability.push({ ...room, availableForDates: conflicting.length === 0 });
      } else {
        roomsWithAvailability.push({
          ...room,
          availableForDates: room.status === "available",
        });
      }
    }

    // For customers: return category-level data only (no room numbers)
    if (!isAdminOrReception || view === "categories") {
      const categoryData: Record<string, {
        category: string;
        price: number;
        bedType: string;
        amenities: string[];
        description: string | null;
        totalRooms: number;
        availableRooms: number;
        bookedRooms: number;
        maintenanceRooms: number;
        fullyBooked: boolean;
      }> = {};

      for (const room of roomsWithAvailability) {
        if (!categoryData[room.category]) {
          categoryData[room.category] = {
            category: room.category,
            price: room.price,
            bedType: room.bedType,
            amenities: room.amenities,
            description: room.description,
            totalRooms: 0,
            availableRooms: 0,
            bookedRooms: 0,
            maintenanceRooms: 0,
            fullyBooked: false,
          };
        }
        categoryData[room.category].totalRooms++;
        if (checkIn && checkOut) {
          if (room.availableForDates) {
            categoryData[room.category].availableRooms++;
          } else if (room.status === "maintenance") {
            categoryData[room.category].maintenanceRooms++;
          } else {
            categoryData[room.category].bookedRooms++;
          }
        } else {
          if (room.status === "available") {
            categoryData[room.category].availableRooms++;
          } else if (room.status === "booked") {
            categoryData[room.category].bookedRooms++;
          } else if (room.status === "maintenance") {
            categoryData[room.category].maintenanceRooms++;
          }
        }
      }

      // Set fullyBooked flag
      for (const cat of Object.values(categoryData)) {
        cat.fullyBooked = cat.availableRooms === 0;
      }

      return NextResponse.json({ categories: Object.values(categoryData) });
    }

    // For admin/reception: return individual rooms with room numbers
    return NextResponse.json({ rooms: roomsWithAvailability });
  } catch (error) {
    console.error("Get rooms error:", error);
    return NextResponse.json({ error: "Failed to fetch rooms" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { roomNumber, category, price, bedType, amenities, description, floor } = body;

    const [newRoom] = await db.insert(rooms).values({
      roomNumber, category, price, bedType, amenities, description, floor: floor || 1, status: "available",
    }).returning();

    return NextResponse.json({ room: newRoom }, { status: 201 });
  } catch (error) {
    console.error("Create room error:", error);
    return NextResponse.json({ error: "Failed to create room" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "reception")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { id, status, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Room ID is required" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (status) updateData.status = status;
    if (updates.price) updateData.price = updates.price;
    if (updates.description) updateData.description = updates.description;

    const [updatedRoom] = await db.update(rooms).set(updateData).where(eq(rooms.id, id)).returning();
    if (!updatedRoom) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    return NextResponse.json({ room: updatedRoom });
  } catch (error) {
    console.error("Update room error:", error);
    return NextResponse.json({ error: "Failed to update room" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Room ID is required" }, { status: 400 });
    }

    await db.delete(rooms).where(eq(rooms.id, parseInt(id)));
    return NextResponse.json({ message: "Room deleted successfully" });
  } catch (error) {
    console.error("Delete room error:", error);
    return NextResponse.json({ error: "Failed to delete room" }, { status: 500 });
  }
}
