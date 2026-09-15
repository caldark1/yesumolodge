import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RoomCategoryCards from "@/components/RoomCategoryCards";

export default function RoomsPage() {
  return (
    <main className="min-h-screen bg-cream">
      <Navbar />

      <section
        className="pt-28 pb-12"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(23, 31, 29, 0.92), rgba(30, 48, 42, 0.84)), url('https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1800&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="mb-2 text-sm uppercase tracking-[0.2em] text-accent">Accommodation</p>
          <h1 className="mb-4 font-heading text-4xl text-white sm:text-5xl">Our Rooms</h1>
          <p className="max-w-lg text-white/70">
            Browse our curated room categories and discover the space, comfort, and amenities that fit your stay best.
          </p>
        </div>
      </section>

      <section className="py-12 bg-cream">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <RoomCategoryCards />
        </div>
      </section>

      <Footer />
    </main>
  );
}
