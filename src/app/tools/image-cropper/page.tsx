import { CropperClient } from "@/components/tools/CropperClient";

export default function ImageCropperPage() {
  return (
    <main className="w-full max-w-[1280px] mx-auto px-6 py-6 flex flex-col gap-6">
      <CropperClient />
    </main>
  );
}
