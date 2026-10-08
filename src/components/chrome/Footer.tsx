import Link from "next/link";
import { siteConfig } from "@/config/site";

export function Footer() {
  return (
    <footer className="bg-white dark:bg-[#121C2D] border-t border-[#DCE3ED] dark:border-[#334155] mt-auto">
      <div className="flex flex-col md:flex-row justify-between items-center w-full px-6 py-8 max-w-[1280px] mx-auto gap-4">
        {/* Brand & Copyright */}
        <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
          <div className="text-xl font-bold text-[#131b2e] dark:text-[#F8FAFC] flex items-center gap-2">
            <div className="w-5 h-5 bg-[#2563eb] rounded flex items-center justify-center">
              <span className="w-2 h-2 bg-white rounded-sm"></span>
            </div>
            <span>{siteConfig.name}</span>
          </div>
          <span className="hidden sm:inline text-[#DCE3ED] dark:text-[#334155]">•</span>
          <p className="text-sm text-[#475569] dark:text-[#CBD5E1]">
            © 2026 {siteConfig.name}. Client-side, privacy-first local image transformations.
          </p>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-wrap justify-center items-center gap-6">
          <Link href="/privacy" className="text-sm text-[#475569] dark:text-[#CBD5E1] hover:text-[#2563eb] dark:hover:text-[#60A5FA] transition-colors duration-150">
            Privacy Manifesto
          </Link>
          <Link href="/tools" className="text-sm text-[#475569] dark:text-[#CBD5E1] hover:text-[#2563eb] dark:hover:text-[#60A5FA] transition-colors duration-150">
            Tools
          </Link>
          <Link href="/tools/image-compressor" className="text-sm text-[#475569] dark:text-[#CBD5E1] hover:text-[#2563eb] dark:hover:text-[#60A5FA] transition-colors duration-150">
            Compress
          </Link>
          <Link href="/tools/image-converter" className="text-sm text-[#475569] dark:text-[#CBD5E1] hover:text-[#2563eb] dark:hover:text-[#60A5FA] transition-colors duration-150">
            Convert
          </Link>
          <Link href="/tools/image-resizer" className="text-sm text-[#475569] dark:text-[#CBD5E1] hover:text-[#2563eb] dark:hover:text-[#60A5FA] transition-colors duration-150">
            Resize
          </Link>
          <Link href="/terms" className="text-sm text-[#475569] dark:text-[#CBD5E1] hover:text-[#2563eb] dark:hover:text-[#60A5FA] transition-colors duration-150">
            Terms of Service
          </Link>
        </nav>
      </div>
    </footer>
  );
}
