"use client";
import { useEffect, useState } from "react";
import { CheckCircle, Loader2, Circle } from "lucide-react";
import { clsx } from "clsx";

const STEPS = [
  { id: "birefnet",  label: "Arka plan temizleniyor",          sub: "fal-ai/birefnet/v2",                          ms: 2500  },
  { id: "angles",   label: "5 farklı açı üretiliyor",         sub: "fal-ai/qwen-image-edit-2511-multiple-angles", ms: 15000 },
  { id: "lifestyle", label: "Lifestyle sahneler oluşturuluyor", sub: "fal-ai/bria/product-shot",                   ms: 12000 },
  { id: "video",    label: "Tanıtım videosu üretiliyor",      sub: "fal-ai/kling-video/v2.1",                     ms: 30000 },
  { id: "form",     label: "Platform formu dolduruluyor",     sub: "OpenAI gpt-4o-mini",                          ms: 3000  },
];

interface Props { onComplete?: () => void }

export function FALProgress({ onComplete }: Props) {
  const [step, setStep]       = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (step >= STEPS.length) { onComplete?.(); return; }
    const t = setTimeout(() => setStep((s) => s + 1), STEPS[step].ms);
    return () => clearTimeout(t);
  }, [step, onComplete]);

  const pct = Math.round((step / STEPS.length) * 100);

  return (
    <div className="card p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-bold text-[#0F0F1C]">FAL Pipeline çalışıyor</p>
          <p className="text-xs text-[#9898B0] mt-0.5">5 model · paralel orkestrasyon</p>
        </div>
        <span className="text-sm font-mono text-[#6C47FF] font-semibold">{elapsed}s</span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-[#F0F0F8] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#6C47FF] rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Adımlar */}
      <div className="space-y-3">
        {STEPS.map((s, i) => {
          const done    = i < step;
          const active  = i === step;
          const pending = i > step;
          return (
            <div key={s.id} className={clsx("flex items-start gap-3 transition-opacity duration-300", pending ? "opacity-30" : "opacity-100")}>
              <div className="mt-0.5 shrink-0">
                {done   && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                {active && <Loader2     className="w-4 h-4 text-[#6C47FF] animate-spin" />}
                {pending && <Circle     className="w-4 h-4 text-[#D0D0E0]" />}
              </div>
              <div>
                <p className={clsx("text-sm font-medium",
                  done ? "text-[#9898B0] line-through" :
                  active ? "text-[#6C47FF]" : "text-[#0F0F1C]"
                )}>
                  {s.label}
                </p>
                <p className="text-[11px] text-[#9898B0] font-mono">{s.sub}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
