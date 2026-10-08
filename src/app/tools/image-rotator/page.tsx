import { RotatorClient } from "@/components/tools/RotatorClient";

export default function ImageRotatorPage() {
  return (
    <main className="w-full max-w-[1280px] mx-auto px-6 py-6 flex flex-col gap-6">
      <RotatorClient />
    </main>
  );
}
