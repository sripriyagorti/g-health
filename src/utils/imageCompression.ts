export async function compressImage(dataUrl: string, maxWidth = 480, maxHeight = 360, quality = 0.3): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Aggressive aspect ratio preservation
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      let compressed = canvas.toDataURL('image/jpeg', quality);

      // If still too large, further reduce quality
      let attempts = 0;
      while (compressed.length > 100000 && attempts < 5) {
        const q = quality * (0.8 ** (attempts + 1));
        compressed = canvas.toDataURL('image/jpeg', Math.max(q, 0.1));
        attempts++;
      }

      console.log(`[Image Compression] Compressed to ${width}x${height}, quality: ${quality}, size: ${Math.round(compressed.length / 1024)}KB`);
      resolve(compressed);
    };
    img.onerror = () => reject(new Error('Could not load image'));
    img.src = dataUrl;
  });
}
