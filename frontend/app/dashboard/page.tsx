"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getSKUs, getAgentsStatus, sweepCatalog } from "@/lib/api";
import { AgentPanel, type AgentId } from "@/components/AgentPanel";
import { ActionCard } from "@/components/ActionCard";
import { SKUTable } from "@/components/SKUTable";
import type { SKU, AgentsStatus } from "@/lib/types";

const AGENT_META: Record<AgentId, { title: string; desc: string; metrics: (s: AgentsStatus) => { label: string; value: string | number }[] }> = {
  orchestrator: {
    title: "Orchestrator Agent",
    desc: "Tüm SKU'ları periyodik tarar, 5 uzman ajandan gelen bulguları sentezler ve kök neden üretir.",
    metrics: (s) => [
      { label: "Katalog skoru ort.", value: s.catalog.avg_score },
      { label: "Fiyat uyarısı", value: s.competitive.price_alerts },
      { label: "Yüksek risk SKU", value: s.flow.high_risk_skus },
    ],
  },
  catalog: {
    title: "Catalog + Listing Agent",
    desc: "Ürün görsellerini FAL AI ile üretir veya temizler. İçerik kalitesini 0–100 karne ile puanlar.",
    metrics: (s) => [
      { label: "Bugün analiz", value: s.catalog.analyzed_today },
      { label: "Ortalama karne", value: s.catalog.avg_score },
      { label: "FAL çağrısı", value: s.catalog.fal_calls },
    ],
  },
  competitive: {
    title: "Competitive Intelligence Agent",
    desc: "Rakip fiyatları takip eder, attribute eksiklerini bulur, stok fırsatlarını raporlar.",
    metrics: (s) => [
      { label: "Fiyat alarmı", value: s.competitive.price_alerts },
      { label: "Ort. fark %", value: `${s.competitive.avg_diff_pct}%` },
      { label: "Tarama periyodu", value: "1 saat" },
    ],
  },
  sentiment: {
    title: "Review Sentiment Agent",
    desc: "Teknosa, Hepsiburada ve Trendyol yorumlarını tarar, tekrar eden şikayetleri tespit eder.",
    metrics: (s) => [
      { label: "Taranan yorum", value: s.sentiment.reviews_scanned },
      { label: "Servis uyarısı", value: s.sentiment.alerts },
      { label: "Kaynak", value: "3 platform" },
    ],
  },
  flow: {
    title: "Flow + Bundle Agent",
    desc: "Müşteri yolculuğundaki kopma noktalarını görür. Cross-sell fırsatlarını ve ROI'yi hesaplar.",
    metrics: (s) => [
      { label: "Terk eden kullanıcı", value: s.flow.abandoned_carts },
      { label: "Yüksek risk SKU", value: s.flow.high_risk_skus },
      { label: "Ort. terk oranı", value: "78%" },
    ],
  },
  returns: {
    title: "Returns Intelligence Agent",
    desc: "İade pattern'lerini analiz eder. 'Görsel yanıltıcı' iadesi yüksekse FAL ile yeni görsel üretir.",
    metrics: (s) => [
      { label: "Ort. iade oranı %", value: `${s.returns.return_rate_avg}%` },
      { label: "Görsel kaynaklı iade", value: s.returns.visual_issues },
      { label: "FAL tetiklemesi", value: s.returns.visual_issues },
    ],
  },
};

const QUICK_ACTIONS = [
  { title: "FAL Görsel Üretimi", description: "3 SKU'nun görseli eksik. flux/dev ile otomatik üretilsin mi?", priority: "high" as const },
  { title: "Fiyat Pozisyonu", description: "89 SKU piyasa fiyatının %5+ üzerinde. İndirim önerisi hazır.", priority: "high" as const },
  { title: "Açıklama Kalitesi", description: "24 SKU'nun açıklaması 50 karakterin altında. AI ile iyileştirilsin mi?", priority: "medium" as const },
  { title: "Bundle Fırsatı", description: "8 SKU'da cross-sell potansiyeli tespit edildi. Toplam etki: ₺42.000", priority: "low" as const },
];

export default function Dashboard() {
  const [agent, setAgent]   = useState<AgentId>("orchestrator");
  const [skus, setSkus]     = useState<SKU[]>([]);
  const [status, setStatus] = useState<AgentsStatus | null>(null);
  const [sweeping, setSweeping] = useState(false);

  useEffect(() => {
    getSKUs().then(setSkus).catch(console.error);
    getAgentsStatus().then(setStatus).catch(console.error);
  }, []);

  const handleSweep = async () => {
    setSweeping(true);
    try { await sweepCatalog(); } finally { setSweeping(false); }
  };

  const meta = AGENT_META[agent];

  return (
    <div className="min-h-screen flex">
      {/* Sol panel */}
      <div className="w-64 shrink-0 bg-white border-r border-gray-100 p-4 flex flex-col gap-2 sticky top-0 h-screen overflow-y-auto">
        <AgentPanel selected={agent} onSelect={setAgent} onSweep={handleSweep} sweeping={sweeping} />

        <div className="mt-auto pt-4 border-t border-gray-100">
          <Link
            href="/listing/new"
            className="block w-full text-center bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            + Yeni Ürün Ekle
          </Link>
        </div>
      </div>

      {/* Orta + sağ */}
      <div className="flex-1 flex overflow-hidden">
        {/* Orta */}
        <main className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* Agent persona kartı */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h1 className="text-xl font-bold text-gray-900">{meta.title}</h1>
            <p className="text-sm text-gray-500 mt-1 leading-relaxed">{meta.desc}</p>

            {status && (
              <div className="grid grid-cols-3 gap-4 mt-5">
                {meta.metrics(status).map((m) => (
                  <div key={m.label} className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-gray-900">{m.value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{m.label}</p>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-gray-400 mt-4 italic">
              Son sweep: 8 dakika önce · Çeşitli bulgulara rastlandı, aksiyon alalım mı?
            </p>
          </div>

          {/* SKU tablosu */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Katalog ({skus.length} SKU)</h2>
            {skus.length > 0 ? <SKUTable skus={skus} /> : (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-sm text-gray-400">
                Yükleniyor…
              </div>
            )}
          </div>
        </main>

        {/* Sağ panel — öneri kartları */}
        <aside className="w-72 shrink-0 p-4 overflow-y-auto space-y-3 border-l border-gray-100 bg-white">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Öneriler</h3>
          {QUICK_ACTIONS.map((a, i) => (
            <ActionCard key={i} title={a.title} description={a.description} priority={a.priority} />
          ))}
        </aside>
      </div>
    </div>
  );
}
