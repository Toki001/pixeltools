import { limits } from "@/config/limits";
import { ImageProcessingError } from "./contracts";

export async function validateImageFile(file: File): Promise<void> {
  if (!file) {
    throw new ImageProcessingError("No file provided", "NO_FILE");
  }

  if (file.size === 0) {
    throw new ImageProcessingError("File is empty", "EMPTY_FILE");
  }

  if (file.size > limits.maxFileSizeBytes) {
    throw new ImageProcessingError(
      `File exceeds maximum size of ${limits.maxFileSizeMB}MB`,
      "FILE_TOO_LARGE"
    );
  }

  const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
  if (!validTypes.includes(file.type)) {
    // Attempt magic bytes detection as fallback if file.type is empty or we want to be strict
    const magicValid = await checkMagicBytes(file);
    if (!magicValid) {
      throw new ImageProcessingError("Unsupported file format", "UNSUPPORTED_FORMAT");
    }
  }
}

async function checkMagicBytes(file: File): Promise<boolean> {
  // Read first 8 bytes
  const slice = file.slice(0, 8);
  const buffer = await slice.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // JPEG: FF D8 FF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return true;
  
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return true;
  
  // WebP: RIFF ... WEBP
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return true;
      
  return false;
}
