"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ImageIcon, Sparkles, Upload, Link2, X, Loader2 } from "lucide-react";
import { generateListing, uploadImage } from "@/lib/api";
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

type InputMode = "url" | "device";
type Status    = "idle" | "uploading" | "generating" | "done" | "error";

export default function NewListing() {
  const defaultPlatform = (getPlatform() as Platform) ?? "etsy";
  const fileRef = useRef<HTMLInputElement>(null);

  const [platform, setPlatform] = useState<Platform>(defaultPlatform);
  const [mode, setMode]         = useState<InputMode>("url");
  const [imageUrl, setImageUrl] = useState("");
  const [preview, setPreview]   = useState("");
  const [hint, setHint]         = useState("");
  const [status, setStatus]     = useState<Status>("idle");
  const [gallery, setGallery]   = useState<Gallery | null>(null);
  const [error, setError]       = useState("");

  // ── Dosya seçilince ──────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Anlık preview
    setPreview(URL.createObjectURL(file));
    setImageUrl("");
    setStatus("uploading");
    setError("");

    try {
      const { url } = await uploadImage(file);
      setImageUrl(url);
      setStatus("idle");
    } catch {
      setError("Dosya yüklenemedi. Tekrar dene.");
      setPreview("");
      setStatus("error");
    } finally {
      e.target.value = "";
    }
  };

  // ── URL girilince ────────────────────────────────────
  const handleUrlChange = (val: string) => {
    setImageUrl(val);
    setPreview(val);
  };

  const clearImage = () => {
    setImageUrl(""); setPreview(""); setStatus("idle"); setError("");
  };

  // ── Galeri oluştur ───────────────────────────────────
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

  const isIdle = status === "idle" || status === "error";

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
        {isIdle && (
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

            {/* Input mod seçici */}
            <div>
              <label className="label">Ürün Görseli</label>
              <div className="flex rounded-xl border border-[#E4E4EF] overflow-hidden mb-3">
                {(["url", "device"] as InputMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => { setMode(m); clearImage(); }}
                    className={clsx(
                      "flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold transition-all",
                      mode === m
                        ? "bg-[#6C47FF] text-white"
                        : "text-[#64647A] hover:bg-[#F7F7FB]"
                    )}
                  >
                    {m === "url"    ? <><Link2  className="w-3.5 h-3.5" /> URL Gir</>
                                  : <><Upload className="w-3.5 h-3.5" /> Cihazdan Yükle</>}
                  </button>
                ))}
              </div>

              {/* URL modu */}
              {mode === "url" && (
                <div className="relative">
                  <ImageIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9898B0]" />
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    placeholder="https://example.com/product.jpg"
                    className="input pl-10"
                  />
                </div>
              )}

              {/* Cihaz modu */}
              {mode === "device" && !preview && (
                <button
                  onClick={() => fileRef.current?.click()}
                  className={clsx(
                    "w-full border-2 border-dashed border-[#E4E4EF] rounded-xl py-8",
                    "flex flex-col items-center gap-2 text-[#9898B0]",
                    "hover:border-[#6C47FF]/40 hover:bg-violet-50/30 transition-all"
                  )}
                >
                  <Upload className="w-6 h-6" />
                  <span className="text-sm font-medium">Dosya seç veya sürükle</span>
                  <span className="text-xs">JPEG, PNG, WebP — maks 10 MB</span>
                </button>
              )}

              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleFileChange}
              />

              {/* Preview */}
              {preview && (
                <div className="mt-3 relative">
                  <div className="relative h-40 w-40 rounded-2xl overflow-hidden border border-[#E4E4EF] shadow-sm">
                    <Image src={preview} alt="preview" fill className="object-cover" />
                    {status === "uploading" && (
                      <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-[#6C47FF] animate-spin" />
                      </div>
                    )}
                  </div>
                  <button
                    onClick={clearImage}
                    className="absolute top-2 left-2 w-6 h-6 bg-white border border-[#E4E4EF] rounded-full flex items-center justify-center shadow-sm hover:bg-red-50 transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-[#64647A]" />
                  </button>
                  {status === "uploading" && (
                    <p className="text-xs text-[#9898B0] mt-2">Sunucuya yükleniyor…</p>
                  )}
                  {imageUrl && status === "idle" && (
                    <p className="text-xs text-emerald-600 mt-2 font-medium">✓ Görsel hazır</p>
                  )}
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

            <button
              onClick={handleGenerate}
              disabled={!imageUrl.trim() || status === "uploading"}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Galeri Oluştur
            </button>

            <p className="text-center text-[11px] text-[#9898B0]">
              ~65 sn · birefnet → qwen → bria → kling → gpt-4o-mini
            </p>
          </div>
        )}

        {status === "uploading" && (
          <div className="card p-8 text-center">
            <Loader2 className="w-8 h-8 text-[#6C47FF] animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium text-[#0F0F1C]">Görsel yükleniyor…</p>
          </div>
        )}

        {status === "generating" && <FALProgress onComplete={() => {}} />}

        {status === "done" && gallery && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-bold text-[#0F0F1C]">Galeri Hazır ✓</p>
              <button onClick={() => { setStatus("idle"); setGallery(null); clearImage(); }} className="btn-ghost text-xs">
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
