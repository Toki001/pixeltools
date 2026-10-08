import { ResizerClient } from "@/components/tools/ResizerClient";

export default function ImageResizerPage() {
  return (
    <main className="w-full max-w-[1280px] mx-auto px-6 py-6 flex flex-col gap-6">
      <ResizerClient />
    </main>
  );
}
