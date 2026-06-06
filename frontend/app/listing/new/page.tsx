"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ImageIcon, Sparkles } from "lucide-react";
import { generateListing } from "@/lib/api";
import { getPlatform } from "@/lib/auth";
import { FALProgress } from "@/components/FALProgress";
import { GalleryPreview } from "@/components/GalleryPreview";
import type { Gallery, Platform } from "@/lib/types";
import { clsx } from "clsx";

const PLATFORMS: Array<{ id: Platform; label: string; emoji: string }> = [
  { id: "etsy",     label: "Etsy",     emoji: "🛍️" },
  { id: "trendyol", label: "Trendyol", emoji: "🇹🇷" },
  { id: "amazon",   label: "Amazon",   emoji: "📦" },
  { id: "teknosa",  label: "Teknosa",  emoji: "💻" },
];

type Status = "idle" | "generating" | "done" | "error";

export default function NewListing() {
  const defaultPlatform = (getPlatform() as Platform) ?? "etsy";

  const [imageUrl, setImageUrl] = useState("");
  const [hint, setHint]         = useState("");
  const [platform, setPlatform] = useState<Platform>(defaultPlatform);
  const [status, setStatus]     = useState<Status>("idle");
  const [gallery, setGallery]   = useState<Gallery | null>(null);
  const [error, setError]       = useState("");
  const [imgError, setImgError] = useState(false);

  const handleGenerate = async () => {
    if (!imageUrl.trim()) return;
    setStatus("generating");
    setError("");
    try {
      const data = await generateListing({ image_url: imageUrl, product_hint: hint, platform });
      setGallery(data);
      setStatus("done");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Bir hata oluştu.");
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="max-w-xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/dashboard" className="text-[#9898B0] hover:text-[#0F0F1C] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[#0F0F1C]">Yeni Ürün Ekle</h1>
            <p className="text-xs text-[#9898B0] mt-0.5">1 fotoğraf → 9 görsel + video + platform formu</p>
          </div>
        </div>

        {/* Form */}
        {(status === "idle" || status === "error") && (
          <div className="card p-6 space-y-5">
            {/* Platform */}
            <div>
              <label className="label">Platform</label>
              <div className="grid grid-cols-4 gap-2">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPlatform(p.id)}
                    className={clsx(
                      "flex flex-col items-center gap-1 py-3 rounded-xl border-2 text-xs font-semibold transition-all",
                      platform === p.id
                        ? "border-[#6C47FF] bg-violet-50 text-[#6C47FF]"
                        : "border-[#E4E4EF] text-[#64647A] hover:border-[#6C47FF]/40"
                    )}
                  >
                    <span className="text-lg">{p.emoji}</span>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Görsel URL */}
            <div>
              <label className="label">Ürün Görseli URL</label>
              <div className="relative">
                <ImageIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9898B0]" />
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => { setImageUrl(e.target.value); setImgError(false); }}
                  placeholder="https://example.com/product.jpg"
                  className="input pl-10"
                />
              </div>
              {imageUrl && !imgError && (
                <div className="mt-2 relative h-20 w-20 rounded-xl overflow-hidden border border-[#E4E4EF]">
                  <Image
                    src={imageUrl} alt="preview" fill className="object-cover"
                    onError={() => setImgError(true)}
                  />
                </div>
              )}
            </div>

            {/* Ürün ipucu */}
            <div>
              <label className="label">
                Ürün İpucu <span className="text-[#9898B0] normal-case font-normal">(opsiyonel)</span>
              </label>
              <input
                type="text"
                value={hint}
                onChange={(e) => setHint(e.target.value)}
                placeholder="ör. pink iPhone 15 case, minimalist"
                className="input"
              />
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>
            )}

            <button onClick={handleGenerate} disabled={!imageUrl.trim()} className="btn-primary w-full flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" />
              Galeri Oluştur
            </button>

            <p className="text-center text-[11px] text-[#9898B0]">
              ~65 sn · birefnet → qwen → bria → kling → gpt-4o-mini
            </p>
          </div>
        )}

        {status === "generating" && <FALProgress onComplete={() => {}} />}

        {status === "done" && gallery && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-bold text-[#0F0F1C]">Galeri Hazır ✓</p>
              <button onClick={() => { setStatus("idle"); setGallery(null); }} className="btn-ghost text-xs">
                Yeniden oluştur
              </button>
            </div>
            <div className="card p-5">
              <GalleryPreview gallery={gallery} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
