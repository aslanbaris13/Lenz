"use client";
import Link from "next/link";
import { clsx } from "clsx";
import type { SKU } from "@/lib/types";

interface Props { skus: SKU[] }

function riskOf(sku: SKU): "HIGH" | "MEDIUM" | "LOW" {
  if (sku.images.length === 0) return "HIGH";
  if (sku.images.length < 2)   return "MEDIUM";
  return "LOW";
}

const ROW_BG: Record<string, string> = {
  HIGH:   "bg-red-50/50",
  MEDIUM: "bg-amber-50/50",
  LOW:    "",
};

export function SKUTable({ skus }: Props) {
  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#E4E4EF] bg-[#F7F7FB]">
            {["SKU", "Ürün", "Fiyat", "Görseller", ""].map((h) => (
              <th key={h} className="text-left px-4 py-2.5 text-[10px] font-semibold text-[#9898B0] uppercase tracking-wide">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F0F0F8]">
          {skus.map((sku) => {
            const risk = riskOf(sku);
            return (
              <tr key={sku.id} className={clsx("transition-colors hover:bg-[#F7F7FB]", ROW_BG[risk])}>
                <td className="px-4 py-3">
                  <span className="font-mono text-[11px] text-[#9898B0]">{sku.id}</span>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-[#0F0F1C] truncate max-w-[180px] text-[13px]">{sku.name}</p>
                  <p className="text-[11px] text-[#9898B0]">{sku.brand}</p>
                </td>
                <td className="px-4 py-3 text-[13px] text-[#0F0F1C] font-medium">
                  {sku.price.toLocaleString("tr-TR")} ₺
                </td>
                <td className="px-4 py-3">
                  <span className={clsx(
                    "badge text-[11px]",
                    risk === "HIGH"   ? "badge-high" :
                    risk === "MEDIUM" ? "badge-medium" : "badge-low"
                  )}>
                    {sku.images.length === 0 ? "Görsel yok" : `${sku.images.length} görsel`}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/sku/${sku.id}`} className="text-[12px] font-semibold text-[#6C47FF] hover:text-[#5535E8]">
                    Analiz →
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
