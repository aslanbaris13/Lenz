"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, PackageSearch, TrendingUp,
  MessageSquare, BarChart2, RotateCcw,
  Plus, RefreshCw, Zap, LogOut, ChevronRight,
} from "lucide-react";
import { getSKUs, getAgentsStatus, sweepCatalog } from "@/lib/api";
import { logout, getEmail, getPlatform } from "@/lib/auth";
import { ActionCard } from "@/components/ActionCard";
import { SKUTable } from "@/components/SKUTable";
import type { SKU, AgentsStatus } from "@/lib/types";
import { clsx } from "clsx";

// ── Agent tanımları ──────────────────────────────────────

type AgentId = "orchestrator" | "catalog" | "competitive" | "sentiment" | "flow" | "returns";

const AGENTS: Array<{
  id: AgentId; label: string; icon: React.ReactNode;
  active: string; fal?: boolean;
}> = [
  { id: "orchestrator", label: "Orchestrator",    icon: <LayoutDashboard className="w-4 h-4" />, active: "bg-violet-600 text-white" },
  { id: "catalog",      label: "Catalog + Listing", icon: <PackageSearch   className="w-4 h-4" />, active: "bg-emerald-600 text-white", fal: true },
  { id: "competitive",  label: "Competitive",     icon: <TrendingUp      className="w-4 h-4" />, active: "bg-blue-600 text-white" },
  { id: "sentiment",    label: "Sentiment",       icon: <MessageSquare   className="w-4 h-4" />, active: "bg-rose-600 text-white" },
  { id: "flow",         label: "Flow + Bundle",   icon: <BarChart2       className="w-4 h-4" />, active: "bg-amber-600 text-white" },
  { id: "returns",      label: "Returns",         icon: <RotateCcw       className="w-4 h-4" />, active: "bg-slate-600 text-white" },
];

const AGENT_INFO: Record<AgentId, {
  title: string; desc: string;
  metrics: (s: AgentsStatus) => Array<{ label: string; value: string | number }>;
  note: string;
}> = {
  orchestrator: {
    title: "Orchestrator Agent",
    desc: "Tüm SKU'ları periyodik tarar. 5 uzman ajandan bulguları toplar, kök neden üretir ve operasyon ekibine öneri sunar.",
    metrics: (s) => [
      { label: "Ort. karne",    value: s.catalog.avg_score },
      { label: "Fiyat alarmı", value: s.competitive.price_alerts },
      { label: "Yüksek risk",  value: s.flow.high_risk_skus },
    ],
    note: "Son sweep 8 dk önce tamamlandı.",
  },
  catalog: {
    title: "Catalog + Listing Agent",
    desc: "Ürün görsellerini FAL AI ile üretir veya temizler. İçerik kalitesini 0–100 karne ile puanlar, eksikleri raporlar.",
    metrics: (s) => [
      { label: "Bugün analiz", value: s.catalog.analyzed_today },
      { label: "Ort. karne",   value: s.catalog.avg_score },
      { label: "FAL çağrısı",  value: s.catalog.fal_calls },
    ],
    note: "flux/dev · birefnet · florence-2 aktif.",
  },
  competitive: {
    title: "Competitive Intelligence",
    desc: "Hepsiburada, Trendyol ve MediaMarkt fiyatlarını takip eder. Attribute eksiklerini bulur, stok fırsatlarını raporlar.",
    metrics: (s) => [
      { label: "Fiyat alarmı",  value: s.competitive.price_alerts },
      { label: "Ort. fark %",   value: `${s.competitive.avg_diff_pct}%` },
      { label: "Kaynak",        value: "3 platform" },
    ],
    note: "Her saat otomatik güncellenir.",
  },
  sentiment: {
    title: "Review Sentiment Agent",
    desc: "3 platformdaki yorumları tarar. Tekrar eden şikayetleri tespit eder, servis uyarısı üretir.",
    metrics: (s) => [
      { label: "Taranan yorum", value: s.sentiment.reviews_scanned },
      { label: "Servis uyarısı",value: s.sentiment.alerts },
      { label: "Platform",      value: "3 kaynak" },
    ],
    note: "NLP ile duygu analizi yapılıyor.",
  },
  flow: {
    title: "Flow + Bundle Agent",
    desc: "Müşteri yolculuğundaki kopma noktalarını bulur. Cross-sell fırsatlarını ve ROI'yi hesaplar.",
    metrics: (s) => [
      { label: "Terk eden",   value: s.flow.abandoned_carts },
      { label: "Yüksek risk", value: s.flow.high_risk_skus },
      { label: "Ort. terk",   value: "78%" },
    ],
    note: "Remarketing önerileri hazır.",
  },
  returns: {
    title: "Returns Intelligence",
    desc: "İade pattern'lerini analiz eder. 'Görsel yanıltıcı' iadesi yüksekse FAL ile otomatik yeni görsel üretir.",
    metrics: (s) => [
      { label: "İade oranı %",  value: `${s.returns.return_rate_avg}%` },
      { label: "Görsel kaynaklı", value: s.returns.visual_issues },
      { label: "FAL tetikleme", value: s.returns.visual_issues },
    ],
    note: "FAL koşullu tetikleme aktif.",
  },
};

const QUICK_ACTIONS = [
  { title: "3 SKU'nun görseli eksik",         description: "FAL flux/dev ile otomatik üretilsin mi?",             priority: "high"   as const },
  { title: "89 SKU piyasadan pahalı",          description: "Ortalama %11.2 fark. İndirim önerisi hazırlandı.",    priority: "high"   as const },
  { title: "24 SKU açıklaması yetersiz",       description: "50 karakterin altında. AI ile iyileştirilebilir.",    priority: "medium" as const },
  { title: "Cross-sell fırsatı tespit edildi", description: "8 SKU'da bundle potansiyeli. Toplam etki: ₺42.000.", priority: "low"    as const },
];

// ── Component ────────────────────────────────────────────

export default function Dashboard() {
  const router  = useRouter();
  const [agent, setAgent]       = useState<AgentId>("orchestrator");
  const [skus, setSkus]         = useState<SKU[]>([]);
  const [status, setStatus]     = useState<AgentsStatus | null>(null);
  const [sweeping, setSweeping] = useState(false);

  const email    = typeof window !== "undefined" ? getEmail()    : null;
  const platform = typeof window !== "undefined" ? getPlatform() : null;

  useEffect(() => {
    getSKUs().then(setSkus).catch(console.error);
    getAgentsStatus().then(setStatus).catch(console.error);
  }, []);

  const handleSweep = async () => {
    setSweeping(true);
    try { await sweepCatalog(); } finally { setSweeping(false); }
  };

  const handleLogout = () => { logout(); router.replace("/login"); };

  const info = AGENT_INFO[agent];
  const agentDef = AGENTS.find((a) => a.id === agent)!;

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg)" }}>

      {/* ── Sol sidebar ────────────────────────────────── */}
      <aside className="w-60 shrink-0 bg-white border-r border-[#E4E4EF] flex flex-col sticky top-0 h-screen">
        {/* Logo */}
        <div className="px-5 pt-5 pb-4 border-b border-[#E4E4EF]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#6C47FF] flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-[#0F0F1C] text-base tracking-tight">Lenz</span>
            {platform && (
              <span className="ml-auto text-[10px] font-semibold bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full capitalize">
                {platform}
              </span>
            )}
          </div>
        </div>

        {/* Agent listesi */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="px-2 text-[10px] font-semibold text-[#9898B0] uppercase tracking-widest mb-2">Agents</p>
          {AGENTS.map((a) => {
            const isActive = agent === a.id;
            return (
              <button
                key={a.id}
                onClick={() => setAgent(a.id)}
                className={clsx(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-[#6C47FF] text-white shadow-md shadow-violet-200"
                    : "text-[#64647A] hover:bg-[#F0F0F8] hover:text-[#0F0F1C]"
                )}
              >
                {a.icon}
                <span className="flex-1 text-left">{a.label}</span>
                {a.fal && (
                  <span className={clsx(
                    "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide",
                    isActive ? "bg-white/20 text-white" : "bg-violet-100 text-violet-600"
                  )}>FAL</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Alt kısım */}
        <div className="px-3 pb-4 space-y-2 border-t border-[#E4E4EF] pt-3">
          <Link href="/listing/new" className="btn-primary w-full flex items-center justify-center gap-2 text-xs">
            <Plus className="w-3.5 h-3.5" /> Yeni Ürün
          </Link>
          <button
            onClick={handleSweep}
            disabled={sweeping}
            className="btn-secondary w-full flex items-center justify-center gap-2 text-xs"
          >
            <RefreshCw className={clsx("w-3.5 h-3.5", sweeping && "animate-spin")} />
            {sweeping ? "Taranıyor…" : "Sweep Başlat"}
          </button>
          <button onClick={handleLogout} className="btn-ghost w-full flex items-center gap-2 px-3 py-2 text-xs">
            <LogOut className="w-3.5 h-3.5" />
            <span>{email ?? "Çıkış Yap"}</span>
          </button>
        </div>
      </aside>

      {/* ── Ana içerik ─────────────────────────────────── */}
      <div className="flex-1 flex min-w-0">
        <main className="flex-1 p-6 overflow-y-auto space-y-5 min-w-0">

          {/* Sayfa başlığı */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-[#0F0F1C]">Dashboard</h1>
              <p className="text-sm text-[#64647A]">Katalog zekası · gerçek zamanlı</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#9898B0]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Canlı
            </div>
          </div>

          {/* Agent persona kartı */}
          <div className="card p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className={clsx("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", agentDef.active)}>
                {agentDef.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[#0F0F1C]">{info.title}</p>
                <p className="text-xs text-[#64647A] leading-relaxed mt-0.5">{info.desc}</p>
              </div>
            </div>

            {status && (
              <div className="grid grid-cols-3 gap-3">
                {info.metrics(status).map((m) => (
                  <div key={m.label} className="bg-[#F7F7FB] rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-[#0F0F1C]">{m.value}</p>
                    <p className="text-[11px] text-[#9898B0] mt-0.5">{m.label}</p>
                  </div>
                ))}
              </div>
            )}

            <p className="text-[11px] text-[#9898B0] mt-3 italic">{info.note}</p>
          </div>

          {/* SKU tablosu */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-[#0F0F1C]">Katalog <span className="text-[#9898B0] font-normal">({skus.length} SKU)</span></p>
              <Link href="/listing/new" className="btn-ghost flex items-center gap-1 text-xs text-[#6C47FF]">
                Yeni ekle <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {skus.length > 0
              ? <SKUTable skus={skus} />
              : <div className="card p-12 text-center text-sm text-[#9898B0]">Yükleniyor…</div>
            }
          </div>
        </main>

        {/* ── Sağ panel — öneriler ─────────────────────── */}
        <aside className="w-64 shrink-0 border-l border-[#E4E4EF] bg-white p-4 overflow-y-auto">
          <p className="text-[10px] font-semibold text-[#9898B0] uppercase tracking-widest mb-3">Öneriler</p>
          <div className="space-y-2.5">
            {QUICK_ACTIONS.map((a, i) => (
              <ActionCard key={i} title={a.title} description={a.description} priority={a.priority} />
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
