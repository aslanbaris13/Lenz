"use client";
import { clsx } from "clsx";
import { AlertTriangle, Zap, Info } from "lucide-react";

interface Props {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  onApply?: () => void;
}

const STYLES = {
  high:   { wrap: "bg-red-50 border-red-100",    text: "text-red-700",    badge: "bg-red-100 text-red-600",    label: "Yüksek", icon: <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" /> },
  medium: { wrap: "bg-amber-50 border-amber-100", text: "text-amber-700",  badge: "bg-amber-100 text-amber-600",label: "Orta",   icon: <Zap           className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" /> },
  low:    { wrap: "bg-blue-50 border-blue-100",   text: "text-blue-700",   badge: "bg-blue-100 text-blue-600",  label: "Düşük", icon: <Info          className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" /> },
};

export function ActionCard({ title, description, priority, onApply }: Props) {
  const s = STYLES[priority];
  return (
    <div className={clsx("rounded-xl border p-3 space-y-1.5", s.wrap)}>
      <div className="flex items-start gap-2">
        {s.icon}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className={clsx("text-xs font-semibold leading-tight", s.text)}>{title}</p>
            <span className={clsx("badge text-[10px]", s.badge)}>{s.label}</span>
          </div>
          <p className="text-[11px] text-[#64647A] mt-0.5 leading-relaxed">{description}</p>
        </div>
      </div>
      {onApply && (
        <button onClick={onApply} className="text-[11px] font-semibold text-[#6C47FF] hover:underline">
          Uygula →
        </button>
      )}
    </div>
  );
}
