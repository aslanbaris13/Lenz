"use client";
import { clsx } from "clsx";

export type AgentId = "orchestrator" | "catalog" | "competitive" | "sentiment" | "flow" | "returns";

const AGENTS: Array<{ id: AgentId; label: string; color: string; dot: string; fal?: boolean }> = [
  { id: "orchestrator", label: "Orchestrator",            color: "bg-violet-50 border-violet-200 text-violet-800", dot: "bg-violet-500" },
  { id: "catalog",      label: "Catalog + Listing",       color: "bg-emerald-50 border-emerald-200 text-emerald-800", dot: "bg-emerald-500", fal: true },
  { id: "competitive",  label: "Competitive Intelligence",color: "bg-blue-50 border-blue-200 text-blue-800",         dot: "bg-blue-500" },
  { id: "sentiment",    label: "Review Sentiment",        color: "bg-rose-50 border-rose-200 text-rose-800",         dot: "bg-rose-500" },
  { id: "flow",         label: "Flow + Bundle",           color: "bg-amber-50 border-amber-200 text-amber-800",      dot: "bg-amber-500" },
  { id: "returns",      label: "Returns Intelligence",    color: "bg-slate-50 border-slate-200 text-slate-700",      dot: "bg-slate-400" },
];

interface Props {
  selected: AgentId;
  onSelect: (id: AgentId) => void;
  onSweep?: () => void;
  sweeping?: boolean;
}

export function AgentPanel({ selected, onSelect, onSweep, sweeping }: Props) {
  return (
    <aside className="w-64 shrink-0 flex flex-col gap-2">
      <div className="mb-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Lenz</p>
        <h2 className="text-lg font-bold text-gray-900">Agent Panel</h2>
      </div>

      {AGENTS.map((a) => (
        <button
          key={a.id}
          onClick={() => onSelect(a.id)}
          className={clsx(
            "flex items-center gap-2.5 w-full text-left px-3 py-2.5 rounded-xl border text-sm font-medium transition-all",
            selected === a.id ? a.color : "bg-white border-gray-100 text-gray-600 hover:bg-gray-50"
          )}
        >
          <span className={clsx("w-2 h-2 rounded-full shrink-0", selected === a.id ? a.dot : "bg-gray-300")} />
          <span className="flex-1 truncate">{a.label}</span>
          {a.fal && (
            <span className="text-[10px] bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded font-semibold">FAL</span>
          )}
        </button>
      ))}

      <button
        onClick={onSweep}
        disabled={sweeping}
        className="mt-4 w-full bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
      >
        {sweeping ? "Taranıyor…" : "Sweep Başlat"}
      </button>
    </aside>
  );
}
