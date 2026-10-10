import { Metadata } from "next";
import { CompressorClient } from "@/components/tools/CompressorClient";

export const metadata: Metadata = {
  title: "Image Compressor",
  description: "Reduce image file size with lossless and lossy compression options.",
};

export default function ImageCompressorPage() {
  return (
    <main className="w-full max-w-[1280px] mx-auto px-6 py-6 flex flex-col gap-6">
      <CompressorClient />
    </main>
  );
}
