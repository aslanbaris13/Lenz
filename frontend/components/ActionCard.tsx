"use client";
import { clsx } from "clsx";
import { AlertTriangle, Info, Zap } from "lucide-react";

interface Props {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  onApply?: () => void;
}

const PRIORITY = {
  high:   { label: "Yüksek", cls: "bg-red-50 border-red-200",    text: "text-red-700",    icon: <AlertTriangle className="w-4 h-4 text-red-500" /> },
  medium: { label: "Orta",   cls: "bg-amber-50 border-amber-200", text: "text-amber-700",  icon: <Zap          className="w-4 h-4 text-amber-500" /> },
  low:    { label: "Düşük",  cls: "bg-blue-50 border-blue-200",   text: "text-blue-700",   icon: <Info         className="w-4 h-4 text-blue-500" /> },
};

export function ActionCard({ title, description, priority, onApply }: Props) {
  const p = PRIORITY[priority];
  return (
    <div className={clsx("rounded-xl border p-4 space-y-2", p.cls)}>
      <div className="flex items-start gap-2">
        {p.icon}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={clsx("text-sm font-semibold", p.text)}>{title}</p>
            <span className={clsx("text-[10px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wide", p.text, "opacity-70 border", p.cls)}>
              {p.label}
            </span>
          </div>
          <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{description}</p>
        </div>
      </div>
      {onApply && (
        <button
          onClick={onApply}
          className="text-xs font-medium text-gray-700 hover:text-gray-900 underline underline-offset-2"
        >
          Uygula →
        </button>
      )}
    </div>
  );
}
