"use client";

import Link from "next/link";
import { useState } from "react";
import { registerUser } from "@/app/actions/auth";

export default function RegisterPage() {
  const [role, setRole] = useState("manufacturer");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    formData.set("role", role); // Ensure role is correctly bound

    const res = await registerUser(formData);
    
    if (res.success && res.role) {
      // Use window.location.href to guarantee full session cookie synchronization
      window.location.href = `/${res.role}`;
    } else {
      setError(res.error || "Registration failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden py-12 px-4">
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-400/10 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400/10 blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md p-8 bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white z-10 my-4">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center p-2.5 bg-emerald-50 rounded-2xl mb-3 text-emerald-600 shadow-sm">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
            </svg>
          </Link>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Create Account</h1>
          <p className="text-slate-500 mt-1 text-sm">Join the secure pharmaceutical supply chain</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Company / Organization Name</label>
            <input 
              required
              name="name"
              type="text" 
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/60 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm text-slate-800"
              placeholder="e.g. Acme Pharma Inc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <input 
              required
              name="email"
              type="email" 
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/60 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm text-slate-800"
              placeholder="contact@company.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input 
              required
              name="password"
              type="password" 
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/60 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm text-slate-800"
              placeholder="••••••••"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Select Your Role</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'manufacturer', label: 'Manufacturer' },
                { id: 'distributor', label: 'Distributor' },
                { id: 'retailer', label: 'Retailer' },
                { id: 'disposer', label: 'Disposer' }
              ].map((r) => (
                <label 
                  key={r.id}
                  className={`
                    flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer transition-all
                    ${role === r.id 
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-400' 
                      : 'border-slate-200 bg-white/50 text-slate-600 hover:bg-slate-50'}
                  `}
                >
                  <input 
                    type="radio" 
                    name="roleSelection" 
                    value={r.id} 
                    className="sr-only"
                    checked={role === r.id}
                    onChange={(e) => setRole(e.target.value)}
                  />
                  <span className="text-sm font-medium capitalize">{r.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Facility Premises & Courier Logistics Address */}
          <div className="pt-3 pb-1 border-t border-slate-100">
            <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Facility & Courier Address</span>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full border border-emerald-200/60">
                For Delivery & Regulatory Audits
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              Physical address used for courier shipping labels, OCG gatepass generation, and regulatory field inspections.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Premises / Facility Street Address *</label>
            <input 
              required
              name="address"
              type="text" 
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/60 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm text-slate-800"
              placeholder="e.g. Plot 18-20, MIDC Industrial Area, Phase II"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">City / District *</label>
              <input 
                required
                name="city"
                type="text" 
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/60 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm text-slate-800"
                placeholder="e.g. Navi Mumbai"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">State / Province *</label>
              <input 
                required
                name="state"
                type="text" 
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/60 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm text-slate-800"
                placeholder="e.g. Maharashtra"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">PIN / Postal Code *</label>
              <input 
                required
                name="pincode"
                type="text" 
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/60 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm text-slate-800 font-mono"
                placeholder="e.g. 400705"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Contact Phone</label>
              <input 
                name="phone"
                type="tel" 
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/60 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm text-slate-800"
                placeholder="e.g. +91 98201 12345"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Drug License / Regulatory Permit No. <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input 
              name="licenseNumber"
              type="text" 
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/60 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm text-slate-800 font-mono uppercase"
              placeholder="e.g. DL-20B/21B-MH-78412"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full block text-center py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/35 transition-all active:scale-[0.98] mt-6 disabled:opacity-60"
          >
            {loading ? "Creating Account..." : "Complete Registration"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account? <Link href="/login" className="text-emerald-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
