"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Image as ImageIcon } from "lucide-react";
import { generateListing } from "@/lib/api";
import { FALProgress } from "@/components/FALProgress";
import { GalleryPreview } from "@/components/GalleryPreview";
import type { Gallery, Platform } from "@/lib/types";

const PLATFORMS: { id: Platform; label: string; flag: string }[] = [
  { id: "etsy",     label: "Etsy",     flag: "🛍️" },
  { id: "trendyol", label: "Trendyol", flag: "🇹🇷" },
  { id: "amazon",   label: "Amazon",   flag: "📦" },
  { id: "teknosa",  label: "Teknosa",  flag: "💻" },
];

type Status = "idle" | "generating" | "done" | "error";

export default function NewListing() {
  const [imageUrl, setImageUrl]     = useState("");
  const [productHint, setHint]      = useState("");
  const [platform, setPlatform]     = useState<Platform>("etsy");
  const [status, setStatus]         = useState<Status>("idle");
  const [gallery, setGallery]       = useState<Gallery | null>(null);
  const [error, setError]           = useState("");

  const handleGenerate = async () => {
    if (!imageUrl.trim()) return;
    setStatus("generating");
    setError("");
    try {
      const data = await generateListing({ image_url: imageUrl, product_hint: productHint, platform });
      setGallery(data);
      setStatus("done");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Bir hata oluştu.");
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Başlık */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-700 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Yeni Ürün Ekle</h1>
            <p className="text-sm text-gray-500">1 fotoğraf → 9 görsel + video + platform formu</p>
          </div>
        </div>

        {/* Form — idle */}
        {(status === "idle" || status === "error") && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
            {/* Platform seçimi */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Platform</label>
              <div className="grid grid-cols-4 gap-2">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPlatform(p.id)}
                    className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      platform === p.id
                        ? "border-violet-400 bg-violet-50 text-violet-700"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-lg">{p.flag}</span>
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Görsel URL */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Ürün Görseli URL
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/product.jpg"
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
                  />
                </div>
              </div>
              {imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt="preview" className="mt-2 h-24 w-24 object-cover rounded-lg border border-gray-200" onError={() => {}} />
              )}
            </div>

            {/* Ürün ipucu */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Ürün İpucu <span className="text-gray-400 font-normal">(opsiyonel)</span>
              </label>
              <input
                type="text"
                value={productHint}
                onChange={(e) => setHint(e.target.value)}
                placeholder="ör. pink iPhone 15 case, minimalist"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              onClick={handleGenerate}
              disabled={!imageUrl.trim()}
              className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white py-3 rounded-xl text-sm font-semibold transition-colors"
            >
              Galeri Oluştur →
            </button>

            <p className="text-center text-xs text-gray-400">
              ~65 saniye · birefnet → qwen → bria → kling → claude
            </p>
          </div>
        )}

        {/* Generating */}
        {status === "generating" && (
          <FALProgress onComplete={() => {}} />
        )}

        {/* Done */}
        {status === "done" && gallery && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Galeri Hazır ✓</h2>
              <button
                onClick={() => { setStatus("idle"); setGallery(null); }}
                className="text-xs text-gray-400 hover:text-gray-700"
              >
                Yeniden oluştur
              </button>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <GalleryPreview gallery={gallery} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
