import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RoomCategoryCards from "@/components/RoomCategoryCards";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-cream">
      <Navbar />

      <section
        className="relative flex h-[90vh] items-center overflow-hidden"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(18, 28, 25, 0.82) 0%, rgba(18, 28, 25, 0.62) 40%, rgba(14, 22, 19, 0.45) 100%), url('/images/hero.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "linear-gradient(135deg, rgba(248, 240, 229, 0.18), rgba(248, 240, 229, 0.02))" }} />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="mb-4 text-sm uppercase tracking-[0.3em] text-accent animate-fade-in">Welcome to</p>
            <h1 className="mb-6 font-heading text-5xl leading-tight text-white sm:text-6xl lg:text-7xl animate-fade-in">
              Williams Yesumo
              <span className="block text-accent">Lodge</span>
            </h1>
            <p className="mb-8 max-w-lg text-lg leading-relaxed text-white/75 sm:text-xl animate-fade-in">
              Experience the perfect blend of comfort, elegance, and warm Ghanaian hospitality. Your home away from home.
            </p>
            <div className="flex flex-wrap gap-4 animate-fade-in">
              <Link
                href="/booking"
                className="inline-flex items-center rounded-lg bg-accent px-8 py-3.5 font-medium text-white transition-all hover:bg-accent-dark hover:shadow-lg hover:shadow-accent/20"
              >
                Book Your Stay
                <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="/rooms"
                className="inline-flex items-center rounded-lg border border-white/30 px-8 py-3.5 font-medium text-white transition-all hover:bg-white/10"
              >
                Explore Rooms
              </Link>
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-cream to-transparent" />
      </section>

      <section className="py-20 bg-cream">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 text-center">
            <p className="mb-2 text-sm uppercase tracking-[0.2em] text-accent">Accommodation</p>
            <h2 className="font-heading text-4xl text-charcoal">Our Room Categories</h2>
            <div className="mx-auto mt-4 h-1 w-16 bg-accent" />
          </div>

          <RoomCategoryCards />
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 text-center">
            <p className="mb-2 text-sm uppercase tracking-[0.2em] text-accent">Why Us</p>
            <h2 className="font-heading text-4xl text-charcoal">Why Choose Our Lodge</h2>
            <div className="mx-auto mt-4 h-1 w-16 bg-accent" />
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", title: "Comfortable Rooms", desc: "30 well-appointed rooms with modern amenities to ensure a restful stay." },
              { icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", title: "24/7 Service", desc: "Round-the-clock front desk service and support for all guests." },
              { icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2M9 19a2 2 0 002 2h6a2 2 0 002-2v-4", title: "Secure Booking", desc: "Safe online payments via Paystack with instant booking confirmation." },
              { icon: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.45M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064", title: "Ghana Location", desc: "Perfectly located to explore the beauty and culture of Ghana." },
            ].map((item) => (
              <div key={item.title} className="p-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                  <svg className="h-7 w-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                  </svg>
                </div>
                <h3 className="mb-2 font-heading text-lg text-charcoal">{item.title}</h3>
                <p className="text-sm text-slate">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-gradient-to-br from-primary-dark to-charcoal py-20">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=40 height=40 viewBox=%270 0 40 40%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cpath d=%27M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20h2V0h2v20h2V0h2v20h2V0h2v20h2V0h2v20.5z%27 fill=%27%23B87333%27 fill-opacity=%270.2%27 fill-rule=%27evenodd%27/%3E%3C/svg%3E')" }} />
        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
          <h2 className="mb-4 font-heading text-4xl text-white sm:text-5xl">
            Ready for a <span className="text-accent">Comfortable</span> Stay?
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-white/70">
            Book your room online and enjoy seamless check-in. Secure payments powered by Paystack.
          </p>
          
          <Link
            href="/booking"
            className="inline-flex items-center rounded-lg bg-accent px-10 py-4 text-lg font-medium text-white transition-all hover:bg-accent-dark hover:shadow-lg"
          >
            Reserve Your Room
            <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
