"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface ComparatorProps {
  originalUrl: string;
  originalSizeStr: string;
  processedUrl: string;
  processedSizeStr: string;
  format: string;
}

export function Comparator({ originalUrl, originalSizeStr, processedUrl, processedSizeStr, format }: ComparatorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const originalImgRef = useRef<HTMLImageElement>(null);
  const [splitPosition, setSplitPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [zoom, setZoom] = useState(1);

  const updateSplitter = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    let offsetX = clientX - rect.left;
    if (offsetX < 0) offsetX = 0;
    if (offsetX > rect.width) offsetX = rect.width;
    const percentage = (offsetX / rect.width) * 100;
    setSplitPosition(percentage);
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) updateSplitter(e.clientX);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches[0]) updateSplitter(e.touches[0].clientX);
    };
    const stopDrag = () => setIsDragging(false);

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", stopDrag);
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("touchend", stopDrag);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", stopDrag);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", stopDrag);
    };
  }, [isDragging, updateSplitter]);

  // Sync width of original image to the container width so it doesn't shrink when clipped
  useEffect(() => {
    const syncWidth = () => {
      if (containerRef.current && originalImgRef.current) {
        originalImgRef.current.style.width = `${containerRef.current.getBoundingClientRect().width}px`;
      }
    };
    syncWidth();
    window.addEventListener("resize", syncWidth);
    return () => window.removeEventListener("resize", syncWidth);
  }, []);

  return (
    <div className="bg-white dark:bg-[#121C2D] border border-[#DCE3ED] dark:border-[#334155] rounded-2xl p-4 shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between pb-2 border-b border-[#DCE3ED] dark:border-[#334155]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#475569] dark:text-[#CBD5E1] uppercase tracking-wider">Preview Comparator</span>
          <span className="px-2 py-0.5 rounded text-xs bg-[#F1F5F9] dark:bg-[#1B2A40] border border-[#DCE3ED] dark:border-[#334155] text-[#475569] dark:text-[#CBD5E1] font-mono">1:1 Zoom</span>
        </div>
        <div className="flex items-center gap-1 bg-[#F1F5F9] dark:bg-[#1B2A40] p-1 rounded-lg border border-[#DCE3ED] dark:border-[#334155]">
          <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} className="w-7 h-7 flex items-center justify-center rounded hover:bg-white dark:hover:bg-[#121C2D] text-[#475569] dark:text-[#CBD5E1] hover:text-[#131b2e] dark:hover:text-[#F8FAFC] transition-colors" title="Zoom out">
            <span className="material-symbols-outlined text-[18px]">remove</span>
          </button>
          <button onClick={() => setZoom(1)} className="px-2 h-7 flex items-center justify-center rounded text-xs hover:bg-white dark:hover:bg-[#121C2D] text-[#475569] dark:text-[#CBD5E1] hover:text-[#131b2e] dark:hover:text-[#F8FAFC] transition-colors font-mono">
            {Math.round(zoom * 100)}%
          </button>
          <button onClick={() => setZoom(z => Math.min(3, z + 0.25))} className="w-7 h-7 flex items-center justify-center rounded hover:bg-white dark:hover:bg-[#121C2D] text-[#475569] dark:text-[#CBD5E1] hover:text-[#131b2e] dark:hover:text-[#F8FAFC] transition-colors" title="Zoom in">
            <span className="material-symbols-outlined text-[18px]">add</span>
          </button>
        </div>
      </div>

      {/* COMPARATOR CANVAS VIEWPORT */}
      <div 
        ref={containerRef}
        onMouseDown={(e) => { setIsDragging(true); updateSplitter(e.clientX); }}
        onTouchStart={(e) => { setIsDragging(true); if(e.touches[0]) updateSplitter(e.touches[0].clientX); }}
        className="relative w-full h-[460px] sm:h-[520px] rounded-xl overflow-hidden select-none border border-[#DCE3ED] dark:border-[#334155] alpha-grid flex items-center justify-center group cursor-ew-resize"
      >
        <style dangerouslySetInnerHTML={{ __html: `
          .alpha-grid {
            background-color: #FFFFFF;
            background-image: 
              linear-gradient(45deg, #F1F5F9 25%, transparent 25%),
              linear-gradient(-45deg, #F1F5F9 25%, transparent 25%),
              linear-gradient(45deg, transparent 75%, #F1F5F9 75%),
              linear-gradient(-45deg, transparent 75%, #F1F5F9 75%);
            background-size: 16px 16px;
            background-position: 0 0, 0 8px, 8px -8px, -8px 0px;
          }
          .dark .alpha-grid {
            background-color: #0B1220;
            background-image: 
              linear-gradient(45deg, #1B2A40 25%, transparent 25%),
              linear-gradient(-45deg, #1B2A40 25%, transparent 25%),
              linear-gradient(45deg, transparent 75%, #1B2A40 75%),
              linear-gradient(-45deg, transparent 75%, #1B2A40 75%);
          }
        `}} />
        
        {/* Background: Compressed Image (Right side) */}
        <div className="absolute inset-0 w-full h-full flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={processedUrl} 
            alt="Compressed" 
            className="w-full h-full object-contain pointer-events-none select-none transition-transform duration-150"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
          />
          <div className="absolute bottom-4 right-4 z-10 bg-[#131b2e]/80 text-white text-xs px-3 py-1.5 rounded-lg border border-white/20 flex items-center gap-1.5 shadow-sm font-mono">
            <span className="w-2 h-2 rounded-full bg-[#2563eb]"></span>
            <span>Compressed ({processedSizeStr}, {format.split('/')[1]?.toUpperCase()})</span>
          </div>
        </div>

        {/* Foreground: Original Image (Clipped Left side) */}
        <div 
          className="absolute inset-0 h-full overflow-hidden border-r-2 border-white shadow-2xl z-10 flex items-center justify-center" 
          style={{ width: `${splitPosition}%` }}
        >
          <div className="absolute inset-0 h-full flex items-center justify-center" style={{ width: '100%', minWidth: '100%' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              ref={originalImgRef}
              src={originalUrl} 
              alt="Original" 
              className="absolute h-full object-contain pointer-events-none select-none max-w-none transition-transform duration-150"
              style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
            />
          </div>
          <div className="absolute bottom-4 left-4 z-10 bg-[#131b2e]/80 text-white text-xs px-3 py-1.5 rounded-lg border border-white/20 flex items-center gap-1.5 shadow-sm font-mono">
            <span className="w-2 h-2 rounded-full bg-[#64748B]"></span>
            <span>Original ({originalSizeStr})</span>
          </div>
        </div>

        {/* Draggable Handle */}
        <div 
          className="absolute top-0 bottom-0 -ml-4 w-8 flex items-center justify-center z-20 pointer-events-auto cursor-ew-resize"
          style={{ left: `${splitPosition}%` }}
        >
          <div className="w-8 h-8 rounded-full bg-white border-2 border-[#2563eb] shadow-md flex items-center justify-center text-[#2563eb] transition-transform duration-100 group-hover:scale-110">
            <span className="material-symbols-outlined text-[16px]">compare_arrows</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-[#64748B] px-1">
        <span className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px]">swipe</span>
          Drag handle left/right to compare details
        </span>
        <span className="font-mono text-[11px]">Color space: sRGB • Alpha channel preserved</span>
      </div>
    </div>
  );
}
