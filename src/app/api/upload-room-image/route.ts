import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { NextRequest, NextResponse } from "next/server";

const validCategories = new Set(["queen", "deluxe", "standard"]);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const category = String(formData.get("category") || "").trim();
    const file = formData.get("file");

    if (!validCategories.has(category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
    const dir = join(process.cwd(), "public", "images", "rooms", category);
    await mkdir(dir, { recursive: true });

    const filePath = join(dir, safeName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    return NextResponse.json({ url: `/images/rooms/${category}/${safeName}` });
  } catch (error) {
    console.error("Upload room image error:", error);
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
  }
}
