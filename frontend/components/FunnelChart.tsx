"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { FlowResult } from "@/lib/types";

interface Props { flow: FlowResult }

export function FunnelChart({ flow }: Props) {
  const { funnel } = flow;
  const data = [
    { name: "Görüntüleme",  value: funnel.views,       fill: "#8b5cf6" },
    { name: "Sepete Ekle",  value: funnel.add_to_cart,  fill: "#06b6d4" },
    { name: "Satın Alma",   value: funnel.purchase,     fill: "#10b981" },
  ];

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} barCategoryGap="30%">
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
          <YAxis hide />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
            formatter={(v: number) => v.toLocaleString("tr-TR")}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {data.map((d, i) => <Cell key={i} fill={d.fill} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-violet-50 rounded-xl p-3">
          <p className="text-lg font-bold text-violet-700">{funnel.cart_rate_pct}%</p>
          <p className="text-xs text-gray-500">Sepet oranı</p>
        </div>
        <div className="bg-cyan-50 rounded-xl p-3">
          <p className="text-lg font-bold text-cyan-700">{funnel.purchase_rate_pct}%</p>
          <p className="text-xs text-gray-500">Satın alma</p>
        </div>
        <div className={`rounded-xl p-3 ${flow.risk_level === "HIGH" ? "bg-red-50" : "bg-amber-50"}`}>
          <p className={`text-lg font-bold ${flow.risk_level === "HIGH" ? "text-red-700" : "text-amber-700"}`}>
            {funnel.abandon_rate_pct}%
          </p>
          <p className="text-xs text-gray-500">Terk oranı</p>
        </div>
      </div>
    </div>
  );
}
