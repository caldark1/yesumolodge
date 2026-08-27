import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-charcoal via-primary-dark to-charcoal" />
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=60 height=60 viewBox=%270 0 60 60%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cg fill=%27none%27 fill-rule=%27evenodd%27%3E%3Cg fill=%27%23B87333%27 fill-opacity=%270.15%27%3E%3Cpath d=%27M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%27/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')" }} />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-2xl">
            <p className="text-accent text-sm tracking-[0.3em] uppercase mb-4 animate-fade-in">
              Welcome to
            </p>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl text-white font-heading leading-tight mb-6 animate-fade-in">
              Williams Yesumo
              <span className="block text-accent">Lodge</span>
            </h1>
            <p className="text-white/70 text-lg sm:text-xl leading-relaxed mb-8 max-w-lg animate-fade-in">
              Experience the perfect blend of comfort, elegance, and warm Ghanaian hospitality. Your home away from home.
            </p>
            <div className="flex flex-wrap gap-4 animate-fade-in">
              <Link
                href="/booking"
                className="inline-flex items-center px-8 py-3.5 bg-accent text-white rounded-lg font-medium hover:bg-accent-dark transition-all hover:shadow-lg hover:shadow-accent/20"
              >
                Book Your Stay
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="/rooms"
                className="inline-flex items-center px-8 py-3.5 border border-white/30 text-white rounded-lg font-medium hover:bg-white/10 transition-all"
              >
                Explore Rooms
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative element */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-cream to-transparent" />
      </section>

      {/* Room Categories Section */}
      <section className="py-20 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-accent text-sm tracking-[0.2em] uppercase mb-2">Accommodation</p>
            <h2 className="text-4xl font-heading text-charcoal">Our Room Categories</h2>
            <div className="w-16 h-1 bg-accent mx-auto mt-4" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Queen Suite",
                price: 450,
                features: ["Queen Sized Bed", "Air Conditioning", "Television", "Fridge", "Free WiFi", "Hot Water"],
                desc: "Our finest room with a luxurious queen-sized bed and premium furnishings.",
                rooms: "10 rooms",
                accent: "from-primary-dark to-primary",
              },
              {
                name: "Deluxe Room",
                price: 300,
                features: ["Double Bed", "Air Conditioning", "Television", "Fridge", "Free WiFi", "Hot Water"],
                desc: "Spacious and comfortable with generous floor space and modern amenities.",
                rooms: "12 rooms",
                accent: "from-primary to-primary-light",
              },
              {
                name: "Standard Room",
                price: 250,
                features: ["Double Bed", "Air Conditioning", "Television", "Fridge", "Free WiFi", "Hot Water"],
                desc: "Comfortable and well-appointed with all essential amenities for a pleasant stay.",
                rooms: "8 rooms",
                accent: "from-primary-light to-primary-lighter",
              },
            ].map((room) => (
              <div
                key={room.name}
                className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-cream-dark"
              >
                <div className={`h-48 bg-gradient-to-br ${room.accent} flex items-center justify-center relative`}>
                  <div className="text-center">
                    <p className="text-white/80 text-sm mb-1">{room.name}</p>
                    <p className="text-white text-4xl font-heading">GH₵ {room.price}</p>
                    <p className="text-white/70 text-xs mt-1">per night</p>
                  </div>
                  <div className="absolute bottom-3 right-3 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                    <span className="text-white text-xs">{room.rooms}</span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-heading text-charcoal mb-2">{room.name}</h3>
                  <p className="text-slate text-sm mb-4">{room.desc}</p>
                  <ul className="space-y-1.5 mb-6">
                    {room.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-charcoal/70">
                        <svg className="w-4 h-4 text-success shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/booking"
                    className="block w-full text-center py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
                  >
                    Book Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-accent text-sm tracking-[0.2em] uppercase mb-2">Why Us</p>
            <h2 className="text-4xl font-heading text-charcoal">Why Choose Our Lodge</h2>
            <div className="w-16 h-1 bg-accent mx-auto mt-4" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", title: "Comfortable Rooms", desc: "30 well-appointed rooms with modern amenities to ensure a restful stay." },
              { icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", title: "24/7 Service", desc: "Round-the-clock front desk service and support for all guests." },
              { icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2M9 19a2 2 0 002 2h6a2 2 0 002-2v-4", title: "Secure Booking", desc: "Safe online payments via Paystack with instant booking confirmation." },
              { icon: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.45M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064", title: "Ghana Location", desc: "Perfectly located to explore the beauty and culture of Ghana." },
            ].map((item) => (
              <div key={item.title} className="text-center p-6">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                  </svg>
                </div>
                <h3 className="font-heading text-lg text-charcoal mb-2">{item.title}</h3>
                <p className="text-slate text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary-dark to-charcoal relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=40 height=40 viewBox=%270 0 40 40%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cpath d=%27M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20h2V0h2v20h2V0h2v20h2V0h2v20h2V0h2v20.5z%27 fill=%27%23B87333%27 fill-opacity=%270.2%27 fill-rule=%27evenodd%27/%3E%3C/svg%3E')" }} />
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl sm:text-5xl font-heading text-white mb-4">
            Ready for a <span className="text-accent">Comfortable</span> Stay?
          </h2>
          <p className="text-white/70 text-lg mb-8 max-w-2xl mx-auto">
            Book your room online and enjoy seamless check-in. Secure payments powered by Paystack.
          </p>
          <Link
            href="/booking"
            className="inline-flex items-center px-10 py-4 bg-accent text-white rounded-lg font-medium text-lg hover:bg-accent-dark transition-all hover:shadow-lg"
          >
            Reserve Your Room
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
