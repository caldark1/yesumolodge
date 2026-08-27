import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  date,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["admin", "reception", "customer"]);
export const roomStatusEnum = pgEnum("room_status", ["available", "booked", "maintenance"]);
export const roomCategoryEnum = pgEnum("room_category", ["queen", "deluxe", "standard"]);
export const bookingStatusEnum = pgEnum("booking_status", ["pending", "confirmed", "checked_in", "checked_out", "cancelled"]);
export const paymentStatusEnum = pgEnum("payment_status", ["unpaid", "paid", "refunded"]);
export const bookingSourceEnum = pgEnum("booking_source", ["online", "walk_in"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone"),
  role: roleEnum("role").default("customer").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  roomNumber: integer("room_number").notNull().unique(),
  category: roomCategoryEnum("category").notNull(),
  price: integer("price").notNull(),
  status: roomStatusEnum("status").default("available").notNull(),
  bedType: text("bed_type").notNull(),
  amenities: text("amenities").array().notNull(),
  description: text("description"),
  floor: integer("floor").default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  bookingId: text("booking_id").notNull().unique(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  roomId: integer("room_id").references(() => rooms.id, { onDelete: "restrict" }).notNull(),
  guestName: text("guest_name").notNull(),
  guestEmail: text("guest_email").notNull(),
  guestPhone: text("guest_phone"),
  checkIn: date("check_in").notNull(),
  checkOut: date("check_out").notNull(),
  status: bookingStatusEnum("status").default("pending").notNull(),
  amount: integer("amount").notNull(),
  paymentStatus: paymentStatusEnum("payment_status").default("unpaid").notNull(),
  paystackReference: text("paystack_reference"),
  accessCode: text("access_code"),
  isGuest: boolean("is_guest").default(false).notNull(),
  source: bookingSourceEnum("source").default("online").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").references(() => bookings.id, { onDelete: "cascade" }).notNull(),
  reference: text("reference").notNull().unique(),
  amount: integer("amount").notNull(),
  status: text("status").default("pending").notNull(),
  paystackResponse: jsonb("paystack_response"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
