import { StoreGameReceiptFile } from '../services/gameServices';

export const RECEIPT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB for web

export const formatFileSize = (bytes: number): string =>
  `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

export const isAssetTooLarge = (
  file: File | { size?: number } | null | undefined,
  maxFileSizeBytes = RECEIPT_MAX_FILE_SIZE_BYTES,
): boolean =>
  typeof file?.size === 'number' && file.size > maxFileSizeBytes;

export const toReceiptFileFromWebFile = (
  file: File,
): StoreGameReceiptFile => {
  return {
    uri: URL.createObjectURL(file),
    type: file.type || 'image/jpeg',
    name: file.name || `receipt-${Date.now()}.jpg`,
    file: file,
  };
};

export const toReceiptFileFromAsset = (
  asset: any,
): StoreGameReceiptFile | null => {
  if (!asset) return null;
  if (asset instanceof File) {
    return toReceiptFileFromWebFile(asset);
  }
  if (asset.uri) {
    return {
      uri: asset.uri,
      type: asset.type || 'image/jpeg',
      name: asset.name || asset.fileName || `receipt-${Date.now()}.jpg`,
      file: asset.file,
    };
  }
  return null;
};
