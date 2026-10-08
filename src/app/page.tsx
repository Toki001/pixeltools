import Link from "next/link";
import { tools } from "@/config/tools";

export default function Home() {
  return (
    <main className="w-full max-w-[1280px] mx-auto px-6 py-12 md:py-16 space-y-20">
      {/* HERO SECTION & CENTRAL UTILITY UPLOADER */}
      <section className="text-center space-y-8 max-w-[960px] mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#F1F5F9] dark:bg-[#1B2A40] border border-[#DCE3ED] dark:border-[#334155] text-sm text-[#475569] dark:text-[#CBD5E1]">
          <span className="material-symbols-outlined text-[16px] text-[#2563eb] dark:text-[#60A5FA]">lock</span>
          <span>Free, private, browser-based tools</span>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold text-[#131b2e] dark:text-[#F8FAFC] tracking-tight">
          Every image tool you need, in one place.
        </h1>
        
        <p className="text-base md:text-lg text-[#475569] dark:text-[#CBD5E1] max-w-[680px] mx-auto">
          Compress, convert, resize, crop, and optimize images right in your browser. No account. No uploads to a server.
        </p>

        {/* Central Hero Interactive Uploader */}
        <div className="mt-8">
          <div className="relative bg-white dark:bg-[#121C2D] rounded-[20px] border-2 border-dashed border-[#DCE3ED] dark:border-[#334155] hover:border-[#2563eb] dark:hover:border-[#60A5FA] p-8 md:p-12 text-center transition-all duration-200 cursor-pointer shadow-sm group hover:bg-[#EFF6FF] dark:hover:bg-[#1B2A40]" id="dropzone">
            <input accept="image/png, image/jpeg, image/webp" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" id="fileInput" multiple type="file" />
            <div className="flex flex-col items-center justify-center space-y-4 pointer-events-none">
              <div className="w-16 h-16 rounded-2xl bg-[#F1F5F9] dark:bg-[#1B2A40] border border-[#DCE3ED] dark:border-[#334155] flex items-center justify-center text-[#2563eb] dark:text-[#60A5FA] group-hover:scale-105 transition-transform duration-150">
                <span className="material-symbols-outlined text-[32px]">cloud_upload</span>
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-semibold text-[#131b2e] dark:text-[#F8FAFC]">
                  Drop an image here, or browse files
                </h3>
                <p className="text-sm text-[#475569] dark:text-[#CBD5E1]">
                  Drag and drop your high-resolution photos or screenshots directly
                </p>
              </div>
              <div className="pt-2">
                <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2563eb] dark:bg-[#60A5FA] text-white dark:text-[#07111F] font-semibold text-sm shadow-sm group-hover:bg-[#1D4ED8] transition-colors duration-150">
                  <span className="material-symbols-outlined text-[18px]">folder_open</span>
                  Browse files
                </span>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <span className="px-2.5 py-1 rounded-lg bg-[#F1F5F9] dark:bg-[#1B2A40] border border-[#DCE3ED] dark:border-[#334155] text-xs font-mono text-[#475569] dark:text-[#CBD5E1]">JPG</span>
                <span className="px-2.5 py-1 rounded-lg bg-[#F1F5F9] dark:bg-[#1B2A40] border border-[#DCE3ED] dark:border-[#334155] text-xs font-mono text-[#475569] dark:text-[#CBD5E1]">PNG</span>
                <span className="px-2.5 py-1 rounded-lg bg-[#F1F5F9] dark:bg-[#1B2A40] border border-[#DCE3ED] dark:border-[#334155] text-xs font-mono text-[#475569] dark:text-[#CBD5E1]">WebP</span>
                <span className="text-[#64748B] text-xs ml-1">up to 50MB</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#15803D] dark:text-[#22c55e] pt-2">
                <span className="material-symbols-outlined text-[16px]">verified_user</span>
                <span>Files are processed locally on your device — never uploaded</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK TOOLS GRID */}
      <section className="space-y-8" id="tools">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#DCE3ED] dark:border-[#334155] pb-4">
          <div>
            <h2 className="text-3xl font-bold text-[#131b2e] dark:text-[#F8FAFC]">Available Tools</h2>
            <p className="text-sm text-[#475569] dark:text-[#CBD5E1]">Zero-latency image modification utilities built on standard HTML5 Canvas & WebAssembly APIs.</p>
          </div>
          <div className="text-xs text-[#64748B] flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">speed</span>
            Client-side execution
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => {
            const iconMap: Record<string, string> = {
              "image-compressor": "compress",
              "image-converter": "transform",
              "image-resizer": "aspect_ratio",
              "image-cropper": "crop",
              "image-rotator": "rotate_right",
              "image-inspector": "data_object"
            };
            
            return (
              <Link key={tool.id} href={tool.path} className="group bg-white dark:bg-[#121C2D] rounded-2xl border border-[#DCE3ED] dark:border-[#334155] p-6 shadow-sm hover:border-[#2563eb] dark:hover:border-[#60A5FA] transition-all duration-150 flex flex-col justify-between hover:translate-y-[-2px]">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-[#F1F5F9] dark:bg-[#1B2A40] border border-[#DCE3ED] dark:border-[#334155] flex items-center justify-center text-[#2563eb] dark:text-[#60A5FA] group-hover:bg-[#2563eb] group-hover:text-white transition-colors duration-150">
                    <span className="material-symbols-outlined text-[24px]">{iconMap[tool.id] || "build"}</span>
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-xl font-semibold text-[#131b2e] dark:text-[#F8FAFC] group-hover:text-[#2563eb] dark:group-hover:text-[#60A5FA] transition-colors duration-150 flex items-center justify-between">
                      <span>{tool.title}</span>
                      <span className="material-symbols-outlined text-[18px] text-[#64748B] opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                    </h3>
                    <p className="text-sm text-[#475569] dark:text-[#CBD5E1]">
                      {tool.description}
                    </p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* WHY PIXELTOOLS (3 Benefit Cards) */}
      <section className="space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-3xl font-bold text-[#131b2e] dark:text-[#F8FAFC]">Engineered for Technical Trust</h2>
          <p className="text-sm text-[#475569] dark:text-[#CBD5E1]">Designed strictly for privacy advocates, developers, and privacy-conscious teams.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-[#121C2D] rounded-2xl border border-[#DCE3ED] dark:border-[#334155] p-6 shadow-sm space-y-4">
            <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] dark:bg-opacity-10 border border-[#2563eb]/20 flex items-center justify-center text-[#2563eb] dark:text-[#60A5FA]">
              <span className="material-symbols-outlined text-[22px]">shield</span>
            </div>
            <h3 className="text-lg font-semibold text-[#131b2e] dark:text-[#F8FAFC]">100% On-Device Privacy</h3>
            <p className="text-sm text-[#475569] dark:text-[#CBD5E1]">Your photos never leave your browser window. Zero upload requests, zero cloud storage, zero tracking logs.</p>
          </div>
          <div className="bg-white dark:bg-[#121C2D] rounded-2xl border border-[#DCE3ED] dark:border-[#334155] p-6 shadow-sm space-y-4">
            <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] dark:bg-opacity-10 border border-[#2563eb]/20 flex items-center justify-center text-[#2563eb] dark:text-[#60A5FA]">
              <span className="material-symbols-outlined text-[22px]">bolt</span>
            </div>
            <h3 className="text-lg font-semibold text-[#131b2e] dark:text-[#F8FAFC]">Instant & Repeatable</h3>
            <p className="text-sm text-[#475569] dark:text-[#CBD5E1]">Eliminate server round-trips and queuing delays. Operations run as fast as your hardware allows.</p>
          </div>
          <div className="bg-white dark:bg-[#121C2D] rounded-2xl border border-[#DCE3ED] dark:border-[#334155] p-6 shadow-sm space-y-4">
            <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] dark:bg-opacity-10 border border-[#2563eb]/20 flex items-center justify-center text-[#2563eb] dark:text-[#60A5FA]">
              <span className="material-symbols-outlined text-[22px]">verified</span>
            </div>
            <h3 className="text-lg font-semibold text-[#131b2e] dark:text-[#F8FAFC]">Zero Friction</h3>
            <p className="text-sm text-[#475569] dark:text-[#CBD5E1]">No signup forms, credit card prompts, paywalls, or branded watermarks. Just immediate operations.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
