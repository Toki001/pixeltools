export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  
  // Trigger download
  document.body.appendChild(a);
  a.click();
  
  // Cleanup
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

export function generateOutputFilename(originalFilename: string, suffix: string, extension?: string): string {
  const lastDot = originalFilename.lastIndexOf('.');
  const name = lastDot > -1 ? originalFilename.slice(0, lastDot) : originalFilename;
  const ext = extension || (lastDot > -1 ? originalFilename.slice(lastDot + 1) : '');
  
  return `${name}-${suffix}${ext ? '.' + ext : ''}`;
}
