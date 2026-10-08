"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { validateImageFile } from "@/lib/image-engine/validate";
import { ImageWorkerClient } from "@/workers/client";
import { downloadBlob, generateOutputFilename } from "@/lib/downloads";
import { Comparator } from "./Comparator";

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function CompressorClient() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [format, setFormat] = useState<"image/webp" | "image/jpeg" | "image/png">("image/webp");
  const [quality, setQuality] = useState(80);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ blob: Blob, url: string, width: number, height: number, timeMs: number } | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  
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
      const url = URL.createObjectURL(selectedFile);
      setOriginalUrl(url);
      setResult(null); // Clear previous result
      processImage(selectedFile, format, quality);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid file");
    }
  };

  const processImage = async (imgFile: File, targetFormat: string, targetQuality: number) => {
    if (!workerClient.current) return;
    setIsProcessing(true);
    const start = performance.now();
    try {
      const res = await workerClient.current.process<{ file: File; options: unknown }, { blob: Blob; dimensions: { width: number; height: number } }>({
        file: imgFile,
        options: {
          type: targetFormat,
          quality: targetQuality / 100
        }
      });
      const url = URL.createObjectURL(res.blob);
      setResult({
        blob: res.blob,
        url,
        width: res.dimensions.width,
        height: res.dimensions.height,
        timeMs: Math.round(performance.now() - start)
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to process image");
    } finally {
      setIsProcessing(false);
    }
  };

  // Re-process when settings change
  useEffect(() => {
    if (file) {
      // Debounce slightly to avoid spamming the worker on slider drag
      const timer = setTimeout(() => {
        processImage(file, format, quality);
      }, 300);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [format, quality]);

  const handleDownload = () => {
    if (!file || !result) return;
    const extMap: Record<string, string> = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png" };
    const ext = extMap[format] || "jpg";
    const filename = generateOutputFilename(file.name, `q${quality}`, ext);
    downloadBlob(result.blob, filename);
  };

  const resetState = () => {
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (result?.url) URL.revokeObjectURL(result.url);
    setFile(null);
    setOriginalUrl(null);
    setResult(null);
    setError(null);
  };

  // --- Initial Upload UI ---
  if (!file) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#64748B]">
            <Link className="hover:text-[#131b2e] dark:hover:text-[#F8FAFC] transition-colors" href="/">Home</Link>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <Link className="hover:text-[#131b2e] dark:hover:text-[#F8FAFC] transition-colors" href="/tools">Tools</Link>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span aria-current="page" className="text-[#131b2e] dark:text-[#F8FAFC] font-semibold">Image Compressor</span>
          </nav>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pt-1">
            <div>
              <h1 className="text-3xl font-bold text-[#131b2e] dark:text-[#F8FAFC] tracking-tight">Compress images online</h1>
              <p className="text-base text-[#475569] dark:text-[#CBD5E1] mt-1">Make images smaller while keeping control over quality. Processed locally.</p>
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
              <span className="material-symbols-outlined text-[32px]">cloud_upload</span>
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-semibold text-[#131b2e] dark:text-[#F8FAFC]">Drop an image here, or browse files</h3>
              <p className="text-sm text-[#475569] dark:text-[#CBD5E1]">JPEG, PNG, WebP up to 50MB</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Workspace UI ---
  const savingPercentage = result ? ((file.size - result.blob.size) / file.size) * 100 : 0;
  const isSaving = savingPercentage > 0;

  return (
    <div className="flex flex-col gap-6 w-full">
      <section className="flex flex-col gap-2">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#64748B]">
          <Link className="hover:text-[#131b2e] dark:hover:text-[#F8FAFC] transition-colors" href="/">Home</Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <Link className="hover:text-[#131b2e] dark:hover:text-[#F8FAFC] transition-colors" href="/tools">Tools</Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span aria-current="page" className="text-[#131b2e] dark:text-[#F8FAFC] font-semibold">Image Compressor</span>
        </nav>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pt-1">
          <div>
            <h1 className="text-3xl font-bold text-[#131b2e] dark:text-[#F8FAFC] tracking-tight">Compress images online</h1>
            <p className="text-base text-[#475569] dark:text-[#CBD5E1] mt-1">Make images smaller while keeping control over quality. Processed locally.</p>
          </div>
        </div>
      </section>

      {/* Success Banner (if processed) */}
      {result && !isProcessing && (
        <section className={`w-full border rounded-xl p-4 flex items-center justify-between shadow-sm ${isSaving ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800' : 'bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isSaving ? 'bg-[#15803D] text-white' : 'bg-amber-600 text-white'}`}>
              <span className="material-symbols-outlined text-[18px]">{isSaving ? 'check_circle' : 'warning'}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
              <span className={`text-sm font-bold ${isSaving ? 'text-emerald-900 dark:text-emerald-100' : 'text-amber-900 dark:text-amber-100'}`}>
                {isSaving ? 'Compressed successfully!' : 'File size increased!'}
              </span>
              <span className={`hidden sm:inline font-bold ${isSaving ? 'text-emerald-600' : 'text-amber-600'}`}>•</span>
              <span className={`text-sm ${isSaving ? 'text-emerald-800 dark:text-emerald-200' : 'text-amber-800 dark:text-amber-200'}`}>
                {isSaving 
                  ? `Saved ${savingPercentage.toFixed(1)}% (${formatBytes(file.size)} → ${formatBytes(result.blob.size)})` 
                  : `Try a lower quality or different format.`}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`hidden md:inline text-xs px-2 py-0.5 rounded ${isSaving ? 'text-emerald-700 bg-emerald-100/60 dark:bg-emerald-900/60' : 'text-amber-700 bg-amber-100/60 dark:bg-amber-900/60'}`}>Execution: {result.timeMs}ms</span>
          </div>
        </section>
      )}

      {/* TWO-COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN */}
        <section className="lg:col-span-8 flex flex-col gap-4">
          {originalUrl && result?.url ? (
            <Comparator 
              originalUrl={originalUrl}
              originalSizeStr={formatBytes(file.size)}
              processedUrl={result.url}
              processedSizeStr={formatBytes(result.blob.size)}
              format={format}
            />
          ) : (
            <div className="bg-white dark:bg-[#121C2D] border border-[#DCE3ED] dark:border-[#334155] rounded-2xl h-[460px] flex items-center justify-center">
              <span className="material-symbols-outlined animate-spin text-4xl text-[#2563eb]">autorenew</span>
            </div>
          )}

          {/* UPLOADED FILE STRIP CARD */}
          <div className="bg-white dark:bg-[#121C2D] border border-[#DCE3ED] dark:border-[#334155] rounded-xl px-5 py-3.5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-[#F1F5F9] dark:bg-[#1B2A40] border border-[#DCE3ED] dark:border-[#334155] flex items-center justify-center shrink-0 text-[#475569] dark:text-[#CBD5E1]">
                <span className="material-symbols-outlined text-[22px]">image</span>
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[#131b2e] dark:text-[#F8FAFC] font-semibold truncate font-mono">{file.name}</span>
                  <span className="px-2 py-0.5 rounded bg-[#F1F5F9] dark:bg-[#1B2A40] text-[#475569] dark:text-[#CBD5E1] text-xs font-mono shrink-0">{file.type.split('/')[1]?.toUpperCase()}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[#475569] dark:text-[#CBD5E1] mt-0.5 font-mono">
                  <span>{formatBytes(file.size)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 rounded-lg border border-[#DCE3ED] dark:border-[#334155] bg-white dark:bg-[#121C2D] hover:bg-[#F1F5F9] dark:hover:bg-[#1B2A40] text-[#131b2e] dark:text-[#F8FAFC] text-sm flex items-center gap-1.5 transition-colors">
                <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
                <span>Replace image</span>
              </button>
              <button onClick={resetState} className="p-1.5 rounded-lg border border-[#DCE3ED] dark:border-[#334155] bg-white dark:bg-[#121C2D] hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 text-[#475569] dark:text-[#CBD5E1] transition-colors" title="Remove current image">
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/png, image/jpeg, image/webp" onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
          </div>
        </section>

        {/* RIGHT COLUMN */}
        <aside className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-white dark:bg-[#121C2D] border border-[#DCE3ED] dark:border-[#334155] rounded-2xl p-6 shadow-sm flex flex-col gap-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE3ED] dark:border-[#334155]">
              <h2 className="text-xl font-semibold text-[#131b2e] dark:text-[#F8FAFC]">Compression Settings</h2>
            </div>

            {/* FORMAT SELECTOR */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-[#131b2e] dark:text-[#F8FAFC] flex items-center justify-between">
                <span>Target Format</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "image/webp", label: "WebP", sub: "Recommended" },
                  { value: "image/jpeg", label: "JPEG", sub: "Universal" },
                  { value: "image/png", label: "PNG", sub: "Lossless" },
                ].map((f) => (
                  <button 
                    key={f.value}
                    onClick={() => setFormat(f.value as "image/webp" | "image/jpeg" | "image/png")}
                    className={`flex flex-col items-start p-3 rounded-xl border-2 text-left transition-colors relative ${format === f.value ? 'border-[#2563eb] bg-[#EFF6FF] dark:bg-[#1B2A40]' : 'border-[#DCE3ED] dark:border-[#334155] bg-white dark:bg-[#121C2D] hover:bg-[#F1F5F9] dark:hover:bg-[#1B2A40]'}`}
                  >
                    <div className="w-full flex items-center justify-between">
                      <span className={`text-sm font-bold ${format === f.value ? 'text-[#2563eb] dark:text-[#60A5FA]' : 'text-[#131b2e] dark:text-[#F8FAFC]'}`}>{f.label}</span>
                      {format === f.value && <span className="material-symbols-outlined text-[18px] text-[#2563eb] dark:text-[#60A5FA]">check_circle</span>}
                    </div>
                    <span className="text-xs text-[#64748B] font-mono mt-0.5">{f.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* QUALITY SLIDER */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-[#131b2e] dark:text-[#F8FAFC]">Quality Factor</label>
                <div className="flex items-center gap-1 bg-[#F1F5F9] dark:bg-[#1B2A40] px-2.5 py-1 rounded-md border border-[#DCE3ED] dark:border-[#334155]">
                  <span className="text-sm font-bold text-[#2563eb] dark:text-[#60A5FA] font-mono">{quality}</span>
                  <span className="text-xs text-[#475569] dark:text-[#CBD5E1] font-mono">%</span>
                </div>
              </div>
              <input 
                type="range" 
                min="1" 
                max="100" 
                value={quality} 
                onChange={(e) => setQuality(parseInt(e.target.value))}
                className="w-full h-1.5 bg-[#DCE3ED] dark:bg-[#334155] rounded-lg appearance-none cursor-pointer accent-[#2563eb]"
              />
              <div className="flex justify-between items-center text-xs text-[#64748B]">
                <span>Smaller file</span>
                <span>Balanced</span>
                <span>Higher quality</span>
              </div>
            </div>

            {/* RESULT SUMMARY CARD */}
            {result && (
              <div className="bg-[#F1F5F9] dark:bg-[#1B2A40] border border-[#DCE3ED] dark:border-[#334155] rounded-xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#DCE3ED]/80 dark:border-[#334155]/80">
                  <span className="text-xs text-[#475569] dark:text-[#CBD5E1] uppercase tracking-wider font-semibold">Compression Metrics</span>
                  {isSaving && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200 text-xs font-bold font-mono">
                      -{savingPercentage.toFixed(1)}%
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm font-mono">
                  <div className="flex flex-col">
                    <span className="text-xs text-[#64748B]">Original</span>
                    <span className="text-[#131b2e] dark:text-[#F8FAFC] font-semibold">{formatBytes(file.size)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-[#64748B]">Output Size</span>
                    <span className="text-[#2563eb] dark:text-[#60A5FA] font-bold">{formatBytes(result.blob.size)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-[#64748B]">Output Format</span>
                    <span className="text-[#131b2e] dark:text-[#F8FAFC]">{format.split('/')[1]?.toUpperCase()}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-[#64748B]">Resolution</span>
                    <span className="text-[#131b2e] dark:text-[#F8FAFC]">{result.width} × {result.height}</span>
                  </div>
                </div>
              </div>
            )}

            {/* ACTION BUTTONS */}
            <div className="flex flex-col gap-2.5 pt-1">
              <button 
                onClick={handleDownload}
                disabled={!result || isProcessing}
                className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white text-sm font-semibold py-3 px-5 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">{isProcessing ? "autorenew" : "download"}</span>
                <span>{isProcessing ? "Processing..." : `Download image (${result ? formatBytes(result.blob.size) : ''})`}</span>
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
