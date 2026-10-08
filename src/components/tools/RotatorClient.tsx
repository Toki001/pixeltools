"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { validateImageFile } from "@/lib/image-engine/validate";
import { ImageWorkerClient } from "@/workers/client";
import { downloadBlob, generateOutputFilename } from "@/lib/downloads";

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function RotatorClient() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [originalDimensions, setOriginalDimensions] = useState<{ width: number, height: number } | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  
  const [rotate, setRotate] = useState<number>(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  
  const [targetFormat, setTargetFormat] = useState<"image/webp" | "image/jpeg" | "image/png">("image/jpeg");
  
  const [zoom, setZoom] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const workerClient = useRef<ImageWorkerClient | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    workerClient.current = new ImageWorkerClient();
    return () => workerClient.current?.destroy();
  }, []);

  const handleFileSelect = async (selectedFile: File) => {
    try {
      setError(null);
      await validateImageFile(selectedFile);
      setFile(selectedFile);
      
      let format = selectedFile.type as "image/webp" | "image/jpeg" | "image/png";
      if (!["image/webp", "image/jpeg", "image/png"].includes(format)) {
        format = "image/jpeg";
      }
      setTargetFormat(format);

      const url = URL.createObjectURL(selectedFile);
      setOriginalUrl(url);
      
      const img = new Image();
      img.onload = () => {
        setOriginalDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.src = url;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid file");
    }
  };

  const handleDownload = async () => {
    if (!workerClient.current || !file) return;
    setIsProcessing(true);
    try {
      const res = await workerClient.current.process<{ file: File; options: unknown }, { blob: Blob; dimensions: { width: number; height: number } }>({
        file: file,
        options: {
          type: targetFormat,
          quality: 0.92,
          rotate: rotate,
          flipHorizontal: flipH,
          flipVertical: flipV
        }
      });
      
      const extMap: Record<string, string> = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png" };
      const ext = extMap[targetFormat] || "jpg";
      const filename = generateOutputFilename(file.name, "rotated", ext);
      downloadBlob(res.blob, filename);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to rotate image");
    } finally {
      setIsProcessing(false);
    }
  };

  const resetState = () => {
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    setFile(null);
    setOriginalUrl(null);
    setError(null);
    setOriginalDimensions(null);
    setRotate(0);
    setFlipH(false);
    setFlipV(false);
  };

  const resetTransforms = () => {
    setRotate(0);
    setFlipH(false);
    setFlipV(false);
  };

  if (!file || !originalUrl) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#64748B]">
            <Link className="hover:text-[#131b2e] dark:hover:text-[#F8FAFC] transition-colors" href="/">Home</Link>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <Link className="hover:text-[#131b2e] dark:hover:text-[#F8FAFC] transition-colors" href="/tools">Tools</Link>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span aria-current="page" className="text-[#131b2e] dark:text-[#F8FAFC] font-semibold">Rotate &amp; Flip</span>
          </nav>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
            <div>
              <h1 className="text-3xl font-bold text-[#131b2e] dark:text-[#F8FAFC] tracking-tight">Rotate &amp; flip image</h1>
              <p className="text-base text-[#475569] dark:text-[#CBD5E1] mt-1 max-w-[720px]">
                Rotate 90°, mirror horizontally or vertically without losing quality. 100% private in-browser.
              </p>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-[#121C2D] border border-[#DCE3ED] dark:border-[#334155] shadow-sm text-sm text-[#475569] dark:text-[#CBD5E1] shrink-0">
              <span className="material-symbols-outlined text-[#15803D] dark:text-[#4ADE80]">verified_user</span>
              <span className="font-medium">Lossless Transform</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl flex items-center gap-2">
            <span className="material-symbols-outlined">error</span>
            {error}
          </div>
        )}

        <div 
          className="relative bg-white dark:bg-[#121C2D] rounded-[20px] border-2 border-dashed border-[#DCE3ED] dark:border-[#334155] hover:border-[#2563eb] dark:hover:border-[#60A5FA] p-12 text-center transition-all duration-200 cursor-pointer shadow-sm group hover:bg-[#EFF6FF] dark:hover:bg-[#1B2A40]"
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/png, image/jpeg, image/webp" 
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          />
          <div className="flex flex-col items-center justify-center space-y-4 pointer-events-none">
            <div className="w-16 h-16 rounded-2xl bg-[#F1F5F9] dark:bg-[#1B2A40] border border-[#DCE3ED] dark:border-[#334155] flex items-center justify-center text-[#2563eb] dark:text-[#60A5FA] group-hover:scale-105 transition-transform duration-150">
              <span className="material-symbols-outlined text-[32px]">crop_rotate</span>
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-semibold text-[#131b2e] dark:text-[#F8FAFC]">Upload an image</h3>
              <p className="text-sm text-[#475569] dark:text-[#CBD5E1]">JPEG, PNG, WebP up to 50MB</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate rotated bounds for display
  const rad = (rotate * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));
  const ow = originalDimensions?.width || 0;
  const oh = originalDimensions?.height || 0;
  const newW = Math.round(ow * cos + oh * sin);
  const newH = Math.round(ow * sin + oh * cos);

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#DCE3ED] dark:border-[#334155] pb-5">
        <div>
          <nav className="flex items-center gap-2 text-xs text-[#64748B] mb-2">
            <Link className="hover:text-[#131b2e] dark:hover:text-[#F8FAFC] transition-colors" href="/">Home</Link>
            <span className="text-[#DCE3ED] dark:text-[#334155]">/</span>
            <Link className="hover:text-[#131b2e] dark:hover:text-[#F8FAFC] transition-colors" href="/tools">Tools</Link>
            <span className="text-[#DCE3ED] dark:text-[#334155]">/</span>
            <span className="text-[#131b2e] dark:text-[#F8FAFC] font-semibold">Rotate &amp; Flip</span>
          </nav>
          <h1 className="text-3xl font-bold text-[#131b2e] dark:text-[#F8FAFC] tracking-tight">Rotate &amp; flip image</h1>
          <p className="text-base text-[#475569] dark:text-[#CBD5E1] mt-1 max-w-[720px]">
            Rotate 90°, mirror horizontally or vertically without losing quality.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN */}
        <section className="lg:col-span-8 flex flex-col gap-4">
          <div className="bg-white dark:bg-[#121C2D] rounded-2xl border border-[#DCE3ED] dark:border-[#334155] px-4 py-3 flex flex-wrap items-center justify-between shadow-sm gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#475569] dark:text-[#CBD5E1]">Transform:</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#EFF6FF] dark:bg-[#1B2A40]/50 text-[#2563eb] dark:text-[#60A5FA] text-xs font-semibold border border-[#2563eb]/20">
                <span className="material-symbols-outlined text-[14px]">{flipH || flipV ? 'flip' : 'rotate_right'}</span>
                {rotate !== 0 ? `${rotate > 0 ? '+' : ''}${rotate}°` : ''} {flipH ? 'Flip H' : ''} {flipV ? 'Flip V' : ''} {!rotate && !flipH && !flipV ? 'None' : ''}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#475569] dark:text-[#CBD5E1]">
              <div className="flex items-center bg-[#F1F5F9] dark:bg-[#1B2A40] rounded-xl border border-[#DCE3ED] dark:border-[#334155] p-0.5">
                <button onClick={() => setZoom(z => Math.max(0.25, z - 0.25))} className="p-1 hover:text-[#131b2e] dark:hover:text-[#F8FAFC] transition-colors" title="Zoom Out">
                  <span className="material-symbols-outlined text-[16px]">remove</span>
                </button>
                <span className="px-2 font-semibold tabular-nums text-[#131b2e] dark:text-[#F8FAFC]">{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom(z => Math.min(3, z + 0.25))} className="p-1 hover:text-[#131b2e] dark:hover:text-[#F8FAFC] transition-colors" title="Zoom In">
                  <span className="material-symbols-outlined text-[16px]">add</span>
                </button>
              </div>
              <button onClick={() => setZoom(1)} className="flex items-center gap-1 px-2.5 py-1 rounded-xl hover:text-[#131b2e] dark:hover:text-[#F8FAFC] transition-colors bg-white dark:bg-[#121C2D] border border-[#DCE3ED] dark:border-[#334155]">
                <span className="material-symbols-outlined text-[16px]">fit_screen</span>
                Fit
              </button>
              <button onClick={resetTransforms} className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-900 ml-1">
                <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                Reset
              </button>
            </div>
          </div>

          <div className="relative bg-white dark:bg-[#121C2D] rounded-2xl border border-[#DCE3ED] dark:border-[#334155] p-6 shadow-sm overflow-hidden min-h-[460px] flex items-center justify-center bg-checkerboard-rotate">
            <style dangerouslySetInnerHTML={{ __html: `
              .bg-checkerboard-rotate {
                background-image: 
                  linear-gradient(45deg, #F1F5F9 25%, transparent 25%), 
                  linear-gradient(-45deg, #F1F5F9 25%, transparent 25%), 
                  linear-gradient(45deg, transparent 75%, #F1F5F9 75%), 
                  linear-gradient(-45deg, transparent 75%, #F1F5F9 75%);
                background-size: 16px 16px;
                background-position: 0 0, 0 8px, 8px -8px, -8px 0px;
                background-color: #FFFFFF;
              }
              .dark .bg-checkerboard-rotate {
                background-color: #0B1220;
                background-image: 
                  linear-gradient(45deg, #1B2A40 25%, transparent 25%), 
                  linear-gradient(-45deg, #1B2A40 25%, transparent 25%), 
                  linear-gradient(45deg, transparent 75%, #1B2A40 75%), 
                  linear-gradient(-45deg, transparent 75%, #1B2A40 75%);
              }
            `}} />

            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
              <div className="w-full border-t border-dashed border-[#64748B]"></div>
              <div className="h-full border-l border-dashed border-[#64748B] absolute"></div>
            </div>

            <div 
              className="relative transition-transform duration-300 ease-out z-10 flex flex-col items-center shadow-lg rounded-xl overflow-hidden bg-white border border-[#DCE3ED]/50"
              style={{
                transform: `scale(${zoom}) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1}) rotate(${rotate}deg)`
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={originalUrl} alt="Preview" className="max-w-[400px] max-h-[400px] object-contain block" />
            </div>

            <div className="absolute bottom-4 left-4 z-20">
              <div className="bg-white/95 dark:bg-[#121C2D]/95 border border-[#DCE3ED] dark:border-[#334155] px-3 py-1.5 rounded-xl shadow-sm text-xs text-[#475569] dark:text-[#CBD5E1] flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">grid_4x4</span>
                <span>{newW} × {newH} Canvas Ratio</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3 bg-white dark:bg-[#121C2D] rounded-xl border border-[#DCE3ED] dark:border-[#334155]">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="w-10 h-10 rounded-lg bg-[#F1F5F9] dark:bg-[#1B2A40] border border-[#DCE3ED] dark:border-[#334155] flex items-center justify-center text-[#2563eb] dark:text-[#60A5FA] shrink-0">
                <span className="material-symbols-outlined text-[22px]">image</span>
              </div>
              <div className="truncate">
                <p className="text-sm font-semibold text-[#131b2e] dark:text-[#F8FAFC] truncate">{file.name}</p>
                <div className="flex items-center gap-2 text-xs text-[#475569] dark:text-[#CBD5E1]">
                  <span className="font-mono">{originalDimensions?.width} × {originalDimensions?.height} px</span>
                  <span>•</span>
                  <span>{formatBytes(file.size)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#121C2D] text-[#131b2e] dark:text-[#F8FAFC] hover:bg-[#F1F5F9] dark:hover:bg-[#1B2A40] border border-[#DCE3ED] dark:border-[#334155] rounded-xl text-xs transition-colors">
                <span className="material-symbols-outlined text-[16px]">sync</span>
                <span>Replace</span>
              </button>
              <button onClick={resetState} className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 border border-transparent hover:border-red-200 dark:hover:border-red-900 rounded-xl transition-colors" title="Remove image">
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/png, image/jpeg, image/webp" onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN */}
        <aside className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-white dark:bg-[#121C2D] rounded-2xl border border-[#DCE3ED] dark:border-[#334155] p-6 shadow-sm flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-[#DCE3ED] dark:border-[#334155] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#2563eb] dark:text-[#60A5FA] text-[20px]">tune</span>
                <h2 className="text-lg font-semibold text-[#131b2e] dark:text-[#F8FAFC]">Orientation Controls</h2>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#64748B] mb-2 uppercase tracking-wider">Quick 90° Rotation</label>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setRotate(r => (r - 90) % 360)}
                  className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-[#DCE3ED] dark:border-[#334155] bg-white dark:bg-[#121C2D] hover:bg-[#F1F5F9] dark:hover:bg-[#1B2A40] transition-colors"
                >
                  <span className="material-symbols-outlined text-[24px] text-[#475569] dark:text-[#CBD5E1]">rotate_left</span>
                  <span className="text-sm font-medium text-[#131b2e] dark:text-[#F8FAFC] mt-1.5">Rotate Left</span>
                  <span className="text-xs text-[#64748B]">90° CCW</span>
                </button>
                <button 
                  onClick={() => setRotate(r => (r + 90) % 360)}
                  className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-[#DCE3ED] dark:border-[#334155] bg-white dark:bg-[#121C2D] hover:bg-[#F1F5F9] dark:hover:bg-[#1B2A40] transition-colors"
                >
                  <span className="material-symbols-outlined text-[24px] text-[#475569] dark:text-[#CBD5E1]">rotate_right</span>
                  <span className="text-sm font-medium text-[#131b2e] dark:text-[#F8FAFC] mt-1.5">Rotate Right</span>
                  <span className="text-xs text-[#64748B]">90° CW</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#64748B] mb-2 uppercase tracking-wider">Flip & Mirror</label>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setFlipH(!flipH)}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-colors ${flipH ? 'border-[#2563eb] bg-[#EFF6FF] dark:bg-[#1B2A40] text-[#2563eb] dark:text-[#60A5FA]' : 'border-[#DCE3ED] dark:border-[#334155] bg-white dark:bg-[#121C2D] text-[#131b2e] dark:text-[#F8FAFC] hover:bg-[#F1F5F9] dark:hover:bg-[#1B2A40]'}`}
                >
                  <span className="material-symbols-outlined text-[20px]">flip</span>
                  <span className="text-sm font-medium">Flip Horiz.</span>
                </button>
                <button 
                  onClick={() => setFlipV(!flipV)}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-colors ${flipV ? 'border-[#2563eb] bg-[#EFF6FF] dark:bg-[#1B2A40] text-[#2563eb] dark:text-[#60A5FA]' : 'border-[#DCE3ED] dark:border-[#334155] bg-white dark:bg-[#121C2D] text-[#131b2e] dark:text-[#F8FAFC] hover:bg-[#F1F5F9] dark:hover:bg-[#1B2A40]'}`}
                >
                  <span className="material-symbols-outlined text-[20px] rotate-90">flip</span>
                  <span className="text-sm font-medium">Flip Vert.</span>
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-[#DCE3ED] dark:border-[#334155]">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Fine Angle Adjustment</label>
                <div className="flex items-center gap-1 bg-[#F1F5F9] dark:bg-[#1B2A40] border border-[#DCE3ED] dark:border-[#334155] rounded-lg px-2 py-0.5">
                  <input 
                    type="number" 
                    value={rotate}
                    onChange={(e) => setRotate(parseInt(e.target.value) || 0)}
                    className="w-12 bg-transparent text-right font-mono text-xs text-[#131b2e] dark:text-[#F8FAFC] focus:outline-none" 
                    max="180" min="-180"
                  />
                  <span className="text-xs text-[#64748B]">°</span>
                </div>
              </div>
              <input 
                type="range" 
                min="-180" max="180" 
                value={rotate > 180 ? (rotate % 360) - 360 : (rotate < -180 ? (rotate % 360) + 360 : rotate)}
                onChange={(e) => setRotate(parseInt(e.target.value))}
                className="w-full h-1.5 bg-[#DCE3ED] dark:bg-[#334155] rounded-lg appearance-none cursor-pointer accent-[#2563eb]"
              />
              <div className="flex justify-between items-center text-[10px] text-[#64748B] mt-1.5 font-mono">
                <button onClick={() => setRotate(-180)} className="hover:text-[#2563eb]">-180°</button>
                <button onClick={() => setRotate(-90)} className="hover:text-[#2563eb]">-90°</button>
                <button onClick={() => setRotate(0)} className="hover:text-[#2563eb]">0°</button>
                <button onClick={() => setRotate(90)} className="hover:text-[#2563eb]">+90°</button>
                <button onClick={() => setRotate(180)} className="hover:text-[#2563eb]">+180°</button>
              </div>
            </div>

            <div className="pt-2 border-t border-[#DCE3ED] dark:border-[#334155]">
              <label className="block text-xs font-semibold text-[#64748B] mb-2 uppercase tracking-wider">Output Format</label>
              <div className="grid grid-cols-3 gap-2 bg-[#F1F5F9] dark:bg-[#1B2A40] p-1 rounded-xl border border-[#DCE3ED] dark:border-[#334155]">
                {[
                  { id: "image/jpeg", label: "JPEG" },
                  { id: "image/png", label: "PNG" },
                  { id: "image/webp", label: "WebP" },
                ].map((f) => (
                  <button 
                    key={f.id}
                    onClick={() => setTargetFormat(f.id as "image/webp" | "image/jpeg" | "image/png")}
                    className={`py-1.5 text-center rounded-lg text-xs transition-colors ${targetFormat === f.id ? 'bg-white dark:bg-[#121C2D] font-bold text-[#2563eb] dark:text-[#60A5FA] shadow-xs border border-[#DCE3ED] dark:border-[#334155]' : 'font-medium text-[#475569] dark:text-[#CBD5E1] hover:bg-white/50 dark:hover:bg-[#121C2D]/50'}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[#F1F5F9] dark:bg-[#1B2A40] rounded-xl p-4 border border-[#DCE3ED] dark:border-[#334155] space-y-2 text-xs">
              <div className="flex justify-between items-center text-[#475569] dark:text-[#CBD5E1]">
                <span>Original:</span>
                <span className="font-medium text-[#131b2e] dark:text-[#F8FAFC]">0° Normal</span>
              </div>
              <div className="flex justify-between items-center text-[#475569] dark:text-[#CBD5E1]">
                <span>Output dimensions:</span>
                <span className="font-mono text-[#131b2e] dark:text-[#F8FAFC]">{newW} × {newH} px</span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 pt-1">
              <button 
                onClick={handleDownload}
                disabled={isProcessing}
                className="w-full min-h-[44px] py-3 px-5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[20px]">{isProcessing ? 'autorenew' : 'download'}</span>
                {isProcessing ? 'Processing...' : `Download Transform`}
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
