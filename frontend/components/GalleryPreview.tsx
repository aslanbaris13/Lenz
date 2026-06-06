"use client";
import Image from "next/image";
import { Play, Download } from "lucide-react";
import type { Gallery } from "@/lib/types";

interface Props { gallery: Gallery }

export function GalleryPreview({ gallery }: Props) {
  const sorted = [...gallery.images].sort((a, b) => a.slot - b.slot);

  return (
    <div className="space-y-6">
      {/* Görsel grid */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-3">
          {gallery.total_images} görsel · platform: {gallery.platform}
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {sorted.map((img) => (
            <div key={img.slot} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200 group">
              <Image src={img.url} alt={`slot-${img.slot}`} fill className="object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              <span className="absolute top-1.5 left-1.5 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                {img.slot} · {img.type}
              </span>
            </div>
          ))}

          {/* Video slot */}
          {gallery.video_url && (
            <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-900 border border-gray-200 flex items-center justify-center">
              <Play className="w-8 h-8 text-white opacity-80" />
              <span className="absolute top-1.5 left-1.5 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                video
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Form */}
      {Object.keys(gallery.form).length > 0 && (
        <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Doldurulmuş Form</h3>
          {Object.entries(gallery.form).map(([key, val]) => (
            <div key={key}>
              <p className="text-xs text-gray-400 capitalize mb-0.5">{key}</p>
              <p className="text-sm text-gray-800 leading-relaxed">
                {Array.isArray(val) ? val.join(", ") : String(val)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Aksiyon butonları */}
      <div className="flex gap-3">
        <button className="flex-1 bg-violet-600 hover:bg-violet-700 text-white py-3 px-4 rounded-xl text-sm font-medium transition-colors">
          Onayla ve Yayınla →
        </button>
        <button className="flex items-center gap-2 border border-gray-200 text-gray-700 py-3 px-4 rounded-xl text-sm hover:bg-gray-50 transition-colors">
          <Download className="w-4 h-4" />
          İndir
        </button>
      </div>
    </div>
  );
}
