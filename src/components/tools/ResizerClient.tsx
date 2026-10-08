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

export function ResizerClient() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [originalDimensions, setOriginalDimensions] = useState<{ width: number, height: number } | null>(null);
  const [targetWidth, setTargetWidth] = useState<number>(0);
  const [targetHeight, setTargetHeight] = useState<number>(0);
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  
  const [showGuides, setShowGuides] = useState(true);
  const [zoom, setZoom] = useState(1);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ blob: Blob, url: string, timeMs: number } | null>(null);
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
      
      // Get dimensions
      const img = new Image();
      img.onload = () => {
        setOriginalDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        setTargetWidth(img.naturalWidth);
        setTargetHeight(img.naturalHeight);
        setResult(null);
        // Do an initial process
        processImage(selectedFile, img.naturalWidth, img.naturalHeight);
      };
      img.src = url;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid file");
    }
  };

  const processImage = async (imgFile: File, width: number, height: number) => {
    if (!workerClient.current || width <= 0 || height <= 0) return;
    setIsProcessing(true);
    const start = performance.now();
    try {
      let format = imgFile.type as "image/webp" | "image/jpeg" | "image/png";
      if (!["image/webp", "image/jpeg", "image/png"].includes(format)) {
        format = "image/jpeg";
      }

      const res = await workerClient.current.process<{ file: File; options: unknown }, { blob: Blob; dimensions: { width: number; height: number } }>({
        file: imgFile,
        options: {
          type: format,
          quality: 0.92,
          width,
          height
        }
      });
      const url = URL.createObjectURL(res.blob);
      setResult({
        blob: res.blob,
        url,
        timeMs: Math.round(performance.now() - start)
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to resize image");
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (file && originalDimensions && targetWidth > 0 && targetHeight > 0) {
      const timer = setTimeout(() => {
        processImage(file, targetWidth, targetHeight);
      }, 300);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetWidth, targetHeight]);

  const handleWidthChange = (val: string) => {
    const w = parseInt(val) || 0;
    setTargetWidth(w);
    if (lockAspectRatio && originalDimensions && w > 0) {
      setTargetHeight(Math.round(w * (originalDimensions.height / originalDimensions.width)));
    }
  };

  const handleHeightChange = (val: string) => {
    const h = parseInt(val) || 0;
    setTargetHeight(h);
    if (lockAspectRatio && originalDimensions && h > 0) {
      setTargetWidth(Math.round(h * (originalDimensions.width / originalDimensions.height)));
    }
  };

  const applyPreset = (scale: number) => {
    if (!originalDimensions) return;
    setTargetWidth(Math.round(originalDimensions.width * scale));
    setTargetHeight(Math.round(originalDimensions.height * scale));
  };

  const handleDownload = () => {
    if (!file || !result) return;
    let format = file.type as string;
    if (!["image/webp", "image/jpeg", "image/png"].includes(format)) format = "image/jpeg";
    const extMap: Record<string, string> = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png" };
    const ext = extMap[format] || "jpg";
    const filename = generateOutputFilename(file.name, `resized-${targetWidth}x${targetHeight}`, ext);
    downloadBlob(result.blob, filename);
  };

  const resetState = () => {
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (result?.url) URL.revokeObjectURL(result.url);
    setFile(null);
    setOriginalUrl(null);
    setResult(null);
    setError(null);
    setOriginalDimensions(null);
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
            <span aria-current="page" className="text-[#131b2e] dark:text-[#F8FAFC] font-semibold">Image Resizer</span>
          </nav>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
            <div>
              <h1 className="text-3xl font-bold text-[#131b2e] dark:text-[#F8FAFC] tracking-tight">Resize image dimensions</h1>
              <p className="text-base text-[#475569] dark:text-[#CBD5E1] mt-1 max-w-[720px]">
                Change pixel width, height, or scale percentage with precision resampling entirely in your browser.
              </p>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-[#121C2D] border border-[#DCE3ED] dark:border-[#334155] shadow-sm text-sm text-[#475569] dark:text-[#CBD5E1] shrink-0">
              <span className="material-symbols-outlined text-[#15803D] dark:text-[#4ADE80]">verified_user</span>
              <span className="font-medium">Zero telemetry</span>
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
              <span className="material-symbols-outlined text-[32px]">aspect_ratio</span>
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-semibold text-[#131b2e] dark:text-[#F8FAFC]">Upload an image to resize</h3>
              <p className="text-sm text-[#475569] dark:text-[#CBD5E1]">JPEG, PNG, WebP up to 50MB</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getRatioStr = () => {
    if (!originalDimensions) return "";
    const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : a;
    const d = gcd(originalDimensions.width, originalDimensions.height);
    return `${originalDimensions.width / d}:${originalDimensions.height / d}`;
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#DCE3ED] dark:border-[#334155] pb-5">
        <div>
          <nav className="flex items-center gap-2 text-xs text-[#64748B] mb-2">
            <Link className="hover:text-[#131b2e] dark:hover:text-[#F8FAFC] transition-colors" href="/">Home</Link>
            <span className="text-[#DCE3ED] dark:text-[#334155]">/</span>
            <Link className="hover:text-[#131b2e] dark:hover:text-[#F8FAFC] transition-colors" href="/tools">Tools</Link>
            <span className="text-[#DCE3ED] dark:text-[#334155]">/</span>
            <span className="text-[#131b2e] dark:text-[#F8FAFC] font-semibold">Image Resizer</span>
          </nav>
          <h1 className="text-3xl font-bold text-[#131b2e] dark:text-[#F8FAFC] tracking-tight">Resize image dimensions</h1>
          <p className="text-base text-[#475569] dark:text-[#CBD5E1] mt-1 max-w-[720px]">
            Change pixel width, height, or scale percentage with precision resampling entirely in your browser.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN */}
        <section className="lg:col-span-8 flex flex-col gap-4">
          <div className="bg-white dark:bg-[#121C2D] rounded-2xl border border-[#DCE3ED] dark:border-[#334155] p-6 shadow-sm flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#DCE3ED] dark:border-[#334155]">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 bg-[#F1F5F9] dark:bg-[#1B2A40] text-[#131b2e] dark:text-[#F8FAFC] font-semibold rounded-lg text-xs border border-[#DCE3ED] dark:border-[#334155]">Source Image</span>
                <span className="text-xs text-[#475569] dark:text-[#CBD5E1] font-mono">{originalDimensions?.width} × {originalDimensions?.height} px</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-[#475569] dark:text-[#CBD5E1] cursor-pointer flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">straighten</span>
                  <span>Dimension guides</span>
                </label>
                <div className="relative inline-block w-9 h-5 align-middle select-none transition duration-200 ease-in">
                  <input type="checkbox" checked={showGuides} onChange={(e) => setShowGuides(e.target.checked)} className="toggle-checkbox absolute block w-4 h-4 rounded-full bg-white border border-[#DCE3ED] dark:border-[#334155] appearance-none cursor-pointer checked:right-0.5 right-4.5 top-0.5 checked:bg-[#2563eb] transition-all duration-150" />
                  <label className="toggle-label block overflow-hidden h-5 rounded-full bg-[#F1F5F9] dark:bg-[#1B2A40] border border-[#DCE3ED] dark:border-[#334155] cursor-pointer"></label>
                </div>
              </div>
            </div>

            <div className="relative w-full aspect-[3/2] rounded-xl overflow-hidden border border-[#DCE3ED] dark:border-[#334155] flex items-center justify-center p-6 select-none group bg-checkerboard-resizer">
              <style dangerouslySetInnerHTML={{ __html: `
                .bg-checkerboard-resizer {
                  background-color: #FFFFFF;
                  background-image: 
                    linear-gradient(45deg, #F1F5F9 25%, transparent 25%), 
                    linear-gradient(-45deg, #F1F5F9 25%, transparent 25%), 
                    linear-gradient(45deg, transparent 75%, #F1F5F9 75%), 
                    linear-gradient(-45deg, transparent 75%, #F1F5F9 75%);
                  background-size: 16px 16px;
                  background-position: 0 0, 0 8px, 8px -8px, -8px 0px;
                }
                .dark .bg-checkerboard-resizer {
                  background-color: #0B1220;
                  background-image: 
                    linear-gradient(45deg, #1B2A40 25%, transparent 25%), 
                    linear-gradient(-45deg, #1B2A40 25%, transparent 25%), 
                    linear-gradient(45deg, transparent 75%, #1B2A40 75%), 
                    linear-gradient(-45deg, transparent 75%, #1B2A40 75%);
                }
                .toggle-checkbox:checked { right: 0.125rem; border-color: transparent; }
                .toggle-checkbox { right: 1.125rem; border-color: #DCE3ED; }
              `}} />

              {/* Guides */}
              {showGuides && originalDimensions && (
                <>
                  <div className="absolute top-2 left-6 right-6 flex flex-col items-center z-20 pointer-events-none">
                    <div className="w-full flex items-center">
                      <div className="h-2 w-px bg-[#2563eb]"></div>
                      <div className="h-px w-full bg-[#2563eb] relative">
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white dark:bg-[#121C2D] px-2 py-0.5 text-[11px] font-mono font-semibold text-[#2563eb] dark:text-[#60A5FA] rounded border border-[#DCE3ED] dark:border-[#334155] shadow-xs">
                          {originalDimensions.width}px → {targetWidth}px
                        </span>
                      </div>
                      <div className="h-2 w-px bg-[#2563eb]"></div>
                    </div>
                  </div>
                  <div className="absolute left-2 top-6 bottom-6 flex items-center z-20 pointer-events-none">
                    <div className="h-full flex flex-col items-center">
                      <div className="w-2 h-px bg-[#2563eb]"></div>
                      <div className="w-px h-full bg-[#2563eb] relative">
                        <span className="absolute top-1/2 -left-2 -translate-y-1/2 -rotate-90 origin-center bg-white dark:bg-[#121C2D] px-2 py-0.5 text-[11px] font-mono font-semibold text-[#2563eb] dark:text-[#60A5FA] rounded border border-[#DCE3ED] dark:border-[#334155] shadow-xs whitespace-nowrap">
                          {originalDimensions.height}px → {targetHeight}px
                        </span>
                      </div>
                      <div className="w-2 h-px bg-[#2563eb]"></div>
                    </div>
                  </div>
                </>
              )}

              <div className="relative w-full h-full rounded-lg overflow-hidden shadow-sm border border-[#DCE3ED]/80 dark:border-[#334155]/80 flex items-center justify-center">
                {originalUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={originalUrl} 
                    alt="Preview" 
                    className="w-full h-full object-contain transform transition-transform duration-300" 
                    style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
                  />
                ) : (
                  <span className="material-symbols-outlined animate-spin text-4xl text-[#2563eb]">autorenew</span>
                )}
                
                {showGuides && originalDimensions && (
                  <div 
                    className="absolute m-auto border-2 border-dashed border-[#2563eb] bg-[#2563eb]/10 rounded pointer-events-none flex items-center justify-center"
                    style={{
                      width: `${Math.min(100, (targetWidth / originalDimensions.width) * 100)}%`,
                      height: `${Math.min(100, (targetHeight / originalDimensions.height) * 100)}%`
                    }}
                  >
                    <div className="bg-white/90 dark:bg-[#121C2D]/90 backdrop-blur-xs px-2.5 py-1 rounded text-xs text-[#2563eb] dark:text-[#60A5FA] font-mono shadow-xs border border-[#2563eb]/20">
                      {targetWidth} × {targetHeight} px
                    </div>
                  </div>
                )}
              </div>

              <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-white/95 dark:bg-[#121C2D]/95 px-2 py-1 rounded-lg border border-[#DCE3ED] dark:border-[#334155] shadow-sm text-xs text-[#475569] dark:text-[#CBD5E1]">
                <button onClick={() => setZoom(1)} className="p-1 hover:text-[#131b2e] dark:hover:text-[#F8FAFC] transition-colors" title="Fit to screen">
                  <span className="material-symbols-outlined text-[18px]">fit_screen</span>
                </button>
                <span className="h-3 w-px bg-[#DCE3ED] dark:bg-[#334155]"></span>
                <button className="p-1 hover:text-[#131b2e] dark:hover:text-[#F8FAFC] transition-colors font-mono text-[11px]" title="Current Zoom">
                  {Math.round(zoom * 100)}%
                </button>
                <span className="h-3 w-px bg-[#DCE3ED] dark:bg-[#334155]"></span>
                <button onClick={() => setZoom(z => Math.min(3, z + 0.25))} className="p-1 hover:text-[#131b2e] dark:hover:text-[#F8FAFC] transition-colors" title="Zoom in">
                  <span className="material-symbols-outlined text-[18px]">zoom_in</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3 bg-[#F1F5F9] dark:bg-[#1B2A40] rounded-xl border border-[#DCE3ED] dark:border-[#334155]">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="w-10 h-10 rounded-lg bg-white dark:bg-[#121C2D] border border-[#DCE3ED] dark:border-[#334155] flex items-center justify-center text-[#2563eb] dark:text-[#60A5FA] shrink-0">
                <span className="material-symbols-outlined text-[22px]">image</span>
              </div>
              <div className="truncate">
                <p className="text-sm font-semibold text-[#131b2e] dark:text-[#F8FAFC] truncate">{file.name}</p>
                <div className="flex items-center gap-2 text-xs text-[#475569] dark:text-[#CBD5E1]">
                  <span className="font-mono">{originalDimensions?.width} × {originalDimensions?.height} px</span>
                  <span>•</span>
                  <span>{formatBytes(file.size)}</span>
                  <span>•</span>
                  <span className="text-[#15803D] dark:text-[#4ADE80] inline-flex items-center gap-1 font-medium">
                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                    Loaded
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#121C2D] text-[#131b2e] dark:text-[#F8FAFC] hover:bg-[#F1F5F9] dark:hover:bg-[#1B2A40] border border-[#DCE3ED] dark:border-[#334155] rounded-xl text-xs transition-colors">
                <span className="material-symbols-outlined text-[16px]">refresh</span>
                <span>Replace image</span>
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
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE3ED] dark:border-[#334155]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#2563eb] dark:text-[#60A5FA] text-[20px]">tune</span>
                <h2 className="text-lg font-semibold text-[#131b2e] dark:text-[#F8FAFC]">Resize Settings</h2>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[#131b2e] dark:text-[#F8FAFC]">Dimensions</span>
                <span className="text-xs text-[#64748B]">Target bounds</span>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {/* Width Input */}
                <div>
                  <label className="block text-xs text-[#475569] dark:text-[#CBD5E1] mb-1">Width (px)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={targetWidth} 
                      onChange={(e) => handleWidthChange(e.target.value)}
                      className="w-full bg-white dark:bg-[#121C2D] border border-[#DCE3ED] dark:border-[#334155] rounded-xl px-4 py-2.5 font-mono text-sm text-[#131b2e] dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-[#2563eb] bg-transparent" 
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs text-[#64748B] font-mono">px</span>
                  </div>
                </div>
                {/* Lock */}
                <div className="flex items-center justify-between px-3 py-2 bg-[#EFF6FF]/60 dark:bg-[#1B2A40]/60 border border-[#DCE3ED] dark:border-[#334155] rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-white dark:bg-[#121C2D] text-[#2563eb] dark:text-[#60A5FA] border border-[#DCE3ED] dark:border-[#334155] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[16px]">link</span>
                    </span>
                    <span className="text-xs text-[#2563eb] dark:text-[#60A5FA] font-semibold">Lock aspect ratio ({getRatioStr()})</span>
                  </div>
                  <span 
                    onClick={() => setLockAspectRatio(!lockAspectRatio)}
                    className={`material-symbols-outlined text-[18px] cursor-pointer ${lockAspectRatio ? 'text-[#2563eb] dark:text-[#60A5FA]' : 'text-[#64748B]'}`}
                  >
                    {lockAspectRatio ? 'toggle_on' : 'toggle_off'}
                  </span>
                </div>
                {/* Height Input */}
                <div>
                  <label className="block text-xs text-[#475569] dark:text-[#CBD5E1] mb-1">Height (px) {lockAspectRatio && <span className="text-[#64748B] font-normal">(auto)</span>}</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={targetHeight} 
                      onChange={(e) => handleHeightChange(e.target.value)}
                      className={`w-full border border-[#DCE3ED] dark:border-[#334155] rounded-xl px-4 py-2.5 font-mono text-sm text-[#131b2e] dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-[#2563eb] bg-transparent ${lockAspectRatio ? 'bg-[#F1F5F9] dark:bg-[#1B2A40]' : 'bg-white dark:bg-[#121C2D]'}`} 
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs text-[#64748B] font-mono">px</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs text-[#475569] dark:text-[#CBD5E1]">Quick Scale Presets</label>
              <div className="grid grid-cols-4 gap-2">
                {[0.25, 0.5, 0.75].map(scale => {
                  const isActive = originalDimensions && targetWidth === Math.round(originalDimensions.width * scale);
                  return (
                    <button 
                      key={scale}
                      onClick={() => applyPreset(scale)}
                      className={`py-1.5 px-2 text-center text-xs rounded-lg transition-colors ${isActive ? 'font-semibold border border-[#2563eb] bg-[#2563eb] text-white shadow-xs' : 'border border-[#DCE3ED] dark:border-[#334155] bg-white dark:bg-[#121C2D] hover:bg-[#F1F5F9] dark:hover:bg-[#1B2A40] text-[#475569] dark:text-[#CBD5E1]'}`}
                    >
                      {scale * 100}%
                    </button>
                  );
                })}
                <button className="py-1.5 px-2 text-center text-xs rounded-lg border border-[#DCE3ED] dark:border-[#334155] bg-white dark:bg-[#121C2D] text-[#475569] dark:text-[#CBD5E1] opacity-50 cursor-default">
                  Custom
                </button>
              </div>
            </div>

            <div className="p-3 bg-[#F1F5F9] dark:bg-[#1B2A40] rounded-xl border border-[#DCE3ED] dark:border-[#334155] flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[#2563eb] dark:text-[#60A5FA] text-[18px] shrink-0 mt-0.5">info</span>
              <div className="flex flex-col gap-1">
                <p className="text-xs text-[#131b2e] dark:text-[#F8FAFC] font-semibold">High Quality Resampling</p>
                <p className="text-[11px] leading-relaxed text-[#475569] dark:text-[#CBD5E1]">Original resolution is preserved in source buffer. Resizing uses high quality smoothing via Canvas API.</p>
              </div>
            </div>

            {/* Summary Box */}
            <div className="p-4 bg-[#F1F5F9]/70 dark:bg-[#1B2A40]/70 rounded-xl border border-[#DCE3ED] dark:border-[#334155] flex flex-col gap-2 font-mono text-xs">
              <div className="flex justify-between items-center text-[#475569] dark:text-[#CBD5E1] pb-1 border-b border-[#DCE3ED]/60 dark:border-[#334155]/60">
                <span className="font-sans font-medium text-[#64748B]">Original:</span>
                <span className="text-[#131b2e] dark:text-[#F8FAFC]">{originalDimensions?.width} × {originalDimensions?.height} px</span>
              </div>
              <div className="flex justify-between items-center text-[#475569] dark:text-[#CBD5E1] pb-1 border-b border-[#DCE3ED]/60 dark:border-[#334155]/60">
                <span className="font-sans font-medium text-[#64748B]">Target:</span>
                <span className="text-[#2563eb] dark:text-[#60A5FA] font-semibold">{targetWidth} × {targetHeight} px</span>
              </div>
              <div className="flex justify-between items-center pt-0.5">
                <span className="font-sans font-medium text-[#64748B]">Est. Output:</span>
                <span className="text-[#15803D] dark:text-[#4ADE80] font-semibold">
                  {result ? formatBytes(result.blob.size) : '...'}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <button 
                onClick={handleDownload}
                disabled={!result || isProcessing}
                className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-sm font-semibold transition-colors duration-150 shadow-sm disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[20px]">{isProcessing ? 'autorenew' : 'download'}</span>
                <span>{isProcessing ? 'Resizing...' : 'Resize Image (Download)'}</span>
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
