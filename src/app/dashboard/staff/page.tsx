"use client";

import { useState, useEffect } from "react";

interface StaffUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  createdAt: string | null;
}

export default function StaffPage() {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: "", firstName: "", lastName: "", phone: "", password: "", role: "reception" });
  const [error, setError] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/staff");
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to add staff");
        return;
      }
      setShowForm(false);
      setForm({ email: "", firstName: "", lastName: "", phone: "", password: "", role: "reception" });
      fetchUsers();
    } catch {
      setError("Failed to add staff");
    }
  };

  const toggleActive = async (id: number, isActive: boolean) => {
    try {
      const res = await fetch("/api/admin/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !isActive }),
      });
      if (res.ok) fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const updateRole = async (id: number, role: string) => {
    try {
      const res = await fetch("/api/admin/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, role }),
      });
      if (res.ok) fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const roleColors: Record<string, string> = {
    admin: "bg-primary/10 text-primary",
    reception: "bg-accent/10 text-accent",
    customer: "bg-slate/10 text-slate",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-heading text-charcoal">Staff Management</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="ml-auto px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
        >
          {showForm ? "Cancel" : "Add Staff"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAddStaff} className="bg-white rounded-xl border border-cream-dark p-6 space-y-4">
          {error && <div className="p-3 bg-danger/10 text-danger text-sm rounded-lg">{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-charcoal mb-1">First Name</label>
              <input type="text" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required className="w-full px-3 py-2 rounded-lg border border-cream-dark bg-cream text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-charcoal mb-1">Last Name</label>
              <input type="text" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required className="w-full px-3 py-2 rounded-lg border border-cream-dark bg-cream text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-charcoal mb-1">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="w-full px-3 py-2 rounded-lg border border-cream-dark bg-cream text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-charcoal mb-1">Password</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required className="w-full px-3 py-2 rounded-lg border border-cream-dark bg-cream text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-charcoal mb-1">Phone</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-cream-dark bg-cream text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-charcoal mb-1">Role</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-cream-dark bg-cream text-sm focus:ring-2 focus:ring-primary/20 outline-none">
                <option value="reception">Reception</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <button type="submit" className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">Add Staff Member</button>
        </form>
      )}

      <div className="bg-white rounded-xl border border-cream-dark overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-cream-dark bg-cream/50">
              <th className="text-left px-4 py-3 font-medium text-charcoal">Name</th>
              <th className="text-left px-4 py-3 font-medium text-charcoal">Email</th>
              <th className="text-left px-4 py-3 font-medium text-charcoal">Role</th>
              <th className="text-left px-4 py-3 font-medium text-charcoal">Status</th>
              <th className="text-left px-4 py-3 font-medium text-charcoal">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-cream-dark/50 hover:bg-cream/30">
                <td className="px-4 py-3 font-medium text-charcoal">{user.firstName} {user.lastName}</td>
                <td className="px-4 py-3 text-slate">{user.email}</td>
                <td className="px-4 py-3">
                  <select
                    value={user.role}
                    onChange={(e) => updateRole(user.id, e.target.value)}
                    className={`text-xs px-2 py-0.5 rounded-full font-medium border-0 ${roleColors[user.role]}`}
                  >
                    <option value="admin">Admin</option>
                    <option value="reception">Reception</option>
                    <option value="customer">Customer</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium ${user.isActive ? "text-success" : "text-danger"}`}>
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleActive(user.id, user.isActive)}
                    className={`text-xs px-3 py-1 rounded ${user.isActive ? "bg-danger/10 text-danger hover:bg-danger/20" : "bg-success/10 text-success hover:bg-success/20"} transition-colors`}
                  >
                    {user.isActive ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
