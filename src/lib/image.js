function readAsDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('The photo could not be read.'));
    reader.readAsDataURL(blob);
  });
}

export async function compressImageToDataUrl(file, maxBytes = 450 * 1024) {
  const image = await createImageBitmap(file);
  try {
    let width = image.width;
    let height = image.height;
    let quality = 0.82;

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, 1400 / Math.max(width, height));
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Image processing is unavailable in this browser.');
      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
      if (!blob) throw new Error('The photo could not be compressed.');
      if (blob.size <= maxBytes) return readAsDataUrl(blob);

      if (quality > 0.5) quality -= 0.1;
      else {
        width *= 0.82;
        height *= 0.82;
        quality = 0.72;
      }
    }
  } finally {
    image.close();
  }
  throw new Error('This image is too large to save safely. Try a smaller or clearer photo.');
}
