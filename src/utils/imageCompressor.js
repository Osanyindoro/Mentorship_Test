// Image Compression Utility for Avatar Uploads (~15KB DataURL target)

export function compressImageFile(file, callback, onError) {
  if (!file) return;
  const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    if (onError) onError('Please select a valid image (JPG, PNG, WEBP).');
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    if (onError) onError('File size must be under 5MB.');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxDim = 250; // Optimized max dimension for avatar icons
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        }
      } else {
        if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Quality setting 0.65 ensures small DataURL string size for LocalStorage safety
      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.65);
      callback(compressedDataUrl);
    };
    img.onerror = () => {
      if (onError) onError('Failed to load image file.');
    };
    img.src = e.target.result;
  };
  reader.onerror = () => {
    if (onError) onError('Failed to read image file.');
  };
  reader.readAsDataURL(file);
}
