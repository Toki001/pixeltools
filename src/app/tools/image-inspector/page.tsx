import { Metadata } from "next";
import { InspectorClient } from "@/components/tools/InspectorClient";

export const metadata: Metadata = {
  title: "Image Inspector",
  description: "View image metadata, dimensions, and color profiles.",
};

export default function ImageInspectorPage() {
  return (
    <main className="w-full max-w-[1280px] mx-auto px-6 py-6 flex flex-col gap-6">
      <InspectorClient />
    </main>
  );
}
