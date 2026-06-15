"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Zap, ArrowRight } from "lucide-react";
import { setPlatform } from "@/lib/auth";
import { clsx } from "clsx";

const PLATFORMS = [
  {
    id: "etsy",
    name: "Etsy",
    emoji: "🛍️",
    desc: "El yapımı ve vintage ürünler",
    color: "border-orange-200 bg-orange-50 text-orange-700",
    selected: "border-[#6C47FF] bg-violet-50",
  },
  {
    id: "trendyol",
    name: "Trendyol",
    emoji: "🇹🇷",
    desc: "Türkiye'nin lider marketplace",
    color: "border-rose-200 bg-rose-50 text-rose-700",
    selected: "border-[#6C47FF] bg-violet-50",
  },
  {
    id: "amazon",
    name: "Amazon",
    emoji: "📦",
    desc: "Global e-commerce devi",
    color: "border-amber-200 bg-amber-50 text-amber-700",
    selected: "border-[#6C47FF] bg-violet-50",
  },
  {
    id: "teknosa",
    name: "Teknosa",
    emoji: "💻",
    desc: "Türkiye'nin teknoloji mağazası",
    color: "border-blue-200 bg-blue-50 text-blue-700",
    selected: "border-[#6C47FF] bg-violet-50",
  },
] as const;

type PlatformId = typeof PLATFORMS[number]["id"];

export default function Onboarding() {
  const router = useRouter();
  const [selected, setSelected] = useState<PlatformId | null>(null);
  const [loading, setLoading]   = useState(false);

  const handleContinue = async () => {
    if (!selected) return;
    setLoading(true);
    setPlatform(selected);
    await new Promise((r) => setTimeout(r, 400));
    router.replace("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "linear-gradient(135deg, #F7F7FB 0%, #EDE8FF 100%)" }}>
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-10">
          <div className="w-9 h-9 rounded-xl bg-[#6C47FF] flex items-center justify-center shadow-lg shadow-violet-200">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold text-[#0F0F1C] tracking-tight">Lenz</span>
        </div>

        <div className="card p-8">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-[#0F0F1C]">Platform seç</h1>
            <p className="text-sm text-[#64647A] mt-2">
              Hangi platformda satış yapıyorsun? Lenz, seçtiğin platforma özel görsel ve içerik üretir.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-8">
            {PLATFORMS.map((p) => {
              const isSelected = selected === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelected(p.id)}
                  className={clsx(
                    "relative flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all duration-150 text-center",
                    isSelected
                      ? "border-[#6C47FF] bg-violet-50 shadow-md shadow-violet-100"
                      : "border-[#E4E4EF] bg-white hover:border-[#6C47FF]/40 hover:bg-violet-50/30"
                  )}
                >
                  {isSelected && (
                    <CheckCircle className="absolute top-3 right-3 w-4 h-4 text-[#6C47FF]" />
                  )}
                  <span className="text-3xl">{p.emoji}</span>
                  <div>
                    <p className={clsx("font-bold text-sm", isSelected ? "text-[#6C47FF]" : "text-[#0F0F1C]")}>
                      {p.name}
                    </p>
                    <p className="text-xs text-[#9898B0] mt-0.5 leading-tight">{p.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <button
            onClick={handleContinue}
            disabled={!selected || loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
            {loading ? "Hazırlanıyor…" : "Devam Et"}
          </button>
        </div>

        <p className="text-center text-xs text-[#9898B0] mt-6">
          Daha sonra ayarlardan değiştirebilirsin.
        </p>
      </div>
    </div>
  );
}
