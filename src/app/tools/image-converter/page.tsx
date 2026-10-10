import { Metadata } from "next";
import { ConverterClient } from "@/components/tools/ConverterClient";

export const metadata: Metadata = {
  title: "Image Converter",
  description: "Convert images between JPEG, PNG, and WebP formats.",
};

export default function ImageConverterPage() {
  return (
    <main className="w-full max-w-[1280px] mx-auto px-6 py-6 flex flex-col gap-6">
      <ConverterClient />
    </main>
  );
}
