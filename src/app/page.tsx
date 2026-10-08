"use client";

import Link from "next/link";
import { useState } from "react";
import { tools } from "@/config/tools";

export default function Home() {
  const [activeTab, setActiveTab] = useState("All");

  const categories = ["All", "Optimize", "Convert", "Edit", "Inspect"];

  const filteredTools = tools.filter(tool => {
    if (activeTab === "All") return true;
    if (activeTab === "Optimize" && tool.id === "image-compressor") return true;
    if (activeTab === "Convert" && tool.id === "image-converter") return true;
    if (activeTab === "Edit" && ["image-resizer", "image-cropper", "image-rotator"].includes(tool.id)) return true;
    if (activeTab === "Inspect" && tool.id === "image-inspector") return true;
    return false;
  });

  const getTabClass = (cat: string) => {
    if (activeTab === cat) {
      return "bg-[#2563eb] dark:bg-[#60A5FA] text-white dark:text-[#07111F]";
    }
    return "bg-[#F1F5F9] dark:bg-[#1B2A40] text-[#475569] dark:text-[#CBD5E1] hover:bg-[#E2E8F0] dark:hover:bg-[#334155]";
  };

  return (
    <main className="w-full max-w-[1280px] mx-auto px-6 py-12 md:py-16 space-y-12">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold text-[#131b2e] dark:text-[#F8FAFC] tracking-tight">All Tools</h1>
        <p className="text-[#475569] dark:text-[#CBD5E1] text-lg">A complete collection of privacy-first, client-side image utilities.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${getTabClass(cat)}`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4 border-t border-[#DCE3ED] dark:border-[#334155]">
        {filteredTools.map((tool) => {
          let badge = "Edit";
          if (tool.id === "image-compressor") badge = "Optimize";
          if (tool.id === "image-converter") badge = "Convert";
          if (tool.id === "image-inspector") badge = "Inspect";

          const iconMap: Record<string, string> = {
            "image-compressor": "compress",
            "image-converter": "transform",
            "image-resizer": "aspect_ratio",
            "image-cropper": "crop",
            "image-rotator": "rotate_right",
            "image-inspector": "data_object"
          };

          return (
            <Link key={tool.id} href={tool.path} className="group bg-white dark:bg-[#121C2D] rounded-2xl border border-[#DCE3ED] dark:border-[#334155] p-6 shadow-sm hover:border-[#2563eb] dark:hover:border-[#60A5FA] transition-all duration-150 flex flex-col justify-between hover:translate-y-[-2px] min-h-[240px]">
              <div className="space-y-5">
                <div className="w-10 h-10 rounded-xl bg-[#F1F5F9] dark:bg-[#1B2A40] border border-[#DCE3ED] dark:border-[#334155] flex items-center justify-center text-[#2563eb] dark:text-[#60A5FA] group-hover:bg-[#2563eb] group-hover:text-white transition-colors duration-150">
                  <span className="material-symbols-outlined text-[20px]">{iconMap[tool.id] || "build"}</span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-[#131b2e] dark:text-[#F8FAFC] group-hover:text-[#2563eb] dark:group-hover:text-[#60A5FA] transition-colors duration-150">
                    {tool.title}
                  </h3>
                  <p className="text-sm text-[#475569] dark:text-[#CBD5E1] leading-relaxed">
                    {tool.description}
                  </p>
                </div>
              </div>
              <div className="pt-6">
                <span className="inline-flex px-2.5 py-1 rounded bg-[#F1F5F9] dark:bg-[#1B2A40] text-[11px] font-mono text-[#475569] dark:text-[#94A3B8]">
                  {badge}
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </main>
  );
}
