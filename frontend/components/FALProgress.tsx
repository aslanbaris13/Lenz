"use client";
import { useEffect, useState } from "react";
import { CheckCircle, Loader2, Circle } from "lucide-react";

const STEPS = [
  { id: "birefnet",  label: "Arka plan temizleniyor",      sub: "fal-ai/birefnet/v2",                          ms: 2500 },
  { id: "angles",   label: "5 farklı açı üretiliyor",     sub: "fal-ai/qwen-image-edit-2511-multiple-angles", ms: 15000 },
  { id: "lifestyle", label: "Lifestyle sahneler oluşturuluyor", sub: "fal-ai/bria/product-shot",              ms: 12000 },
  { id: "video",    label: "Tanıtım videosu üretiliyor",  sub: "fal-ai/kling-video/v2.1",                     ms: 30000 },
  { id: "form",     label: "Platform formu dolduruluyor", sub: "Anthropic claude-haiku",                      ms: 3000  },
];

interface Props { onComplete?: () => void }

export function FALProgress({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (step >= STEPS.length) { onComplete?.(); return; }
    const t = setTimeout(() => setStep((s) => s + 1), STEPS[step].ms);
    return () => clearTimeout(t);
  }, [step, onComplete]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-900">FAL Pipeline çalışıyor</h3>
        <span className="text-sm text-gray-400">{elapsed}s</span>
      </div>

      {STEPS.map((s, i) => {
        const done    = i < step;
        const active  = i === step;
        const pending = i > step;
        return (
          <div key={s.id} className={`flex items-start gap-3 transition-opacity duration-300 ${pending ? "opacity-30" : "opacity-100"}`}>
            <div className="mt-0.5">
              {done    && <CheckCircle className="w-5 h-5 text-emerald-500" />}
              {active  && <Loader2    className="w-5 h-5 text-violet-600 animate-spin" />}
              {pending && <Circle     className="w-5 h-5 text-gray-300" />}
            </div>
            <div>
              <p className={`text-sm font-medium ${active ? "text-violet-700" : done ? "text-gray-500 line-through" : "text-gray-700"}`}>
                {s.label}
              </p>
              <p className="text-xs text-gray-400">{s.sub}</p>
            </div>
          </div>
        );
      })}

      {/* progress bar */}
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-2">
        <div
          className="h-full bg-violet-500 rounded-full transition-all duration-500"
          style={{ width: `${(step / STEPS.length) * 100}%` }}
        />
      </div>
    </div>
  );
}
