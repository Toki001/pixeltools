export interface ToolCapabilities {
  formats: string[];
  outputFormats: string[];
}

export interface ToolConfig {
  id: string;
  path: string;
  title: string;
  description: string;
  category: "Optimize" | "Convert" | "Edit" | "Inspect";
  capabilities: ToolCapabilities;
}

export const tools: ToolConfig[] = [
  {
    id: "image-compressor",
    path: "/tools/image-compressor",
    title: "Image Compressor",
    description: "Reduce image file size with lossless and lossy compression options.",
    category: "Optimize",
    capabilities: {
      formats: ["image/jpeg", "image/png", "image/webp"],
      outputFormats: ["image/jpeg", "image/png", "image/webp"]
    }
  },
  {
    id: "image-converter",
    path: "/tools/image-converter",
    title: "Image Converter",
    description: "Convert images between JPEG, PNG, and WebP formats.",
    category: "Convert",
    capabilities: {
      formats: ["image/jpeg", "image/png", "image/webp"],
      outputFormats: ["image/jpeg", "image/png", "image/webp"]
    }
  },
  {
    id: "image-resizer",
    path: "/tools/image-resizer",
    title: "Image Resizer",
    description: "Resize images by exact pixel dimensions or percentage.",
    category: "Edit",
    capabilities: {
      formats: ["image/jpeg", "image/png", "image/webp"],
      outputFormats: ["image/jpeg", "image/png", "image/webp"]
    }
  },
  {
    id: "image-cropper",
    path: "/tools/image-cropper",
    title: "Image Cropper",
    description: "Crop images freely or with common aspect ratios.",
    category: "Edit",
    capabilities: {
      formats: ["image/jpeg", "image/png", "image/webp"],
      outputFormats: ["image/jpeg", "image/png", "image/webp"]
    }
  },
  {
    id: "image-rotator",
    path: "/tools/image-rotator",
    title: "Rotate & Flip",
    description: "Rotate images and flip them horizontally or vertically.",
    category: "Edit",
    capabilities: {
      formats: ["image/jpeg", "image/png", "image/webp"],
      outputFormats: ["image/jpeg", "image/png", "image/webp"]
    }
  },
  {
    id: "image-inspector",
    path: "/tools/image-inspector",
    title: "Image Inspector",
    description: "View image metadata, dimensions, and color profiles.",
    category: "Inspect",
    capabilities: {
      formats: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"],
      outputFormats: []
    }
  }
];
