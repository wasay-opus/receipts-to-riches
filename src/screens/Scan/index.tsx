import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Upload,
  Camera,
  ScanLine,
  CheckCircle,
  AlertCircle,
  FileImage,
  Sparkles,
  ArrowRight,
  X,
} from 'lucide-react';
import { Button, Container, CustomModal, showToast, triggerCoinCelebration } from '../../components';
import {
  formatFileSize,
  isAssetTooLarge,
  RECEIPT_MAX_FILE_SIZE_BYTES,
} from '../../utils/imageUpload';
import images from '../../constants/images';

export const Scan: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileProcess = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast({
        type: 'error',
        text1: t('scanScreen.errors.invalidFormat', 'Invalid Format'),
        text2: t('scanScreen.errors.uploadImageFile', 'Please upload a valid image file (JPG, PNG, WebP).'),
      });
      return;
    }

    if (isAssetTooLarge(file)) {
      showToast({
        type: 'error',
        text1: t('scanScreen.errors.imageTooLarge', 'Image Too Large'),
        text2: t('scanScreen.errors.uploadSmallerImage', {
          size: formatFileSize(RECEIPT_MAX_FILE_SIZE_BYTES),
        }),
      });
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleUploadAndScan = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      triggerCoinCelebration();
      setIsSuccessModalVisible(true);
      showToast({
        type: 'success',
        text1: t('scanScreen.uploadSuccess', 'Receipt Ready!'),
        text2: t('scanScreen.pointsAwarded', 'Choose a game to submit this receipt.'),
      });
    } catch (error: any) {
      showToast({
        type: 'error',
        text1: t('scanScreen.uploadFailed', 'Scan Failed'),
        text2: error?.message || t('scanScreen.tryAgain', 'Please try again with a clearer receipt image.'),
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Container maxWidth="640px" style={{ gap: '24px', paddingBottom: '40px' }}>
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileProcess(e.target.files[0]);
          }
        }}
      />
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileProcess(e.target.files[0]);
          }
        }}
      />

      {/* Header Info */}
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-main)' }}>
          {t('scanScreen.titleScan', 'Scan')}{' '}
          <span className="green-text">{t('scanScreen.titleReceipt', 'Receipts')}</span>
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '440px' }}>
          {t('scanScreen.subtitle', 'Upload any shopping receipt to earn 40-100+ points and unlock instant-win games!')}
        </p>
      </div>

      {/* Dropzone / Preview Area */}
      {previewUrl ? (
        <div
          className="card"
          style={{
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '18px',
            position: 'relative',
          }}
        >
          <button
            onClick={() => {
              setSelectedFile(null);
              setPreviewUrl(null);
            }}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'rgba(0, 0, 0, 0.6)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>

          <div
            style={{
              width: '100%',
              maxHeight: '380px',
              borderRadius: '16px',
              overflow: 'hidden',
              background: 'var(--bg-input)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src={previewUrl}
              alt="Receipt Preview"
              style={{ maxWidth: '100%', maxHeight: '380px', objectFit: 'contain' }}
            />
          </div>

          <div style={{ width: '100%', display: 'flex', gap: '12px' }}>
            <Button
              variant="secondary"
              title={t('common.changeImage', 'Change')}
              onClick={() => fileInputRef.current?.click()}
              style={{ flex: 1 }}
            />
            <Button
              title={t('scanScreen.submitReceipt', 'Continue to Games')}
              loading={isUploading}
              icon={<Sparkles size={18} />}
              onClick={handleUploadAndScan}
              style={{ flex: 2 }}
            />
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            border: isDragging ? '2px dashed var(--green)' : '2px dashed var(--border-color)',
            background: isDragging ? 'rgba(0, 103, 77, 0.08)' : 'var(--bg-card)',
            borderRadius: '24px',
            padding: '48px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(0, 103, 77, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--green)',
            }}
          >
            <ScanLine size={40} />
          </div>

          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>
              {t('scanScreen.dragDropHere', 'Drag & drop your receipt here')}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {t('scanScreen.supportsFormat', 'Supports PNG, JPG, JPEG up to 10MB')}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button
              type="button"
              className="btn-primary"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              <Upload size={18} />
              <span>{t('scanScreen.browseFiles', 'Browse Files')}</span>
            </button>

            <button
              type="button"
              className="btn-secondary"
              onClick={(e) => {
                e.stopPropagation();
                cameraInputRef.current?.click();
              }}
            >
              <Camera size={18} />
              <span>{t('scanScreen.takePhoto', 'Take Photo')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Guidelines Card */}
      <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)' }}>
          {t('scanScreen.tipsTitle', 'Tips for Faster Verification')}
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={16} color="#10B981" />
            <span>{t('scanScreen.tips.tip1', 'Ensure store name, date, and total amount are clearly visible.')}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={16} color="#10B981" />
            <span>{t('scanScreen.tips.tip2', 'Flatten receipt on a dark, well-lit surface before capturing.')}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={16} color="#10B981" />
            <span>{t('scanScreen.tips.tip3', 'Receipt must be from within the last 14 days.')}</span>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <CustomModal
        visible={isSuccessModalVisible}
        onClose={() => setIsSuccessModalVisible(false)}
        maxWidth="420px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px' }}>
          <img src={images.Coin} alt="Points" style={{ width: '70px', height: '70px' }} />
          <div>
            <h3 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)' }}>
              {t('scanScreen.successModal.title', 'Receipt Ready')}
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {t('scanScreen.successModal.description', 'Choose a game to submit your receipt with the right details.')}
            </p>
          </div>

          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Button
              title={t('scanScreen.successModal.chooseGame', 'Choose a Game')}
              icon={<Sparkles size={18} />}
              onClick={() => {
                setIsSuccessModalVisible(false);
                navigate('/play');
              }}
              style={{ width: '100%' }}
            />
            <Button
              variant="secondary"
              title={t('scanScreen.successModal.scanAnother', 'Scan Another Receipt')}
              onClick={() => {
                setIsSuccessModalVisible(false);
                setSelectedFile(null);
                setPreviewUrl(null);
              }}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </CustomModal>
    </Container>
  );
};

export default Scan;
