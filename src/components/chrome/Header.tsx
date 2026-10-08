"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/config/site";

const SEARCH_TOOLS = [
  { name: 'Image Compressor', desc: 'Reduce file size', path: '/tools/image-compressor', icon: 'compress' },
  { name: 'Image Converter', desc: 'Change image format', path: '/tools/image-converter', icon: 'transform' },
  { name: 'Image Resizer', desc: 'Change dimensions', path: '/tools/image-resizer', icon: 'aspect_ratio' },
  { name: 'Image Cropper', desc: 'Crop image areas', path: '/tools/image-cropper', icon: 'crop' },
  { name: 'Image Rotator', desc: 'Rotate & flip images', path: '/tools/image-rotator', icon: 'rotate_right' },
  { name: 'Image Inspector', desc: 'View EXIF metadata', path: '/tools/image-inspector', icon: 'info' },
];

export function Header() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const pathname = usePathname() || "";

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const getLinkClasses = (path: string) => {
    const isActive = pathname === path || (path === "/tools" && pathname === "/tools");
    if (isActive) {
      return "text-[#2563eb] dark:text-[#60A5FA] font-bold border-b-2 border-[#2563eb] dark:border-[#60A5FA] pb-1 text-sm transition-colors duration-150";
    }
    return "text-[#475569] dark:text-[#CBD5E1] hover:text-[#2563eb] dark:hover:text-[#60A5FA] pb-1 text-sm font-semibold transition-colors duration-150 border-b-2 border-transparent";
  };

  const filteredTools = SEARCH_TOOLS.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
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
            <Link href="/tools" className={getLinkClasses("/tools")}>
              Tools
            </Link>
            <Link href="/tools/image-compressor" className={getLinkClasses("/tools/image-compressor")}>
              Compress
            </Link>
            <Link href="/tools/image-converter" className={getLinkClasses("/tools/image-converter")}>
              Convert
            </Link>
            <Link href="/tools/image-resizer" className={getLinkClasses("/tools/image-resizer")}>
              Resize
            </Link>
            <Link href="/tools/image-cropper" className={getLinkClasses("/tools/image-cropper")}>
              Crop
            </Link>
            <Link href="/tools/image-rotator" className={getLinkClasses("/tools/image-rotator")}>
              Rotate
            </Link>
            <Link href="/tools/image-inspector" className={getLinkClasses("/tools/image-inspector")}>
              Inspect
            </Link>
          </nav>
        </div>

        {/* Search, Pill Badge & Trailing Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          <button onClick={() => setSearchOpen(true)} className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-[#DCE3ED] dark:border-[#334155] bg-[#F1F5F9] dark:bg-[#1B2A40] text-[#475569] dark:text-[#CBD5E1] hover:text-[#2563eb] dark:hover:text-[#60A5FA] text-sm transition-all duration-150" type="button">
            <span className="material-symbols-outlined text-[18px]">search</span>
            <span>Search tools...</span>
            <kbd className="px-1.5 py-0.5 rounded border border-[#DCE3ED] dark:border-[#334155] bg-white dark:bg-[#121C2D] text-[#64748B] dark:text-[#CBD5E1] text-[11px] font-mono leading-none">⌘K</kbd>
          </button>

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

    {/* Search Modal */}
    {searchOpen && (
      <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
        <div className="absolute inset-0 bg-[#0B1220]/50 backdrop-blur-sm transition-opacity" onClick={() => setSearchOpen(false)}></div>
        <div className="relative w-full max-w-lg bg-white dark:bg-[#121C2D] rounded-2xl shadow-2xl border border-[#DCE3ED] dark:border-[#334155] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center px-4 py-3 border-b border-[#DCE3ED] dark:border-[#334155]">
            <span className="material-symbols-outlined text-[#64748B] dark:text-[#94A3B8] mr-3">search</span>
            <input 
              autoFocus 
              type="text" 
              placeholder="Search tools..." 
              className="flex-1 bg-transparent border-none outline-none text-[#131b2e] dark:text-[#F8FAFC] placeholder-[#94A3B8] dark:placeholder-[#475569]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 mr-2 rounded border border-[#DCE3ED] dark:border-[#334155] bg-[#F1F5F9] dark:bg-[#1B2A40] text-[#64748B] dark:text-[#CBD5E1] text-[10px] font-mono">ESC</kbd>
            <button onClick={() => setSearchOpen(false)} className="text-[#64748B] dark:text-[#94A3B8] hover:text-[#131b2e] dark:hover:text-[#F8FAFC] p-1 rounded-lg transition-colors">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {filteredTools.length > 0 ? (
              filteredTools.map(tool => (
                <Link key={tool.path} href={tool.path} onClick={() => setSearchOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F1F5F9] dark:hover:bg-[#1B2A40] transition-colors group">
                  <div className="w-10 h-10 rounded-lg bg-[#F1F5F9] dark:bg-[#1B2A40] border border-[#DCE3ED] dark:border-[#334155] text-[#475569] dark:text-[#CBD5E1] group-hover:bg-[#EFF6FF] dark:group-hover:bg-[#1B2A40]/80 group-hover:text-[#2563eb] dark:group-hover:text-[#60A5FA] group-hover:border-[#2563eb]/20 flex items-center justify-center transition-all duration-150">
                    <span className="material-symbols-outlined text-[20px]">{tool.icon}</span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#131b2e] dark:text-[#F8FAFC] group-hover:text-[#2563eb] dark:group-hover:text-[#60A5FA] transition-colors">{tool.name}</div>
                    <div className="text-xs text-[#64748B] dark:text-[#94A3B8]">{tool.desc}</div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-8 text-center text-[#64748B] dark:text-[#94A3B8] text-sm">
                No tools found for &quot;{searchQuery}&quot;
              </div>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
}
