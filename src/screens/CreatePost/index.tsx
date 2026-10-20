import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft, Image as ImageIcon, Sparkles, Send, X, Video } from 'lucide-react';
import { Button, Container, showToast } from '../../components';
import { getUserFriendlyErrorMessage } from '../../utils/errorMessages';
import { AppDispatch, RootState } from '../../redux/Store';
import { createPost, fetchFeed } from '../../redux/Slices/feedSlice';

export const CreatePost: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [content, setContent] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const isSubmitting = useSelector((state: RootState) => state.feed.createPostLoading);

  const isVideo = Boolean(
    selectedFile?.type?.startsWith('video/') ||
    /\.(mp4|mov|webm|m4v|ogg)$/i.test(selectedFile?.name || '')
  );

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && !selectedFile) {
      showToast({
        type: 'error',
        text1: t('createPost.postEmptyTitle', 'Post Empty'),
        text2: t('createPost.postEmptyMsg', 'Please enter some text or attach a photo / video.'),
      });
      return;
    }

    const formData = new FormData();
    if (content.trim()) {
      formData.append('description', content.trim());
    }
    if (selectedFile) {
      formData.append('media', selectedFile, selectedFile.name || `post_media_${Date.now()}`);
    }

    try {
      await dispatch(createPost(formData)).unwrap();
      showToast({
        type: 'success',
        text1: t('createPost.postPublished', 'Post Published!'),
        text2: t('createPost.postPublishedDesc', 'Your post has been saved.'),
      });
      dispatch(fetchFeed({ params: { per_page: 15, page: 1 }, isRefresh: true }));
      navigate('/feed');
    } catch (error: any) {
      showToast({
        type: 'error',
        text1: t('createPost.postNotSaved', 'Post not saved'),
        text2: getUserFriendlyErrorMessage(error, t('createPost.tryAgain', 'Please try again.')),
      });
    }
  };

  return (
    <Container maxWidth="540px" style={{ gap: '20px', paddingBottom: '40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-main)',
          }}
        >
          <ArrowLeft size={20} />
        </button>

        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>
          {t('createPost.createNewPost', 'Create New Post')}
        </h2>

        <Button
          onClick={handleSubmit}
          loading={isSubmitting}
          title={t('createPost.post', 'Post')}
          icon={<Send size={16} />}
          style={{ padding: '8px 18px', fontSize: '13px' }}
        />
      </div>

      <div
        className="card"
        style={{
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <textarea
          rows={6}
          className="form-input"
          placeholder={t(
            'createPost.sharePlaceholder',
            'Share your shopping deals, winning receipts, or questions with the community...',
          )}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{ resize: 'vertical' }}
        />

        {imagePreview && (
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxHeight: '320px',
              borderRadius: '16px',
              overflow: 'hidden',
              background: '#000',
              border: '1px solid var(--border-color)',
            }}
          >
            {isVideo ? (
              <video
                src={imagePreview}
                controls
                playsInline
                style={{
                  width: '100%',
                  maxHeight: '320px',
                  display: 'block',
                  background: '#000',
                }}
              />
            ) : (
              <img
                src={imagePreview}
                alt={t('createPost.previewImageAlt', 'Preview')}
                style={{ width: '100%', maxHeight: '320px', objectFit: 'cover', display: 'block' }}
              />
            )}
            <button
              type="button"
              onClick={() => {
                if (imagePreview) {
                  URL.revokeObjectURL(imagePreview);
                }
                setImagePreview(null);
                setSelectedFile(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'rgba(0,0,0,0.65)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                zIndex: 10,
              }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          accept="image/*,video/*"
          style={{ display: 'none' }}
          onChange={handleImageSelect}
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: '9px 16px',
              fontSize: '13px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              borderRadius: '12px',
            }}
          >
            <ImageIcon size={16} color="var(--green)" />
            <Video size={16} color="#3B82F6" />
            <span>{t('createPost.addMedia', 'Add Photo / Video')}</span>
          </button>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {selectedFile
              ? isVideo
                ? '🎬 Video selected'
                : '📷 Photo selected'
              : t('createPost.optionalHint', 'Media optional')}
          </span>
        </div>
      </div>
    </Container>
  );
};

export default CreatePost;
