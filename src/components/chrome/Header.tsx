"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { siteConfig } from "@/config/site";

export function Header() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <header className="bg-white dark:bg-[#121C2D] border-b border-[#DCE3ED] dark:border-[#334155] shadow-sm sticky top-0 z-50">
      <div className="flex justify-between items-center w-full px-6 py-3 max-w-[1280px] mx-auto">
        {/* Logo & Primary Nav */}
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold text-[#131b2e] dark:text-[#F8FAFC] flex items-center gap-2">
            <div className="w-7 h-7 bg-[#2563eb] rounded-lg flex items-center justify-center shadow-sm">
              <span className="w-3 h-3 bg-white rounded-sm"></span>
            </div>
            <span>{siteConfig.name}</span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/tools" className="text-[#2563eb] dark:text-[#60A5FA] font-bold border-b-2 border-[#2563eb] dark:border-[#60A5FA] pb-1 text-sm transition-colors duration-150">
              Tools
            </Link>
            <Link href="/tools/image-compressor" className="text-[#475569] dark:text-[#CBD5E1] hover:text-[#2563eb] dark:hover:text-[#60A5FA] pb-1 text-sm font-semibold transition-colors duration-150">
              Compress
            </Link>
            <Link href="/tools/image-converter" className="text-[#475569] dark:text-[#CBD5E1] hover:text-[#2563eb] dark:hover:text-[#60A5FA] pb-1 text-sm font-semibold transition-colors duration-150">
              Convert
            </Link>
            <Link href="/tools/image-resizer" className="text-[#475569] dark:text-[#CBD5E1] hover:text-[#2563eb] dark:hover:text-[#60A5FA] pb-1 text-sm font-semibold transition-colors duration-150">
              Resize
            </Link>
            <Link href="/tools/image-cropper" className="text-[#475569] dark:text-[#CBD5E1] hover:text-[#2563eb] dark:hover:text-[#60A5FA] pb-1 text-sm font-semibold transition-colors duration-150">
              Crop
            </Link>
            <Link href="/tools/image-rotator" className="text-[#475569] dark:text-[#CBD5E1] hover:text-[#2563eb] dark:hover:text-[#60A5FA] pb-1 text-sm font-semibold transition-colors duration-150">
              Rotate
            </Link>
            <Link href="/tools/image-inspector" className="text-[#475569] dark:text-[#CBD5E1] hover:text-[#2563eb] dark:hover:text-[#60A5FA] pb-1 text-sm font-semibold transition-colors duration-150">
              Inspect
            </Link>
          </nav>
        </div>

        {/* Search, Pill Badge & Trailing Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          <button className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-[#DCE3ED] dark:border-[#334155] bg-[#F1F5F9] dark:bg-[#1B2A40] text-[#475569] dark:text-[#CBD5E1] hover:text-[#2563eb] dark:hover:text-[#60A5FA] text-sm transition-all duration-150" type="button">
            <span className="material-symbols-outlined text-[18px]">search</span>
            <span>Search tools...</span>
            <kbd className="px-1.5 py-0.5 rounded border border-[#DCE3ED] dark:border-[#334155] bg-white dark:bg-[#121C2D] text-[#64748B] dark:text-[#CBD5E1] text-[11px] font-mono leading-none">⌘K</kbd>
          </button>
          
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFF6FF] dark:bg-opacity-10 border border-[#DCE3ED] dark:border-[#334155] text-sm text-[#2563eb] dark:text-[#60A5FA]">
            <span className="w-2 h-2 rounded-full bg-[#15803D] animate-pulse"></span>
            <span>On-device processing</span>
          </div>

          <button onClick={toggleTheme} aria-label="Toggle theme" className="p-2 rounded-lg border border-[#DCE3ED] dark:border-[#334155] text-[#475569] dark:text-[#CBD5E1] hover:text-[#2563eb] dark:hover:text-[#60A5FA] hover:bg-[#F1F5F9] dark:hover:bg-[#1B2A40] transition-colors duration-150" type="button">
            {mounted ? (
              <span className="material-symbols-outlined text-[20px]">{resolvedTheme === "dark" ? "light_mode" : "dark_mode"}</span>
            ) : (
              <span className="material-symbols-outlined text-[20px]">dark_mode</span>
            )}
          </button>
          
          <button onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle mobile menu" className="md:hidden p-2 rounded-lg border border-[#DCE3ED] dark:border-[#334155] text-[#475569] dark:text-[#CBD5E1] hover:text-[#2563eb] dark:hover:text-[#60A5FA] hover:bg-[#F1F5F9] dark:hover:bg-[#1B2A40] transition-colors duration-150" type="button">
            <span className="material-symbols-outlined text-[20px]">{menuOpen ? "close" : "menu"}</span>
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-[#DCE3ED] dark:border-[#334155] bg-white dark:bg-[#121C2D] px-6 py-4 space-y-4">
          <nav className="flex flex-col gap-4">
            <Link href="/tools" onClick={() => setMenuOpen(false)} className="text-[#131b2e] dark:text-[#F8FAFC] font-bold text-base">
              All Tools
            </Link>
            <Link href="/tools/image-compressor" onClick={() => setMenuOpen(false)} className="text-[#475569] dark:text-[#CBD5E1] font-semibold text-base">
              Image Compressor
            </Link>
            <Link href="/tools/image-converter" onClick={() => setMenuOpen(false)} className="text-[#475569] dark:text-[#CBD5E1] font-semibold text-base">
              Image Converter
            </Link>
            <Link href="/tools/image-resizer" onClick={() => setMenuOpen(false)} className="text-[#475569] dark:text-[#CBD5E1] font-semibold text-base">
              Image Resizer
            </Link>
            <Link href="/tools/image-cropper" onClick={() => setMenuOpen(false)} className="text-[#475569] dark:text-[#CBD5E1] font-semibold text-base">
              Image Cropper
            </Link>
            <Link href="/tools/image-rotator" onClick={() => setMenuOpen(false)} className="text-[#475569] dark:text-[#CBD5E1] font-semibold text-base">
              Image Rotator
            </Link>
            <Link href="/tools/image-inspector" onClick={() => setMenuOpen(false)} className="text-[#475569] dark:text-[#CBD5E1] font-semibold text-base">
              Image Inspector
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
