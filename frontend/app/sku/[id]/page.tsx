"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Star, TrendingDown, AlertCircle, Loader2 } from "lucide-react";
import { getSKU, analyzeSKU } from "@/lib/api";
import { ActionCard } from "@/components/ActionCard";
import { FunnelChart } from "@/components/FunnelChart";
import type { SKU, AnalysisResult } from "@/lib/types";
import { clsx } from "clsx";

const RISK_BADGE: Record<string, string> = {
  HIGH:   "bg-red-100 text-red-700",
  MEDIUM: "bg-amber-100 text-amber-700",
  LOW:    "bg-emerald-100 text-emerald-700",
};

function ScoreBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = (value / max) * 100;
  const color = pct >= 70 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500";
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-600 mb-1">
        <span>{label}</span>
        <span>{value}/{max}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={clsx("h-full rounded-full transition-all duration-700", color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function SKUDetail() {
  const { id } = useParams<{ id: string }>();
  const [sku, setSku]         = useState<SKU | null>(null);
  const [result, setResult]   = useState<AnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError]     = useState("");

  useEffect(() => {
    getSKU(id).then(setSku).catch(console.error);
  }, [id]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError("");
    try {
      const data = await analyzeSKU(id);
      setResult(data);
    } catch {
      setError("Analiz başarısız. Backend çalışıyor mu?");
    } finally {
      setAnalyzing(false);
    }
  };

  if (!sku) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">
      <Loader2 className="w-6 h-6 animate-spin mr-2" /> Yükleniyor…
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Başlık */}
        <div className="flex items-start gap-3">
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-700 mt-1">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <p className="text-xs font-mono text-gray-400">{sku.id}</p>
            <h1 className="text-2xl font-bold text-gray-900">{sku.name}</h1>
            <p className="text-sm text-gray-500">{sku.category} · {sku.brand}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">{sku.price.toLocaleString("tr-TR")} ₺</p>
            <p className="text-xs text-gray-400">{sku.sales} satış</p>
          </div>
        </div>

        {/* Analiz butonu */}
        {!result && !analyzing && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <p className="text-gray-500 mb-4 text-sm">5 ajan paralel çalışır, Anthropic ile sentez üretir</p>
            <button
              onClick={handleAnalyze}
              className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-3 rounded-xl font-semibold text-sm transition-colors"
            >
              Analiz Başlat
            </button>
            {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
          </div>
        )}

        {/* Loading */}
        {analyzing && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-violet-600 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">Ajanlar çalışıyor…</p>
            <p className="text-xs text-gray-400 mt-1">Orchestrator → Catalog · Competitive · Sentiment · Flow</p>
          </div>
        )}

        {/* Sonuçlar */}
        {result && (
          <div className="space-y-4">
            {/* 1. Orchestrator sentezi */}
            <div className="bg-violet-50 border border-violet-200 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-violet-900">Orchestrator Sentezi</h2>
                <span className={clsx("text-xs px-2 py-0.5 rounded-full font-semibold", RISK_BADGE[result.synthesis.risk_level])}>
                  {result.synthesis.risk_level}
                </span>
              </div>
              <p className="text-sm font-semibold text-violet-800 mb-1">Kök Neden</p>
              <p className="text-sm text-violet-700 mb-3">{result.synthesis.root_cause}</p>
              <p className="text-sm font-semibold text-violet-800 mb-1">Özet</p>
              <p className="text-sm text-violet-700 mb-3">{result.synthesis.summary}</p>
              <p className="text-sm font-semibold text-violet-800 mb-2">Öncelikli Aksiyonlar</p>
              <ul className="space-y-1">
                {result.synthesis.priority_actions.map((a, i) => (
                  <li key={i} className="text-sm text-violet-700 flex gap-2">
                    <span className="font-bold">{i + 1}.</span> {a}
                  </li>
                ))}
              </ul>
            </div>

            {/* 2. Catalog */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900">Catalog Agent</h2>
                <span className={clsx("text-2xl font-bold", result.catalog.total_score >= 70 ? "text-emerald-600" : result.catalog.total_score >= 50 ? "text-amber-600" : "text-red-600")}>
                  {result.catalog.total_score}/100
                </span>
              </div>
              <div className="space-y-2.5 mb-4">
                <ScoreBar label="Görsel"       value={result.catalog.breakdown.image}       max={20} />
                <ScoreBar label="Açıklama"     value={result.catalog.breakdown.description} max={30} />
                <ScoreBar label="Teknik Öz."   value={result.catalog.breakdown.specs}       max={30} />
                <ScoreBar label="Kategori"     value={result.catalog.breakdown.category}    max={20} />
              </div>
              {result.catalog.fal_results.generated_image && (
                <div className="mb-4 p-3 bg-emerald-50 rounded-xl text-xs text-emerald-700 flex gap-2 items-start">
                  <span>✓</span>
                  <div>
                    <p className="font-semibold">FAL flux/dev — Görsel üretildi</p>
                    <a href={result.catalog.fal_results.generated_image} target="_blank" rel="noreferrer" className="underline truncate block max-w-xs">
                      {result.catalog.fal_results.generated_image.slice(0, 60)}…
                    </a>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                {result.catalog.actions.map((a, i) => (
                  <ActionCard key={i} title={a.type.replace(/_/g, " ")} description={a.message} priority={a.priority} />
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-3">{result.catalog.grounding}</p>
            </div>

            {/* 3. Competitive */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <h2 className="font-bold text-gray-900 mb-4">Competitive Intelligence</h2>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500">Teknosa fiyatı</p>
                  <p className="font-bold text-gray-900">{result.competitive.price.teknosa_price.toLocaleString("tr-TR")} ₺</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500">Piyasa ortalaması</p>
                  <p className="font-bold text-gray-900">{result.competitive.price.market_avg.toLocaleString("tr-TR")} ₺</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-3">
                {result.competitive.price.diff_pct > 0 && (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
                <span className={clsx("text-sm font-semibold", result.competitive.price.diff_pct > 0 ? "text-red-600" : "text-emerald-600")}>
                  %{Math.abs(result.competitive.price.diff_pct).toFixed(1)} {result.competitive.price.diff_pct > 0 ? "pahalı" : "ucuz"}
                </span>
                <span className={clsx("text-xs px-2 py-0.5 rounded-full font-semibold", RISK_BADGE[result.competitive.price.risk_level])}>
                  {result.competitive.price.risk_level}
                </span>
              </div>
              {result.competitive.price.action && (
                <ActionCard
                  title="Fiyat Aksiyonu"
                  description={`${result.competitive.price.action.message} · Önerilen: ${result.competitive.price.action.suggested_price.toLocaleString("tr-TR")} ₺`}
                  priority="high"
                />
              )}
              <p className="text-xs text-gray-400 mt-3">{result.competitive.grounding}</p>
            </div>

            {/* 4. Sentiment */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900">Review Sentiment</h2>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="text-sm font-bold">{result.sentiment.avg_rating}</span>
                  <span className="text-xs text-gray-400">({result.sentiment.total_reviews} yorum)</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-red-600 mb-2">En Çok Şikayet</p>
                  {result.sentiment.top_complaints.map((c, i) => (
                    <div key={i} className="flex justify-between text-sm text-gray-700 py-1 border-b border-gray-50">
                      <span>{c.issue}</span>
                      <span className="text-red-500 font-semibold">%{c.pct}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-xs font-semibold text-emerald-600 mb-2">Güçlü Yönler</p>
                  {result.sentiment.top_positives.map((p, i) => (
                    <div key={i} className="flex justify-between text-sm text-gray-700 py-1 border-b border-gray-50">
                      <span>{p.strength}</span>
                      <span className="text-emerald-500 font-semibold">{p.count}</span>
                    </div>
                  ))}
                </div>
              </div>
              {result.sentiment.service_alert && (
                <div className="mt-4 flex gap-2 items-start bg-red-50 rounded-xl p-3">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-red-700">{result.sentiment.service_alert}</p>
                </div>
              )}
            </div>

            {/* 5. Flow + Bundle */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <h2 className="font-bold text-gray-900 mb-4">Flow + Bundle</h2>
              <FunnelChart flow={result.flow} />
              {result.flow.flow_action && (
                <div className="mt-4">
                  <ActionCard
                    title={result.flow.flow_action.type}
                    description={result.flow.flow_action.suggestion}
                    priority="high"
                  />
                </div>
              )}
              {result.flow.bundle_suggestions.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-gray-500 mb-2">Cross-sell Önerileri</p>
                  {result.flow.bundle_suggestions.map((b, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 text-sm">
                      <span className="text-gray-800">{b.product}</span>
                      <div className="flex gap-3 text-xs text-gray-500">
                        <span>%{b.co_purchase_rate_pct} birlikte</span>
                        <span className="text-emerald-600 font-semibold">+₺{b.revenue_impact}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
