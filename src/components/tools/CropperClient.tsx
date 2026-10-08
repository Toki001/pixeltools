"use client";

import { useState, useEffect, useRef, SyntheticEvent } from "react";
import Link from "next/link";
import ReactCrop, { Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

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

export function CropperClient() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [originalDimensions, setOriginalDimensions] = useState<{ width: number, height: number } | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // react-image-crop state
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 50,
    height: 50,
    x: 25,
    y: 25
  });
  const [percentCrop, setPercentCrop] = useState<Crop | null>(null);
  const [aspect, setAspect] = useState<number | undefined>(16 / 9);
  
  const [targetFormat, setTargetFormat] = useState<"image/webp" | "image/jpeg" | "image/png">("image/jpeg");
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ blob: Blob, url: string, timeMs: number } | null>(null);
  
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
      setResult(null);
      setOriginalDimensions(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid file");
    }
  };

  const onImageLoad = (e: SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setOriginalDimensions({ width: naturalWidth, height: naturalHeight });
    
    // Initial center crop
    const cw = naturalWidth * 0.5;
    const ch = aspect ? cw / aspect : naturalHeight * 0.5;
    
    setCrop({
      unit: 'px',
      width: cw,
      height: ch,
      x: (naturalWidth - cw) / 2,
      y: (naturalHeight - ch) / 2
    });
  };

  const processImage = async () => {
    if (!workerClient.current || !file || !percentCrop || actualCropWidth === 0 || actualCropHeight === 0) return;
    setIsProcessing(true);
    try {
      const pixelCrop = {
        x: actualCropX,
        y: actualCropY,
        width: actualCropWidth,
        height: actualCropHeight,
      };

      const res = await workerClient.current.process<{ file: File; options: unknown }, { blob: Blob; dimensions: { width: number; height: number } }>({
        file: file,
        options: {
          type: targetFormat,
          quality: 0.92,
          crop: pixelCrop
        }
      });
      const url = URL.createObjectURL(res.blob);
      setResult({
        blob: res.blob,
        url,
        timeMs: 0
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to crop image");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    await processImage(); // Generate the full resolution crop right before download
  };

  // When result is generated in handleDownload, trigger download
  useEffect(() => {
    if (result && !isProcessing) {
      const extMap: Record<string, string> = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png" };
      const ext = extMap[targetFormat] || "jpg";
      const filename = generateOutputFilename(file?.name || "image", "cropped", ext);
      downloadBlob(result.blob, filename);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  const resetState = () => {
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (result?.url) URL.revokeObjectURL(result.url);
    setFile(null);
    setOriginalUrl(null);
    setResult(null);
    setError(null);
    setOriginalDimensions(null);
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
            <span aria-current="page" className="text-[#131b2e] dark:text-[#F8FAFC] font-semibold">Image Cropper</span>
          </nav>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
            <div>
              <h1 className="text-3xl font-bold text-[#131b2e] dark:text-[#F8FAFC] tracking-tight">Crop image online</h1>
              <p className="text-base text-[#475569] dark:text-[#CBD5E1] mt-1 max-w-[720px]">
                Select custom rectangular areas or standard aspect ratios with precision pixel snapping. Zero uploads, 100% private in-browser.
              </p>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#ECFDF5] dark:bg-[#064E3B] border border-[#A7F3D0] dark:border-[#047857] shadow-sm text-sm text-[#059669] dark:text-[#34D399] shrink-0">
              <span className="material-symbols-outlined">verified_user</span>
              <span className="font-medium">Zero telemetry & on-device</span>
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
              <span className="material-symbols-outlined text-[32px]">crop</span>
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-semibold text-[#131b2e] dark:text-[#F8FAFC]">Upload an image to crop</h3>
              <p className="text-sm text-[#475569] dark:text-[#CBD5E1]">JPEG, PNG, WebP up to 50MB</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleAspectClick = (ratio: number | undefined) => {
    setAspect(ratio);
    if (ratio && originalDimensions) {
      const cw = 80; // 80% width
      const ch = (cw * originalDimensions.width) / (ratio * originalDimensions.height);
      const newCrop: Crop = {
        unit: '%',
        width: cw,
        height: ch,
        x: (100 - cw) / 2,
        y: (100 - ch) / 2
      };
      setCrop(newCrop);
      setPercentCrop(newCrop);
    }
  };

  // Calculate actual pixel dimensions from crop percentage
  const actualCropWidth = percentCrop && originalDimensions ? Math.round((percentCrop.width / 100) * originalDimensions.width) : 0;
  const actualCropHeight = percentCrop && originalDimensions ? Math.round((percentCrop.height / 100) * originalDimensions.height) : 0;
  const actualCropX = percentCrop && originalDimensions ? Math.round((percentCrop.x / 100) * originalDimensions.width) : 0;
  const actualCropY = percentCrop && originalDimensions ? Math.round((percentCrop.y / 100) * originalDimensions.height) : 0;

  const getAspectStr = (ratio: number | undefined) => {
    if (ratio === undefined) return "Free";
    if (Math.abs(ratio - 1) < 0.01) return "1:1";
    if (Math.abs(ratio - 16/9) < 0.01) return "16:9";
    if (Math.abs(ratio - 4/3) < 0.01) return "4:3";
    if (Math.abs(ratio - 9/16) < 0.01) return "9:16";
    if (Math.abs(ratio - 3/2) < 0.01) return "3:2";
    return "Custom";
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
            <span className="text-[#131b2e] dark:text-[#F8FAFC] font-semibold">Image Cropper</span>
          </nav>
          <h1 className="text-3xl font-bold text-[#131b2e] dark:text-[#F8FAFC] tracking-tight">Crop image online</h1>
          <p className="text-base text-[#475569] dark:text-[#CBD5E1] mt-1 max-w-[720px]">
            Select custom rectangular areas or standard aspect ratios with precision pixel snapping.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN */}
        <section className="lg:col-span-8 flex flex-col gap-4">
          <div className="bg-white dark:bg-[#121C2D] rounded-2xl border border-[#DCE3ED] dark:border-[#334155] p-3 shadow-sm flex flex-col gap-3">
            <div className="flex items-center gap-2 bg-[#F1F5F9] dark:bg-[#1B2A40] w-fit px-3 py-1.5 rounded-lg border border-[#DCE3ED] dark:border-[#334155]">
              <span className="material-symbols-outlined text-[16px] text-[#2563eb] dark:text-[#60A5FA]">crop_16_9</span>
              <span className="text-xs font-semibold text-[#131b2e] dark:text-[#F8FAFC]">Aspect: {getAspectStr(aspect)}</span>
            </div>

            <div className="relative bg-[#0B1220] border border-[#DCE3ED] dark:border-[#334155] rounded-xl overflow-hidden shadow-xs select-none bg-checkerboard min-h-[460px] flex items-center justify-center p-6">
              <style dangerouslySetInnerHTML={{ __html: `
                .bg-checkerboard {
                  background-image: 
                    linear-gradient(45deg, #1B2A40 25%, transparent 25%), 
                    linear-gradient(-45deg, #1B2A40 25%, transparent 25%), 
                    linear-gradient(45deg, transparent 75%, #1B2A40 75%), 
                    linear-gradient(-45deg, transparent 75%, #1B2A40 75%);
                  background-size: 16px 16px;
                  background-position: 0 0, 0 8px, 8px -8px, -8px 0px;
                }
                .ReactCrop__crop-selection {
                  border: 2px solid #fff;
                  box-shadow: 0 0 0 9999em rgba(0, 0, 0, 0.65);
                }
              `}} />

              <ReactCrop
                crop={crop}
                onChange={(c, pc) => { setCrop(c); setPercentCrop(pc); }}
                onComplete={(_, pc) => { setPercentCrop(pc); }}
                aspect={aspect}
                ruleOfThirds={true}
                className="max-h-full max-w-full"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imgRef}
                  alt="Crop me"
                  src={originalUrl}
                  onLoad={onImageLoad}
                  className="max-h-[600px] w-auto h-auto object-contain"
                />
              </ReactCrop>
              
              <div className="absolute bottom-3 left-4 bg-[#121C2D]/90 backdrop-blur-sm border border-[#334155]/60 text-white px-3 py-1 rounded-full text-xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#2563eb] animate-pulse"></span>
                <span>Interactive Crop Canvas: Drag edges or frame to reposition</span>
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
                  <span className="font-mono">Original: {originalDimensions?.width} × {originalDimensions?.height} px</span>
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
        <aside className="lg:col-span-4 flex flex-col gap-5">
          <div className="bg-white dark:bg-[#121C2D] border border-[#DCE3ED] dark:border-[#334155] rounded-2xl p-6 shadow-xs flex flex-col gap-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE3ED] dark:border-[#334155]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#2563eb] dark:text-[#60A5FA] text-[22px]">crop</span>
                <h2 className="text-lg font-semibold text-[#131b2e] dark:text-[#F8FAFC]">Crop Settings</h2>
              </div>
            </div>

            <div className="space-y-2.5">
              <label className="text-sm font-semibold text-[#131b2e] dark:text-[#F8FAFC]">Aspect Ratio Preset</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { ratio: undefined, label: "Free" },
                  { ratio: 1, label: "1:1 (Square)" },
                  { ratio: 16/9, label: "16:9 (Landscape)" },
                  { ratio: 4/3, label: "4:3 (Classic)" },
                  { ratio: 9/16, label: "9:16 (Story)" },
                  { ratio: 3/2, label: "3:2 (Photo)" },
                ].map((item, i) => (
                  <button 
                    key={i}
                    onClick={() => handleAspectClick(item.ratio)}
                    className={`px-2 py-2 text-center rounded-xl text-xs transition-all ${aspect === item.ratio ? 'border-2 border-[#2563eb] bg-[#EFF6FF] dark:bg-[#1B2A40]/50 text-[#2563eb] dark:text-[#60A5FA] font-bold shadow-xs' : 'border border-[#DCE3ED] dark:border-[#334155] hover:border-[#CBD5E1] bg-white dark:bg-[#121C2D] text-[#475569] dark:text-[#CBD5E1]'}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-[#DCE3ED] dark:border-[#334155]">
              <label className="text-sm font-semibold text-[#131b2e] dark:text-[#F8FAFC]">Target Output Format</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "image/jpeg", label: "JPEG" },
                  { id: "image/png", label: "PNG" },
                  { id: "image/webp", label: "WebP" },
                ].map((f) => (
                  <button 
                    key={f.id}
                    onClick={() => setTargetFormat(f.id as "image/webp" | "image/jpeg" | "image/png")}
                    className={`px-2 py-2 text-center rounded-xl text-xs transition-all ${targetFormat === f.id ? 'border-2 border-[#2563eb] bg-[#EFF6FF] dark:bg-[#1B2A40]/50 text-[#2563eb] dark:text-[#60A5FA] font-bold shadow-xs' : 'border border-[#DCE3ED] dark:border-[#334155] bg-white dark:bg-[#121C2D] text-[#475569] dark:text-[#CBD5E1] hover:bg-[#F1F5F9] dark:hover:bg-[#1B2A40]'}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3.5 bg-[#F1F5F9] dark:bg-[#1B2A40] border border-[#DCE3ED] dark:border-[#334155] rounded-xl space-y-2 text-xs">
              <div className="flex justify-between text-[#475569] dark:text-[#CBD5E1]">
                <span>Original Frame:</span>
                <span className="font-mono text-[#131b2e] dark:text-[#F8FAFC]">{originalDimensions?.width} × {originalDimensions?.height} px</span>
              </div>
              <div className="flex justify-between text-[#475569] dark:text-[#CBD5E1]">
                <span>Cropped Selection:</span>
                <span className="font-mono text-[#2563eb] dark:text-[#60A5FA] font-semibold">{actualCropWidth} × {actualCropHeight} px</span>
              </div>
              <div className="flex justify-between text-[#475569] dark:text-[#CBD5E1] pt-1 border-t border-[#DCE3ED]/60 dark:border-[#334155]/60">
                <span>Offset:</span>
                <span className="font-mono">X: {actualCropX} px, Y: {actualCropY} px</span>
              </div>
            </div>

            <div className="space-y-2.5 pt-1">
              <button 
                onClick={handleDownload}
                disabled={isProcessing}
                className="w-full py-3 px-5 bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-[0.98] text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-all duration-150 min-h-[44px] disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[20px]">{isProcessing ? 'autorenew' : 'download'}</span>
                <span>{isProcessing ? 'Cropping...' : `Crop & Download (${actualCropWidth} × ${actualCropHeight})`}</span>
              </button>
              
              <div className="flex items-center justify-center gap-1.5 text-[#64748B] text-[11px] pt-1">
                <span className="material-symbols-outlined text-[14px]">lock</span>
                <span>Your original file stays unchanged. Cropping performed directly in browser.</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
