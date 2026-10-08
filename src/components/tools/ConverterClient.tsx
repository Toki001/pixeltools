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

export function ConverterClient() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [format, setFormat] = useState<"image/webp" | "image/jpeg" | "image/png">("image/jpeg");
  const [quality, setQuality] = useState(92);
  const [bgColor, setBgColor] = useState<string>("#FFFFFF");
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(1);
  
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
      setResult(null);
      processImage(selectedFile, format, quality, bgColor);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid file");
    }
  };

  const processImage = async (imgFile: File, targetFormat: string, targetQuality: number, targetBg: string) => {
    if (!workerClient.current) return;
    setIsProcessing(true);
    const start = performance.now();
    try {
      const isOpaqueFormat = targetFormat === "image/jpeg";
      const finalBgColor = isOpaqueFormat ? targetBg : undefined;
      
      const res = await workerClient.current.process<{ file: File; options: unknown }, { blob: Blob; dimensions: { width: number; height: number } }>({
        file: imgFile,
        options: {
          type: targetFormat,
          quality: targetQuality / 100,
          backgroundColor: finalBgColor
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
      setError(err instanceof Error ? err.message : "Failed to convert image");
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (file) {
      const timer = setTimeout(() => {
        processImage(file, format, quality, bgColor);
      }, 300);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [format, quality, bgColor]);

  const handleDownload = () => {
    if (!file || !result) return;
    const extMap: Record<string, string> = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png" };
    const ext = extMap[format] || "jpg";
    const filename = generateOutputFilename(file.name, "converted", ext);
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

  if (!file) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#64748B]">
            <Link className="hover:text-[#131b2e] dark:hover:text-[#F8FAFC] transition-colors" href="/">Home</Link>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <Link className="hover:text-[#131b2e] dark:hover:text-[#F8FAFC] transition-colors" href="/tools">Tools</Link>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span aria-current="page" className="text-[#131b2e] dark:text-[#F8FAFC] font-semibold">Image Converter</span>
          </nav>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
            <div>
              <h1 className="text-3xl font-bold text-[#131b2e] dark:text-[#F8FAFC] tracking-tight">Convert image format</h1>
              <p className="text-base text-[#475569] dark:text-[#CBD5E1] mt-1 max-w-[720px]">
                Effortlessly transform files between WebP, PNG, and JPEG encodings directly in your browser.
              </p>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-[#121C2D] border border-[#DCE3ED] dark:border-[#334155] shadow-sm text-sm text-[#475569] dark:text-[#CBD5E1] shrink-0">
              <span className="material-symbols-outlined text-[#2563eb] dark:text-[#60A5FA]">memory</span>
              <span className="font-medium">100% Client-Side — WebAssembly & Canvas</span>
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
              <span className="material-symbols-outlined text-[32px]">add_photo_alternate</span>
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-semibold text-[#131b2e] dark:text-[#F8FAFC]">Upload an image to convert</h3>
              <p className="text-sm text-[#475569] dark:text-[#CBD5E1]">JPEG, PNG, WebP up to 50MB</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isConvertingToOpaque = format === "image/jpeg";
  const displayUrl = result?.url || originalUrl;

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#DCE3ED] dark:border-[#334155] pb-5">
        <div>
          <nav className="flex items-center gap-2 text-xs text-[#64748B] mb-2">
            <Link className="hover:text-[#131b2e] dark:hover:text-[#F8FAFC] transition-colors" href="/">Home</Link>
            <span className="text-[#DCE3ED] dark:text-[#334155]">/</span>
            <Link className="hover:text-[#131b2e] dark:hover:text-[#F8FAFC] transition-colors" href="/tools">Tools</Link>
            <span className="text-[#DCE3ED] dark:text-[#334155]">/</span>
            <span className="text-[#131b2e] dark:text-[#F8FAFC] font-semibold">Image Converter</span>
          </nav>
          <h1 className="text-3xl font-bold text-[#131b2e] dark:text-[#F8FAFC] tracking-tight">Convert image format</h1>
          <p className="text-base text-[#475569] dark:text-[#CBD5E1] mt-1 max-w-[720px]">
            Effortlessly transform files between WebP, PNG, and JPEG encodings directly in your browser.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN */}
        <section className="lg:col-span-8 flex flex-col gap-4">
          <div className="bg-white dark:bg-[#121C2D] rounded-2xl border border-[#DCE3ED] dark:border-[#334155] shadow-sm p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4 border-b border-[#DCE3ED] dark:border-[#334155] pb-3">
              <div className="flex items-center bg-[#F1F5F9] dark:bg-[#1B2A40] p-1 rounded-xl border border-[#DCE3ED] dark:border-[#334155] text-xs">
                <button 
                  onClick={() => setShowGrid(true)} 
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${showGrid ? 'bg-white dark:bg-[#121C2D] text-[#131b2e] dark:text-[#F8FAFC] shadow-sm' : 'text-[#475569] dark:text-[#CBD5E1] hover:text-[#131b2e] dark:hover:text-[#F8FAFC]'}`}
                >
                  <span className="material-symbols-outlined text-[16px]">grid_4x4</span>
                  <span>Transparency Grid</span>
                </button>
                <button 
                  onClick={() => setShowGrid(false)} 
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${!showGrid ? 'bg-white dark:bg-[#121C2D] text-[#131b2e] dark:text-[#F8FAFC] shadow-sm' : 'text-[#475569] dark:text-[#CBD5E1] hover:text-[#131b2e] dark:hover:text-[#F8FAFC]'}`}
                >
                  <span className="material-symbols-outlined text-[16px]">square</span>
                  <span>Solid Canvas</span>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-[#F1F5F9] dark:bg-[#1B2A40] border border-[#DCE3ED] dark:border-[#334155] rounded-xl px-2 py-1 text-xs text-[#475569] dark:text-[#CBD5E1]">
                  <button onClick={() => setZoom(z => Math.max(0.25, z - 0.25))} className="p-1 hover:text-[#131b2e] dark:hover:text-[#F8FAFC] transition-colors" title="Zoom Out">
                    <span className="material-symbols-outlined text-[16px]">remove</span>
                  </button>
                  <span className="px-2 font-mono tabular-nums text-[#131b2e] dark:text-[#F8FAFC] font-medium">{Math.round(zoom * 100)}%</span>
                  <button onClick={() => setZoom(z => Math.min(3, z + 0.25))} className="p-1 hover:text-[#131b2e] dark:hover:text-[#F8FAFC] transition-colors" title="Zoom In">
                    <span className="material-symbols-outlined text-[16px]">add</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="relative w-full h-[460px] rounded-xl overflow-hidden border border-[#DCE3ED] dark:border-[#334155] flex items-center justify-center select-none shadow-inner" style={{ backgroundColor: showGrid ? 'transparent' : '#F8FAFC' }}>
              {showGrid && (
                <style dangerouslySetInnerHTML={{ __html: `
                  .bg-checkerboard-converter {
                    background-color: #FFFFFF;
                    background-image: 
                      linear-gradient(45deg, #F1F5F9 25%, transparent 25%), 
                      linear-gradient(-45deg, #F1F5F9 25%, transparent 25%), 
                      linear-gradient(45deg, transparent 75%, #F1F5F9 75%), 
                      linear-gradient(-45deg, transparent 75%, #F1F5F9 75%);
                    background-size: 16px 16px;
                    background-position: 0 0, 0 8px, 8px -8px, -8px 0px;
                  }
                  .dark .bg-checkerboard-converter {
                    background-color: #0B1220;
                    background-image: 
                      linear-gradient(45deg, #1B2A40 25%, transparent 25%), 
                      linear-gradient(-45deg, #1B2A40 25%, transparent 25%), 
                      linear-gradient(45deg, transparent 75%, #1B2A40 75%), 
                      linear-gradient(-45deg, transparent 75%, #1B2A40 75%);
                  }
                `}} />
              )}
              {showGrid && <div className="absolute inset-0 bg-checkerboard-converter pointer-events-none" />}
              
              <div className="relative p-8 flex flex-col items-center justify-center">
                {displayUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={displayUrl} 
                    alt="Preview" 
                    className={`max-h-[400px] max-w-full object-contain transition-transform duration-200 ${!isConvertingToOpaque && showGrid ? 'drop-shadow-md' : ''}`}
                    style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
                  />
                ) : (
                  <span className="material-symbols-outlined animate-spin text-4xl text-[#2563eb]">autorenew</span>
                )}
              </div>
              
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-white/90 dark:bg-[#121C2D]/90 backdrop-blur-xs border border-[#DCE3ED] dark:border-[#334155] px-3 py-1.5 rounded-lg shadow-sm text-xs text-[#131b2e] dark:text-[#F8FAFC]">
                <span className="w-2 h-2 rounded-full bg-[#2563eb] dark:bg-[#60A5FA]"></span>
                <span className="font-medium">Result: {format.split('/')[1]?.toUpperCase()}</span>
                {result && (
                  <>
                    <span className="text-[#64748B]">•</span>
                    <span className="font-mono tabular-nums text-[#475569] dark:text-[#CBD5E1]">{result.width} × {result.height} px • {formatBytes(result.blob.size)}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#121C2D] rounded-2xl border border-[#DCE3ED] dark:border-[#334155] p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#F1F5F9] dark:bg-[#1B2A40] border border-[#DCE3ED] dark:border-[#334155] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[#2563eb] dark:text-[#60A5FA]">image</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-[#131b2e] dark:text-[#F8FAFC] font-semibold tracking-tight">{file.name}</span>
                </div>
                <span className="text-xs text-[#475569] dark:text-[#CBD5E1] font-mono tabular-nums mt-0.5">
                  {file.type.split('/')[1]?.toUpperCase()} • {formatBytes(file.size)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#DCE3ED] dark:border-[#334155] bg-white dark:bg-[#121C2D] hover:bg-[#F1F5F9] dark:hover:bg-[#1B2A40] text-sm text-[#131b2e] dark:text-[#F8FAFC] transition-colors">
                <span className="material-symbols-outlined text-[18px]">sync</span>
                <span>Replace</span>
              </button>
              <button onClick={resetState} className="p-2 rounded-xl border border-[#DCE3ED] dark:border-[#334155] bg-white dark:bg-[#121C2D] hover:bg-red-50 dark:hover:bg-red-950/30 text-[#475569] dark:text-[#CBD5E1] hover:text-red-600 dark:hover:text-red-400 transition-colors">
                <span className="material-symbols-outlined text-[20px]">delete</span>
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/png, image/jpeg, image/webp" onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN */}
        <aside className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-white dark:bg-[#121C2D] rounded-2xl border border-[#DCE3ED] dark:border-[#334155] shadow-sm p-5 flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-[#DCE3ED] dark:border-[#334155] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#2563eb] dark:text-[#60A5FA]">tune</span>
                <h2 className="text-lg font-semibold text-[#131b2e] dark:text-[#F8FAFC]">Conversion Settings</h2>
              </div>
            </div>

            {/* Target Output Format */}
            <div className="flex flex-col gap-2.5">
              <label className="text-sm font-semibold text-[#131b2e] dark:text-[#F8FAFC]">Target Output Format</label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: "image/jpeg", name: "JPEG (.jpg)", badge: "Target", sub: "Universal compatibility • Lossy" },
                  { id: "image/webp", name: "WebP (.webp)", badge: "Recommended", sub: "Modern web • High compression" },
                  { id: "image/png", name: "PNG (.png)", badge: "", sub: "Lossless • Preserves alpha" },
                ].map((f) => (
                  <div 
                    key={f.id} 
                    onClick={() => setFormat(f.id as "image/webp" | "image/jpeg" | "image/png")}
                    className={`relative flex items-start p-3 rounded-xl border-2 cursor-pointer transition-all ${format === f.id ? 'border-[#2563eb] bg-[#EFF6FF] dark:bg-[#1B2A40]' : 'border-[#DCE3ED] dark:border-[#334155] bg-white dark:bg-[#121C2D] hover:bg-[#F1F5F9] dark:hover:bg-[#1B2A40]'}`}
                  >
                    <input 
                      type="radio" 
                      name="target_format" 
                      checked={format === f.id} 
                      readOnly 
                      className="mt-1 w-4 h-4 text-[#2563eb] border-[#DCE3ED] dark:border-[#334155] focus:ring-[#2563eb]"
                    />
                    <div className="ml-3 flex flex-col flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-bold ${format === f.id ? 'text-[#131b2e] dark:text-[#F8FAFC]' : 'text-[#131b2e] dark:text-[#F8FAFC] font-semibold'}`}>{f.name}</span>
                        {f.badge && (
                          <span className={`text-[11px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded border ${f.badge === 'Target' ? 'text-[#2563eb] dark:text-[#60A5FA] bg-white dark:bg-[#121C2D] border-[#2563eb]/30' : 'text-[#64748B]'}`}>
                            {f.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-[#475569] dark:text-[#CBD5E1] mt-0.5">{f.sub}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Transparent Background Handling */}
            {isConvertingToOpaque && (
              <div className="flex flex-col gap-3 p-3.5 rounded-xl bg-[#F1F5F9] dark:bg-[#1B2A40] border border-[#DCE3ED] dark:border-[#334155]">
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-white dark:bg-[#121C2D] border border-amber-500/40 shadow-xs">
                  <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 text-[18px]">warning</span>
                  <p className="text-xs text-[#131b2e] dark:text-[#F8FAFC] leading-snug">
                    JPEG does not support transparency. Select a background color to fill transparent areas.
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-[#131b2e] dark:text-[#F8FAFC]">Fill Color for Alpha Channel</span>
                  <div className="flex items-center gap-2">
                    {[
                      { color: "#FFFFFF", title: "White" },
                      { color: "#000000", title: "Black" },
                      { color: "#F1F5F9", title: "Slate" },
                      { color: "#0F172A", title: "Dark" },
                    ].map(c => (
                      <button 
                        key={c.color}
                        onClick={() => setBgColor(c.color)}
                        className={`w-8 h-8 rounded-lg shadow-xs flex items-center justify-center transition-transform ${bgColor === c.color ? 'border-2 border-[#2563eb] scale-105' : 'border border-[#DCE3ED] dark:border-[#334155] hover:scale-105'}`}
                        style={{ backgroundColor: c.color }}
                        title={c.title}
                      >
                        {bgColor === c.color && <span className={`material-symbols-outlined text-[16px] ${c.color === '#FFFFFF' || c.color === '#F1F5F9' ? 'text-[#2563eb]' : 'text-white'}`}>check</span>}
                      </button>
                    ))}
                    <div className="flex items-center ml-auto border border-[#DCE3ED] dark:border-[#334155] rounded-lg bg-white dark:bg-[#121C2D] px-2 py-1 gap-1.5 focus-within:ring-2 focus-within:ring-[#2563eb]">
                      <span className="w-4 h-4 rounded-full border border-[#DCE3ED] dark:border-[#334155] shrink-0" style={{ backgroundColor: bgColor }}></span>
                      <input 
                        type="text" 
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="w-16 font-mono text-xs uppercase text-[#131b2e] dark:text-[#F8FAFC] bg-transparent focus:outline-none border-0 p-0"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quality Slider (for lossy formats) */}
            {format !== "image/png" && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-[#131b2e] dark:text-[#F8FAFC]">Quality</label>
                  <span className="font-mono text-sm font-bold text-[#2563eb] dark:text-[#60A5FA] px-2 py-0.5 rounded bg-[#EFF6FF] dark:bg-[#1B2A40] border border-[#2563eb]/20">{quality}%</span>
                </div>
                <input 
                  type="range" 
                  min="10" 
                  max="100" 
                  value={quality} 
                  onChange={(e) => setQuality(parseInt(e.target.value))}
                  className="w-full h-1 bg-[#DCE3ED] dark:bg-[#334155] rounded-lg appearance-none cursor-pointer accent-[#2563eb]"
                />
                <div className="flex items-center justify-between text-xs text-[#64748B]">
                  <span>Smaller file</span>
                  <span>Maximum quality</span>
                </div>
              </div>
            )}

            {/* Summary Card */}
            {result && (
              <div className="bg-[#F1F5F9] dark:bg-[#1B2A40] rounded-xl p-3.5 border border-[#DCE3ED] dark:border-[#334155] flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#475569] dark:text-[#CBD5E1]">Output Format:</span>
                  <span className="font-medium text-[#131b2e] dark:text-[#F8FAFC] font-mono">{format.split('/')[1]?.toUpperCase()}</span>
                </div>
                {isConvertingToOpaque && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#475569] dark:text-[#CBD5E1]">Background Fill:</span>
                    <span className="font-medium text-[#131b2e] dark:text-[#F8FAFC] flex items-center gap-1.5 font-mono">
                      <span className="w-3 h-3 rounded-full border border-[#DCE3ED] dark:border-[#334155]" style={{ backgroundColor: bgColor }}></span>
                      {bgColor}
                    </span>
                  </div>
                )}
                <div className="h-px bg-[#DCE3ED] dark:bg-[#334155] my-1"></div>
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-[#131b2e] dark:text-[#F8FAFC]">Est. Output Size:</span>
                  <span className={`font-mono ${result.blob.size < file.size ? 'text-[#15803D] dark:text-[#4ADE80]' : 'text-amber-600 dark:text-amber-400'}`}>
                    {formatBytes(result.blob.size)} ({result.blob.size < file.size ? '' : '+'}{Math.round(((result.blob.size - file.size) / file.size) * 100)}%)
                  </span>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2.5">
              <button 
                onClick={handleDownload}
                disabled={!result || isProcessing}
                className="w-full flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white text-sm font-semibold py-3 px-5 rounded-xl shadow-xs transition-colors"
              >
                <span className="material-symbols-outlined">{isProcessing ? 'autorenew' : 'download'}</span>
                <span>{isProcessing ? 'Converting...' : `Convert to ${format.split('/')[1]?.toUpperCase()} (Download)`}</span>
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
