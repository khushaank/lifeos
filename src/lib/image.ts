/**
 * Client-side image compression utility.
 *
 * Reads a File via FileReader, resizes it on a canvas, and returns
 * a compressed JPEG data URL (base64).  This keeps image payloads
 * small enough to store directly in PostgreSQL TEXT columns
 * (~30-60 KB per image) without needing Supabase Storage buckets.
 */

export function compressImage(
  file: File,
  maxWidth: number = 400,
  quality: number = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("Failed to read file"));

    reader.onload = () => {
      const img = new Image();

      img.onerror = () => reject(new Error("Failed to decode image"));

      img.onload = () => {
        // Calculate scaled dimensions keeping the aspect ratio
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas 2D context unavailable"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}
