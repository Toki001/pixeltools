import { CompressorClient } from "@/components/tools/CompressorClient";

export default function ImageCompressorPage() {
  return (
    <main className="w-full max-w-[1280px] mx-auto px-6 py-6 flex flex-col gap-6">
      <CompressorClient />
    </main>
  );
}
