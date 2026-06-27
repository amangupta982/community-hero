// Compress an image file using the Canvas API before encoding to base64.
// Target: max 1280px on the longest side at 0.82 JPEG quality.
// This reduces typical phone camera uploads from ~5MB to ~200KB,
// cutting pipeline latency and Gemini token usage significantly.
async function compressImage(file, maxDim = 1280, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const { width, height } = img;
      const scale  = Math.min(1, maxDim / Math.max(width, height));
      const w      = Math.round(width  * scale);
      const h      = Math.round(height * scale);
      const canvas = document.createElement("canvas");
      canvas.width  = w;
      canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      const dataUrl  = canvas.toDataURL("image/jpeg", quality);
      const [meta, data] = dataUrl.split(",");
      const mimeType = meta.replace("data:", "").replace(";base64", "");
      resolve({ data, mimeType });
    };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}

export async function fileToDataUrl(file) {
  try {
    const { data, mimeType } = await compressImage(file);
    return `data:${mimeType};base64,${data}`;
  } catch {
    // Canvas unavailable — fall back to raw encoding.
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload  = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }
}

// Returns { coords, reason }. coords is {lat,lng} or null.
export function getLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      return resolve({ coords: null, reason: "unsupported" });
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        coords: { lat: pos.coords.latitude, lng: pos.coords.longitude },
        reason: null,
      }),
      (err) => {
        const reason =
          err.code === 1 ? "denied" : err.code === 3 ? "timeout" : "unavailable";
        resolve({ coords: null, reason });
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 }
    );
  });
}
