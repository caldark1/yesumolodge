"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          password: form.password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      router.push("/booking");
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <main className="min-h-screen bg-gradient-to-br from-charcoal to-primary-dark flex items-center justify-center px-4 pt-20 pb-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl font-heading">W</span>
          </div>
          <h1 className="text-3xl font-heading text-white mb-1">Create Account</h1>
          <p className="text-white/50 text-sm">Join Williams Yesumo Lodge</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl p-8">
          {error && (
            <div className="mb-4 p-3 bg-danger/10 text-danger text-sm rounded-lg">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">First Name</label>
              <input type="text" value={form.firstName} onChange={update("firstName")} required className="w-full px-3 py-2.5 rounded-lg border border-cream-dark bg-cream text-charcoal text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">Last Name</label>
              <input type="text" value={form.lastName} onChange={update("lastName")} required className="w-full px-3 py-2.5 rounded-lg border border-cream-dark bg-cream text-charcoal text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-charcoal mb-1.5">Email Address</label>
            <input type="email" value={form.email} onChange={update("email")} required className="w-full px-3 py-2.5 rounded-lg border border-cream-dark bg-cream text-charcoal text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-charcoal mb-1.5">Phone Number</label>
            <input type="tel" value={form.phone} onChange={update("phone")} placeholder="+233" className="w-full px-3 py-2.5 rounded-lg border border-cream-dark bg-cream text-charcoal text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-charcoal mb-1.5">Password</label>
            <input type="password" value={form.password} onChange={update("password")} required className="w-full px-3 py-2.5 rounded-lg border border-cream-dark bg-cream text-charcoal text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-charcoal mb-1.5">Confirm Password</label>
            <input type="password" value={form.confirmPassword} onChange={update("confirmPassword")} required className="w-full px-3 py-2.5 rounded-lg border border-cream-dark bg-cream text-charcoal text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
          </div>

          <button type="submit" disabled={loading} className="w-full py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50">
            {loading ? "Creating Account..." : "Create Account"}
          </button>

          <p className="text-center text-sm text-slate mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:text-primary-dark font-medium">Sign In</Link>
          </p>
        </form>
      </div>
    </main>
  );
}
