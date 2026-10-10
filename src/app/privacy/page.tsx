import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Manifesto",
  description: "100% On-Device Privacy. Your photos never leave your browser window.",
};

export default function PrivacyPage() {
  return (
    <main className="w-full max-w-[800px] mx-auto px-6 py-12 space-y-8">
      <h1 className="text-4xl font-bold text-[#131b2e] dark:text-[#F8FAFC]">Privacy Manifesto</h1>
      <div className="prose dark:prose-invert text-[#475569] dark:text-[#CBD5E1]">
        <p>100% On-Device Privacy. Your photos never leave your browser window.</p>
        <p>Full privacy policy content coming soon.</p>
      </div>
    </main>
  );
}
