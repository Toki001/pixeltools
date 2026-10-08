export const siteConfig = {
  name: "PixelTools",
  tagline: "Every image tool you need, in one place.",
  description: "Free, browser-based, privacy-first image-processing utilities.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  nav: [
    { name: "Tools", href: "/tools" },
    { name: "Compress", href: "/tools/image-compressor" },
    { name: "Convert", href: "/tools/image-converter" },
    { name: "Resize", href: "/tools/image-resizer" },
  ],
  footer: [
    { name: "About", href: "/about" },
    { name: "Privacy", href: "/privacy" },
    { name: "Terms", href: "/terms" },
  ]
};
