"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { loginUser } from "@/app/actions/auth";

const QUICK_ACCOUNTS = [
  { role: "Manufacturer", email: "manufacturer@pharmatrack.com", color: "blue" },
  { role: "Distributor", email: "distributor@pharmatrack.com", color: "indigo" },
  { role: "Retailer", email: "retailer@pharmatrack.com", color: "emerald" },
  { role: "Disposer", email: "disposer@pharmatrack.com", color: "amber" },
  { role: "Regulatory Host", email: "host@pharmatrack.com", color: "rose" },
];

function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeQuickRole, setActiveQuickRole] = useState<string | null>(null);

  useEffect(() => {
    const emailParam = searchParams.get("email");
    const autoParam = searchParams.get("auto");
    if (emailParam) {
      setEmail(emailParam);
      setPassword("password123");
      if (autoParam === "true") {
        handleLogin(undefined, emailParam, "password123");
      }
    }
  }, [searchParams]);

  const handleLogin = async (e?: React.FormEvent<HTMLFormElement>, customEmail?: string, customPassword?: string) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");

    const targetEmail = (customEmail || email).trim();
    const targetPassword = (customPassword || password).trim();

    const formData = new FormData();
    formData.set("email", targetEmail);
    formData.set("password", targetPassword);

    try {
      const res = await loginUser(formData);
      if (res.success && res.role) {
        // Full navigation with session sync
        window.location.href = `/${res.role}`;
      } else {
        setError(res.error || "Login failed. Please check credentials.");
        setLoading(false);
        setActiveQuickRole(null);
      }
    } catch (err: any) {
      setError("Network or server connection error: " + (err?.message || "Please retry."));
      setLoading(false);
      setActiveQuickRole(null);
    }
  };

  const handleQuickLogin = (role: string, quickEmail: string) => {
    setActiveQuickRole(role);
    setEmail(quickEmail);
    setPassword("password123");
    handleLogin(undefined, quickEmail, "password123");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden py-12 px-4">
      {/* Aesthetic blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400/10 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-400/10 blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md p-8 bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center p-2.5 bg-blue-50 rounded-2xl mb-3 text-blue-600 shadow-sm">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path>
            </svg>
          </Link>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Welcome Back</h1>
          <p className="text-slate-500 mt-1 text-sm">Sign in to your role portal</p>
        </div>

        {/* Quick 1-Click Role Login Chips */}
        <div className="mb-6 p-3 bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 text-center">
            ⚡ Quick Demo 1-Click Sign-In
          </p>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_ACCOUNTS.map((acc) => {
              const isThisLoading = activeQuickRole === acc.role;
              return (
                <button
                  key={acc.role}
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickLogin(acc.role, acc.email)}
                  className={`px-3 py-2 text-xs font-medium rounded-xl border transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 ${
                    isThisLoading
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-400/40'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-blue-400 hover:text-blue-600'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isThisLoading ? 'bg-white animate-ping' : 'bg-blue-500'}`}></span>
                  <span>{isThisLoading ? `Entering ${acc.role}...` : acc.role}</span>
                </button>
              );
            })}
          </div>
        </div>

        <form className="space-y-4" onSubmit={(e) => handleLogin(e)}>
          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <input 
              required
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/60 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-800 text-sm"
              placeholder="name@company.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input 
              required
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/60 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-800 text-sm"
              placeholder="••••••••"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full block text-center py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 transition-all active:scale-[0.98] mt-6 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In to Portal"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Need an account? <Link href="/register" className="text-blue-600 font-medium hover:underline">Register here</Link>.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-medium">Loading portal...</div>}>
      <LoginForm />
    </Suspense>
  );
}

