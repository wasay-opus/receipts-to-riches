// Scanned Receipt global in-memory & session storage manager
let activeReceiptFile: File | null = null;
let activeReceiptPreview: string | null = null;

const STORAGE_KEY = '@ReceiptsToRiches/scannedReceipt';

export interface ScannedReceiptData {
  file: File | null;
  previewUrl: string | null;
  name?: string;
  type?: string;
}

export const setScannedReceipt = (file: File | null, previewUrl: string | null) => {
  activeReceiptFile = file;
  activeReceiptPreview = previewUrl;

  if (file && previewUrl) {
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        try {
          sessionStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
              dataUrl: base64data,
              name: file.name,
              type: file.type,
              lastModified: file.lastModified,
            }),
          );
        } catch (storageErr) {
          console.warn('[ReceiptStore] Could not persist base64 to session storage', storageErr);
        }
      };
      reader.readAsDataURL(file);
    } catch (e) {
      console.warn('[ReceiptStore] FileReader failed', e);
    }
  } else {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {}
  }
};

export const getScannedReceipt = (): ScannedReceiptData => {
  if (activeReceiptFile && activeReceiptPreview) {
    return {
      file: activeReceiptFile,
      previewUrl: activeReceiptPreview,
      name: activeReceiptFile.name,
      type: activeReceiptFile.type,
    };
  }

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.dataUrl && typeof parsed.dataUrl === 'string') {
        const parts = parsed.dataUrl.split(',');
        if (parts.length === 2) {
          const mimeMatch = parts[0].match(/:(.*?);/);
          const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
          const bstr = atob(parts[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          const restoredFile = new File([u8arr], parsed.name || 'scanned_receipt.jpg', {
            type: parsed.type || mime || 'image/jpeg',
            lastModified: parsed.lastModified || Date.now(),
          });
          activeReceiptFile = restoredFile;
          activeReceiptPreview = parsed.dataUrl;
          return {
            file: restoredFile,
            previewUrl: parsed.dataUrl,
            name: restoredFile.name,
            type: restoredFile.type,
          };
        }
      }
    }
  } catch (e) {
    console.warn('[ReceiptStore] Error reading scanned receipt from session', e);
  }

  return { file: null, previewUrl: null };
};

export const clearScannedReceipt = () => {
  activeReceiptFile = null;
  activeReceiptPreview = null;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {}
};

export const hasScannedReceipt = (): boolean => {
  if (activeReceiptFile && activeReceiptPreview) return true;
  try {
    return Boolean(sessionStorage.getItem(STORAGE_KEY));
  } catch {
    return false;
  }
};
