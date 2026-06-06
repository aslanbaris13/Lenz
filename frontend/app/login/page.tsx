"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Zap } from "lucide-react";
import { login, getPlatform } from "@/lib/auth";

export default function Login() {
  const router  = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("Email ve şifre zorunlu."); return; }
    setLoading(true);
    setError("");
    // Mock auth — 600ms delay
    await new Promise((r) => setTimeout(r, 600));
    login(email);
    setLoading(false);
    router.replace(getPlatform() ? "/dashboard" : "/onboarding");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "linear-gradient(135deg, #F7F7FB 0%, #EDE8FF 100%)" }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-10">
          <div className="w-9 h-9 rounded-xl bg-[#6C47FF] flex items-center justify-center shadow-lg shadow-violet-200">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold text-[#0F0F1C] tracking-tight">Lenz</span>
        </div>

        {/* Kart */}
        <div className="card p-8">
          <div className="mb-7">
            <h1 className="text-xl font-bold text-[#0F0F1C]">Hoş geldin</h1>
            <p className="text-sm text-[#64647A] mt-1">Hesabına giriş yap</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9898B0]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@email.com"
                  className="input pl-10"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="label">Şifre</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9898B0]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pl-10"
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2 flex items-center justify-center gap-2">
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : null}
              {loading ? "Giriş yapılıyor…" : "Giriş Yap"}
            </button>
          </form>

          <p className="text-center text-xs text-[#9898B0] mt-6">
            Demo için herhangi bir email ve şifre kullanabilirsin.
          </p>
        </div>

        <p className="text-center text-xs text-[#9898B0] mt-6">
          FAL AI Challenge · AImpact Hackathon 2026
        </p>
      </div>
    </div>
  );
}
