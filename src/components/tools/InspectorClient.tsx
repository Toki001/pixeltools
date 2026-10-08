"use client";

import { useState, useRef, MouseEvent } from "react";
import Link from "next/link";
import exifr from 'exifr';
import { validateImageFile } from "@/lib/image-engine/validate";

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

interface ExifData {
  Make?: string;
  Model?: string;
  LensModel?: string;
  FocalLength?: number;
  FNumber?: number;
  ExposureTime?: number;
  ISO?: number;
  DateTimeOriginal?: Date | string;
  MeteringMode?: string;
  Flash?: string;
  ColorSpace?: number;
  [key: string]: unknown; // Allow other properties
}

export function InspectorClient() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [originalDimensions, setOriginalDimensions] = useState<{ width: number, height: number } | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [exif, setExif] = useState<ExifData | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [hoverPixel, setHoverPixel] = useState<{ x: number, y: number, hex: string, rgb: string } | null>(null);
  const [zoom, setZoom] = useState(1);

  const handleFileSelect = async (selectedFile: File) => {
    try {
      setError(null);
      await validateImageFile(selectedFile);
      setFile(selectedFile);
      
      const url = URL.createObjectURL(selectedFile);
      setOriginalUrl(url);
      setExif(null);
      
      // Parse EXIF
      try {
        const exifData = await exifr.parse(selectedFile);
        if (exifData) {
          setExif(exifData);
        }
      } catch (e) {
        console.log("No EXIF data found or error parsing EXIF", e);
      }
      
      const img = new Image();
      img.onload = () => {
        setOriginalDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        const cvs = canvasRef.current;
        if (cvs) {
          cvs.width = img.naturalWidth;
          cvs.height = img.naturalHeight;
          const ctx = cvs.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
          }
        }
      };
      img.src = url;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid file");
    }
  };

  const resetState = () => {
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    setFile(null);
    setOriginalUrl(null);
    setError(null);
    setOriginalDimensions(null);
    setExif(null);
  };

  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    const cvs = canvasRef.current;
    if (!cvs || !originalDimensions) return;
    
    const rect = cvs.getBoundingClientRect();
    const scaleX = cvs.width / rect.width;
    const scaleY = cvs.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    const ctx = cvs.getContext('2d');
    if (!ctx) return;
    
    try {
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const rgb = `RGB(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
      const hex = "#" + ((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1).toUpperCase();
      setHoverPixel({ x: Math.round(x), y: Math.round(y), hex, rgb });
    } catch {
      // Ignore cross-origin canvas errors if they occur
    }
  };

  const handleMouseLeave = () => {
    setHoverPixel(null);
  };

  const copyMetadata = () => {
    if (!exif && !originalDimensions) return;
    const data = JSON.stringify({
      dimensions: originalDimensions,
      size: file?.size,
      type: file?.type,
      exif
    }, null, 2);
    navigator.clipboard.writeText(data);
    alert("Metadata copied to clipboard!");
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
            <span aria-current="page" className="text-[#131b2e] dark:text-[#F8FAFC] font-semibold">Image Inspector</span>
          </nav>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
            <div>
              <h1 className="text-3xl font-bold text-[#131b2e] dark:text-[#F8FAFC] tracking-tight">Inspect image metadata</h1>
              <p className="text-base text-[#475569] dark:text-[#CBD5E1] mt-1 max-w-[720px]">
                Read-only inspection of EXIF data, color profiles, dimensions, and compression details locally.
              </p>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-[#121C2D] border border-[#DCE3ED] dark:border-[#334155] shadow-sm text-sm text-[#131b2e] dark:text-[#F8FAFC] shrink-0">
              <span className="material-symbols-outlined text-[#15803D] dark:text-[#4ADE80]">verified_user</span>
              <span className="font-semibold">100% Client-Side</span>
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
              <span className="material-symbols-outlined text-[32px]">data_object</span>
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-semibold text-[#131b2e] dark:text-[#F8FAFC]">Upload an image to inspect</h3>
              <p className="text-sm text-[#475569] dark:text-[#CBD5E1]">JPEG, PNG, WebP up to 50MB</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const megapixels = originalDimensions ? (originalDimensions.width * originalDimensions.height / 1000000).toFixed(1) : "0";
  const aspectRatio = originalDimensions ? (originalDimensions.width / originalDimensions.height).toFixed(2) : "0";

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#DCE3ED] dark:border-[#334155] pb-5">
        <div>
          <nav className="flex items-center gap-2 text-xs text-[#64748B] mb-2">
            <Link className="hover:text-[#131b2e] dark:hover:text-[#F8FAFC] transition-colors" href="/">Home</Link>
            <span className="text-[#DCE3ED] dark:text-[#334155]">/</span>
            <Link className="hover:text-[#131b2e] dark:hover:text-[#F8FAFC] transition-colors" href="/tools">Tools</Link>
            <span className="text-[#DCE3ED] dark:text-[#334155]">/</span>
            <span className="text-[#131b2e] dark:text-[#F8FAFC] font-semibold">Image Inspector</span>
          </nav>
          <h1 className="text-3xl font-bold text-[#131b2e] dark:text-[#F8FAFC] tracking-tight">Inspect image metadata</h1>
          <p className="text-base text-[#475569] dark:text-[#CBD5E1] mt-1 max-w-[720px]">
            Read-only inspection of EXIF data, color profiles, dimensions, and compression details locally.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-white dark:bg-[#121C2D] rounded-2xl border border-[#DCE3ED] dark:border-[#334155] shadow-sm flex flex-col overflow-hidden">
            <div className="px-4 py-2.5 border-b border-[#DCE3ED] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0B1220] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[#475569] dark:text-[#CBD5E1]">
                <button onClick={() => setZoom(z => Math.max(0.25, z - 0.25))} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#F1F5F9] dark:hover:bg-[#1B2A40] border border-[#DCE3ED] dark:border-[#334155] text-[#131b2e] dark:text-[#F8FAFC] transition-colors">
                  <span className="material-symbols-outlined text-[18px]">remove</span>
                </button>
                <span className="text-sm font-semibold tabular-nums px-1 text-[#131b2e] dark:text-[#F8FAFC]">{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom(z => Math.min(3, z + 0.25))} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#F1F5F9] dark:hover:bg-[#1B2A40] border border-[#DCE3ED] dark:border-[#334155] text-[#131b2e] dark:text-[#F8FAFC] transition-colors">
                  <span className="material-symbols-outlined text-[18px]">add</span>
                </button>
              </div>
            </div>

            <div className="relative w-full h-[480px] bg-[#F8FAFC] dark:bg-[#0B1220] flex items-center justify-center p-6 overflow-hidden select-none bg-checkerboard-inspector">
              <style dangerouslySetInnerHTML={{ __html: `
                .bg-checkerboard-inspector {
                  background-image: 
                    linear-gradient(45deg, #F1F5F9 25%, transparent 25%), 
                    linear-gradient(-45deg, #F1F5F9 25%, transparent 25%), 
                    linear-gradient(45deg, transparent 75%, #F1F5F9 75%), 
                    linear-gradient(-45deg, transparent 75%, #F1F5F9 75%);
                  background-size: 16px 16px;
                  background-position: 0 0, 0 8px, 8px -8px, -8px 0px;
                  background-color: #FFFFFF;
                }
                .dark .bg-checkerboard-inspector {
                  background-color: #0B1220;
                  background-image: 
                    linear-gradient(45deg, #1B2A40 25%, transparent 25%), 
                    linear-gradient(-45deg, #1B2A40 25%, transparent 25%), 
                    linear-gradient(45deg, transparent 75%, #1B2A40 75%), 
                    linear-gradient(-45deg, transparent 75%, #1B2A40 75%);
                }
              `}} />

              <div className="relative max-h-full max-w-full rounded border border-[#DCE3ED] dark:border-[#334155] shadow-md overflow-hidden bg-white dark:bg-[#121C2D] cursor-crosshair">
                <canvas
                  ref={canvasRef}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                  className="max-h-[432px] w-auto block object-contain"
                  style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
                />
              </div>

              {hoverPixel && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none flex flex-col items-center z-10">
                  <div className="px-3 py-1.5 rounded-lg bg-[#131b2e] dark:bg-[#F8FAFC] text-white dark:text-[#131b2e] text-xs font-semibold shadow-lg border border-[#131b2e]/20 flex items-center gap-2.5">
                    <span className="w-3.5 h-3.5 rounded-sm border border-white/40" style={{ backgroundColor: hoverPixel.hex }}></span>
                    <div className="flex items-center gap-2 font-mono">
                      <span>{hoverPixel.hex}</span>
                      <span className="text-[#64748B]">|</span>
                      <span className="text-white/70 dark:text-[#131b2e]/70">{hoverPixel.rgb}</span>
                    </div>
                  </div>
                </div>
              )}

              {hoverPixel && (
                <div className="absolute bottom-2 left-2 bg-white/90 dark:bg-[#121C2D]/90 backdrop-blur-sm px-2 py-0.5 rounded border border-[#DCE3ED] dark:border-[#334155] text-[11px] font-mono text-[#475569] dark:text-[#CBD5E1]">
                  X: {hoverPixel.x} px &nbsp; Y: {hoverPixel.y} px
                </div>
              )}
            </div>

            <div className="px-5 py-3.5 border-t border-[#DCE3ED] dark:border-[#334155] bg-white dark:bg-[#121C2D] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#F1F5F9] dark:bg-[#1B2A40] border border-[#DCE3ED] dark:border-[#334155] flex items-center justify-center text-[#2563eb] dark:text-[#60A5FA]">
                  <span className="material-symbols-outlined text-[22px]">image</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#131b2e] dark:text-[#F8FAFC]">{file.name}</span>
                    {exif && <span className="px-2 py-0.5 rounded-full bg-[#ECFDF5] dark:bg-[#064E3B] text-[#15803D] dark:text-[#34D399] text-[11px] font-semibold border border-[#15803D]/20">Verified EXIF</span>}
                  </div>
                  <span className="text-[#475569] dark:text-[#CBD5E1] text-xs tabular-nums">{megapixels} MP • {formatBytes(file.size)} • {file.type.split('/')[1]?.toUpperCase()}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => fileInputRef.current?.click()} className="px-3.5 py-2 rounded-xl border border-[#DCE3ED] dark:border-[#334155] bg-white dark:bg-[#121C2D] hover:bg-[#F1F5F9] dark:hover:bg-[#1B2A40] text-[#131b2e] dark:text-[#F8FAFC] text-sm font-semibold transition-colors duration-150 flex items-center gap-1.5 shadow-sm">
                  <span className="material-symbols-outlined text-[#475569] dark:text-[#CBD5E1] text-[18px]">cached</span>
                  Replace image
                </button>
                <button onClick={resetState} className="p-2 rounded-xl border border-[#DCE3ED] dark:border-[#334155] bg-white dark:bg-[#121C2D] hover:bg-red-50 dark:hover:bg-red-950/30 text-[#475569] dark:text-[#CBD5E1] hover:text-red-600 dark:hover:text-red-400 font-semibold transition-colors flex items-center shadow-sm">
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          <div className="bg-white dark:bg-[#121C2D] rounded-xl border border-[#DCE3ED] dark:border-[#334155] p-5 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE3ED] dark:border-[#334155]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#2563eb] dark:text-[#60A5FA] text-[22px]">data_object</span>
                <h2 className="text-lg font-semibold text-[#131b2e] dark:text-[#F8FAFC]">Metadata Inspector</h2>
              </div>
              <button onClick={copyMetadata} className="px-3 py-1.5 rounded-lg border border-[#DCE3ED] dark:border-[#334155] bg-[#F1F5F9] dark:bg-[#1B2A40] hover:bg-white dark:hover:bg-[#121C2D] text-[#131b2e] dark:text-[#F8FAFC] text-xs font-semibold transition-colors flex items-center gap-1">
                <span className="material-symbols-outlined text-[#64748B] text-[16px]">content_copy</span>
                Copy Details
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">File & Image Essentials</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-[#0B1220] border border-[#DCE3ED] dark:border-[#334155] flex flex-col gap-1">
                  <span className="text-[11px] font-medium text-[#475569] dark:text-[#CBD5E1]">Format</span>
                  <span className="text-sm text-[#131b2e] dark:text-[#F8FAFC] font-semibold">{file.type.split('/')[1]?.toUpperCase()}</span>
                  <span className="text-[11px] text-[#64748B] font-mono">{file.type}</span>
                </div>
                <div className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-[#0B1220] border border-[#DCE3ED] dark:border-[#334155] flex flex-col gap-1">
                  <span className="text-[11px] font-medium text-[#475569] dark:text-[#CBD5E1]">File Size</span>
                  <span className="text-sm text-[#131b2e] dark:text-[#F8FAFC] font-semibold tabular-nums">{formatBytes(file.size)}</span>
                  <span className="text-[11px] text-[#64748B] font-mono">{file.size.toLocaleString()} bytes</span>
                </div>
                <div className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-[#0B1220] border border-[#DCE3ED] dark:border-[#334155] flex flex-col gap-1">
                  <span className="text-[11px] font-medium text-[#475569] dark:text-[#CBD5E1]">Dimensions</span>
                  <span className="text-sm text-[#131b2e] dark:text-[#F8FAFC] font-semibold tabular-nums">{originalDimensions?.width} × {originalDimensions?.height} px</span>
                  <span className="text-[11px] text-[#64748B]">Native Canvas</span>
                </div>
                <div className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-[#0B1220] border border-[#DCE3ED] dark:border-[#334155] flex flex-col gap-1">
                  <span className="text-[11px] font-medium text-[#475569] dark:text-[#CBD5E1]">Megapixels</span>
                  <span className="text-sm text-[#131b2e] dark:text-[#F8FAFC] font-semibold tabular-nums">{megapixels} MP</span>
                  <span className="text-[11px] text-[#64748B]">Effective sensor res</span>
                </div>
                <div className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-[#0B1220] border border-[#DCE3ED] dark:border-[#334155] flex flex-col gap-1">
                  <span className="text-[11px] font-medium text-[#475569] dark:text-[#CBD5E1]">Aspect Ratio</span>
                  <span className="text-sm text-[#131b2e] dark:text-[#F8FAFC] font-semibold tabular-nums">{aspectRatio}:1</span>
                  <span className="text-[11px] text-[#64748B] font-mono">Ratio</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-[#DCE3ED] dark:border-[#334155]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">EXIF Camera & Shooting Data</span>
                <span className="material-symbols-outlined text-[#64748B] text-[18px]">photo_camera</span>
              </div>
              <div className="rounded-lg border border-[#DCE3ED] dark:border-[#334155] overflow-hidden divide-y divide-[#DCE3ED] dark:divide-[#334155] bg-[#F8FAFC] dark:bg-[#0B1220]">
                {exif ? (
                  <>
                    <div className="flex items-center justify-between px-3.5 py-2.5 text-sm">
                      <span className="text-[#475569] dark:text-[#CBD5E1]">Camera Make & Model</span>
                      <span className="font-semibold text-[#131b2e] dark:text-[#F8FAFC]">{exif.Make} {exif.Model}</span>
                    </div>
                    <div className="flex items-center justify-between px-3.5 py-2.5 text-sm">
                      <span className="text-[#475569] dark:text-[#CBD5E1]">Lens</span>
                      <span className="font-medium text-[#131b2e] dark:text-[#F8FAFC]">{exif.LensModel || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center justify-between px-3.5 py-2.5 text-sm">
                      <span className="text-[#475569] dark:text-[#CBD5E1]">Focal Length</span>
                      <span className="font-mono text-[#131b2e] dark:text-[#F8FAFC] font-medium">{exif.FocalLength ? `${exif.FocalLength} mm` : 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between px-3.5 py-2.5 text-sm">
                      <span className="text-[#475569] dark:text-[#CBD5E1]">Aperture</span>
                      <span className="font-mono text-[#131b2e] dark:text-[#F8FAFC] font-medium">{exif.FNumber ? `f/${exif.FNumber}` : 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between px-3.5 py-2.5 text-sm">
                      <span className="text-[#475569] dark:text-[#CBD5E1]">Shutter Speed</span>
                      <span className="font-mono text-[#131b2e] dark:text-[#F8FAFC] font-medium">{exif.ExposureTime ? `1/${Math.round(1/exif.ExposureTime)}s` : 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between px-3.5 py-2.5 text-sm">
                      <span className="text-[#475569] dark:text-[#CBD5E1]">ISO</span>
                      <span className="font-mono text-[#131b2e] dark:text-[#F8FAFC] font-medium">{exif.ISO || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between px-3.5 py-2.5 text-sm">
                      <span className="text-[#475569] dark:text-[#CBD5E1]">Date Taken</span>
                      <span className="text-[#131b2e] dark:text-[#F8FAFC] font-medium">{exif.DateTimeOriginal ? new Date(exif.DateTimeOriginal).toLocaleString() : 'N/A'}</span>
                    </div>
                  </>
                ) : (
                  <div className="px-3.5 py-4 text-center text-sm text-[#64748B]">
                    No EXIF data found in this image.
                  </div>
                )}
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-[#F1F5F9] dark:bg-[#1B2A40] border border-[#DCE3ED] dark:border-[#334155] flex items-start gap-3 text-[#475569] dark:text-[#CBD5E1]">
              <span className="material-symbols-outlined text-[#2563eb] dark:text-[#60A5FA] mt-0.5 shrink-0 text-[18px]">memory</span>
              <p className="text-[12px] leading-relaxed">
                Metadata is parsed in-memory using WebAssembly. No data is logged, transmitted, or stored.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
