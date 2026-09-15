"use client";

import { useEffect, useMemo, useState } from "react";

type CategoryItem = {
  category: "queen" | "deluxe" | "standard";
  name: string;
  price: number;
  description: string;
  policy: string;
  amenities: string[];
  images: string[];
  badge: string;
  accent: string;
};

const defaultCategoryData: Record<string, CategoryItem> = {
  queen: {
    category: "queen",
    name: "Queen Suite",
    price: 450,
    description: "A refined premium suite with a spacious queen-size bed, elevated finishes, and a calming luxury feel for longer stays.",
    policy: "Check-in from 2:00 PM. Check-out by 12:00 PM. Complimentary breakfast can be added on request. Cancellation within 48 hours is subject to a one-night fee.",
    amenities: ["Queen Bed", "Air Conditioning", "DSTV", "Fridge", "Free WiFi", "Hot Water", "Workspace"],
    images: ["https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80"],
    badge: "Luxury stay",
    accent: "from-primary-dark via-primary to-charcoal",
  },
  deluxe: {
    category: "deluxe",
    name: "Deluxe Room",
    price: 350,
    description: "Our signature deluxe room pairs generous space with a warm, modern aesthetic designed for rest, work, and easy comfort.",
    policy: "Flexible check-in from 2:00 PM. Late check-out is subject to availability. Children under 12 stay free when sharing a bed with parents.",
    amenities: ["Double Bed", "Air Conditioning", "DSTV", "Fridge", "Free WiFi", "Hot Water", "Room Service"],
    images: ["https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80"],
    badge: "Most booked",
    accent: "from-primary via-primary-light to-primary-dark",
  },
  standard: {
    category: "standard",
    name: "Standard Room",
    price: 300,
    description: "A welcoming and practical option with all the essentials for a comfortable and restful stay at a great value.",
    policy: "Standard check-in from 2:00 PM and check-out by 12:00 PM. Valid ID is required at arrival. Early check-in is subject to room availability.",
    amenities: ["Double Bed", "Air Conditioning", "DSTV", "Fridge", "Free WiFi", "Hot Water"],
    images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80"],
    badge: "Great value",
    accent: "from-primary-light via-amber-200 to-primary",
  },
};

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxWidth = 1600;
        const scale = Math.min(maxWidth / img.width, 1);
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL("image/jpeg", 0.72);
        resolve(compressed);
      };
      img.onerror = () => reject(new Error("Could not decode image"));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error("Could not read image"));
    reader.readAsDataURL(file);
  });
}

export default function DashboardUpdatePage() {
  const [catalog, setCatalog] = useState<Record<string, CategoryItem>>(defaultCategoryData);
  const [selected, setSelected] = useState<"queen" | "deluxe" | "standard">("deluxe");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/room-categories");
        const data = await res.json();
        if (data.categories?.length) {
          const next: Record<string, CategoryItem> = {};
          for (const item of data.categories) {
            next[item.category] = item;
          }
          setCatalog(next);
          setSelected((prev) => (next[prev] ? prev : "deluxe"));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const selectedRoom = useMemo(() => catalog[selected], [catalog, selected]);

  const updateSelected = (patch: Partial<CategoryItem>) => {
    setCatalog((current) => ({
      ...current,
      [selected]: {
        ...current[selected],
        ...patch,
      },
    }));
  };

  const addImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    try {
      const uploadedUrls: string[] = [];

      for (const file of files) {
        const compressedDataUrl = await compressImage(file);
        const blob = await fetch(compressedDataUrl).then((response) => response.blob());
        const optimizedFile = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });

        const formData = new FormData();
        formData.append("category", selected);
        formData.append("file", optimizedFile);

        const res = await fetch("/api/upload-room-image", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to upload the image.");
        }

        uploadedUrls.push(data.url);
      }

      const images = [...(selectedRoom.images || []), ...uploadedUrls];
      updateSelected({ images });
      event.target.value = "";
    } catch (err) {
      console.error(err);
      setError("Could not process the selected image(s). Please try smaller files.");
    }
  };

  const removeImage = (index: number) => {
    const nextImages = selectedRoom.images.filter((_, imageIndex) => imageIndex !== index);
    updateSelected({ images: nextImages });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        category: selected,
        name: selectedRoom.name,
        price: Number(selectedRoom.price),
        description: selectedRoom.description,
        policy: selectedRoom.policy,
        amenities: selectedRoom.amenities,
        images: selectedRoom.images,
        badge: selectedRoom.badge,
        accent: selectedRoom.accent,
      };

      const res = await fetch("/api/room-categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not save updates");
      }

      setCatalog((current) => ({
        ...current,
        [selected]: data.category,
      }));
      setSuccess("Room category updates saved successfully.");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Could not save updates.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-heading text-charcoal">Room Update</h2>
          <p className="text-sm text-slate">Update room info, pricing, photos, and category content.</p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || loading}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-70"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div>}

      <div className="grid gap-4 lg:grid-cols-[1.1fr_1.9fr]">
        <div className="rounded-[24px] border border-cream-dark bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm uppercase tracking-[0.2em] text-accent">Categories</h3>
          <div className="space-y-3">
            {(Object.entries(catalog) as [string, CategoryItem][]).map(([key, room]) => (
              <button
                key={key}
                type="button"
                onClick={() => setSelected(key as "queen" | "deluxe" | "standard")}
                className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition-colors ${
                  selected === key ? "border-primary bg-primary/5" : "border-cream-dark bg-cream"
                }`}
              >
                <div>
                  <p className="font-heading text-charcoal">{room.name}</p>
                  <p className="text-xs text-slate">GH₵ {room.price} / night</p>
                </div>
                <span className="rounded-full bg-white px-2 py-1 text-[10px] font-medium uppercase tracking-[0.08em] text-charcoal/70">
                  {room.images.length} photos
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[24px] border border-cream-dark bg-white p-5 shadow-sm">
          {loading ? (
            <div className="flex h-60 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
          ) : (
            <>
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-accent">Editing</p>
                  <h3 className="font-heading text-3xl text-charcoal">{selectedRoom.name}</h3>
                </div>
                <span className="rounded-full bg-cream-dark px-3 py-1 text-xs font-medium text-charcoal/80">{selectedRoom.images.length} photos</span>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-charcoal">Category name</span>
                  <input
                    value={selectedRoom.name}
                    onChange={(event) => updateSelected({ name: event.target.value })}
                    className="w-full rounded-lg border border-cream-dark bg-cream px-3 py-2.5 text-sm text-charcoal outline-none focus:border-primary"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-charcoal">Price per night</span>
                  <input
                    type="number"
                    value={selectedRoom.price}
                    onChange={(event) => updateSelected({ price: Number(event.target.value) || 0 })}
                    className="w-full rounded-lg border border-cream-dark bg-cream px-3 py-2.5 text-sm text-charcoal outline-none focus:border-primary"
                  />
                </label>
              </div>

              <div className="mt-5">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-charcoal">Short description</span>
                  <textarea
                    value={selectedRoom.description}
                    onChange={(event) => updateSelected({ description: event.target.value })}
                    rows={4}
                    className="w-full rounded-lg border border-cream-dark bg-cream px-3 py-2.5 text-sm text-charcoal outline-none focus:border-primary"
                  />
                </label>
              </div>

              <div className="mt-5">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-charcoal">Stay policy</span>
                  <textarea
                    value={selectedRoom.policy}
                    onChange={(event) => updateSelected({ policy: event.target.value })}
                    rows={4}
                    className="w-full rounded-lg border border-cream-dark bg-cream px-3 py-2.5 text-sm text-charcoal outline-none focus:border-primary"
                  />
                </label>
              </div>

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-charcoal">Room gallery</span>
                  <label className="cursor-pointer text-xs font-medium text-primary hover:text-primary-dark">
                    Add photo
                    <input type="file" accept="image/*" multiple className="hidden" onChange={addImage} />
                  </label>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {selectedRoom.images.map((image, index) => (
                    <div key={`${selected}-${index}`} className="overflow-hidden rounded-xl border border-cream-dark bg-cream">
                      <div className="relative">
                        <img src={image} alt={`${selectedRoom.name} photo ${index + 1}`} className="h-28 w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute right-2 top-2 rounded-full bg-charcoal/80 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.08em] text-white transition-colors hover:bg-charcoal"
                        >
                          Remove
                        </button>
                      </div>
                      <input
                        value={image}
                        onChange={(event) => {
                          const nextImages = [...selectedRoom.images];
                          nextImages[index] = event.target.value;
                          updateSelected({ images: nextImages });
                        }}
                        className="w-full border-t border-cream-dark bg-transparent px-2 py-2 text-[11px] text-slate outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
