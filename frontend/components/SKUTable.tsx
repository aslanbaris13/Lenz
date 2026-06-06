"use client";
import Link from "next/link";
import { clsx } from "clsx";
import type { SKU } from "@/lib/types";

interface Props { skus: SKU[] }

const RISK_COLOR: Record<string, string> = {
  HIGH:   "bg-red-50",
  MEDIUM: "bg-amber-50",
  LOW:    "bg-white",
};

const RISK_BADGE: Record<string, string> = {
  HIGH:   "bg-red-100 text-red-700",
  MEDIUM: "bg-amber-100 text-amber-700",
  LOW:    "bg-emerald-100 text-emerald-700",
};

function scoreColor(score: number) {
  if (score >= 70) return "text-emerald-600";
  if (score >= 50) return "text-amber-600";
  return "text-red-600";
}

export function SKUTable({ skus }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">SKU</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ürün</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Fiyat</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Görseller</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">İşlem</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {skus.map((sku) => {
            const imageCount = sku.images.length;
            const risk = imageCount === 0 ? "HIGH" : imageCount < 2 ? "MEDIUM" : "LOW";
            return (
              <tr key={sku.id} className={clsx("transition-colors hover:bg-gray-50", RISK_COLOR[risk])}>
                <td className="px-4 py-3">
                  <span className="font-mono text-xs text-gray-500">{sku.id}</span>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900 truncate max-w-[200px]">{sku.name}</p>
                  <p className="text-xs text-gray-400">{sku.brand} · {sku.category.split(">")[0].trim()}</p>
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {sku.price.toLocaleString("tr-TR")} ₺
                </td>
                <td className="px-4 py-3">
                  <span className={clsx("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", RISK_BADGE[risk])}>
                    {imageCount === 0 ? "Görsel yok" : `${imageCount} görsel`}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/sku/${sku.id}`}
                    className="text-violet-600 hover:text-violet-800 text-xs font-medium"
                  >
                    Analiz Et →
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
