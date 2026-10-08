import Link from "next/link";
import { tools } from "@/config/tools";

export default function ToolsDirectory() {
  return (
    <main className="w-full max-w-[1280px] mx-auto px-6 py-12 md:py-16 space-y-12">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold text-[#131b2e] dark:text-[#F8FAFC]">All Tools</h1>
        <p className="text-lg text-[#475569] dark:text-[#CBD5E1] max-w-2xl">
          A complete collection of privacy-first, client-side image utilities.
        </p>
      </div>

      {/* Filters (UI only for M2) */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#DCE3ED] dark:border-[#334155] pb-6">
        <button className="px-4 py-2 rounded-full bg-[#2563eb] dark:bg-[#60A5FA] text-white dark:text-[#07111F] text-sm font-semibold">
          All
        </button>
        {["Optimize", "Convert", "Edit", "Inspect"].map((category) => (
          <button key={category} className="px-4 py-2 rounded-full bg-[#F1F5F9] dark:bg-[#1B2A40] text-[#475569] dark:text-[#CBD5E1] hover:bg-[#E2E8F0] dark:hover:bg-[#334155] text-sm font-semibold transition-colors">
            {category}
          </button>
        ))}
      </div>

      {/* Grid */}
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
              <div className="pt-6 mt-4 border-t border-[#DCE3ED]/60 dark:border-[#334155]/60 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-[#F1F5F9] dark:bg-[#1B2A40] text-xs text-[#475569] dark:text-[#CBD5E1] font-mono">{tool.category}</span>
              </div>
            </Link>
          )
        })}
      </div>
    </main>
  );
}
