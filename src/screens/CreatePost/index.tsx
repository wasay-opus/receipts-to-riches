import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft, Image as ImageIcon, Sparkles, Send, X } from 'lucide-react';
import { Button, Container, showToast } from '../../components';
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
      showToast({ type: 'error', text1: t('createPost.postEmpty', 'Post cannot be empty') });
      return;
    }

    const formData = new FormData();
    if (content.trim()) {
      formData.append('description', content.trim());
    }
    if (selectedFile) {
      formData.append('media', selectedFile, selectedFile.name || `post_media_${Date.now()}.jpg`);
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
        text2: error?.message || String(error || t('createPost.tryAgain', 'Please try again.')),
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
          <div style={{ position: 'relative', width: '100%', maxHeight: '280px', borderRadius: '14px', overflow: 'hidden' }}>
            <img
              src={imagePreview}
              alt={t('createPost.previewImageAlt', 'Preview')}
              style={{ width: '100%', maxHeight: '280px', objectFit: 'cover' }}
            />
            <button
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
                background: 'rgba(0,0,0,0.6)',
                border: 'none',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleImageSelect}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => fileInputRef.current?.click()}
            style={{ padding: '8px 14px', fontSize: '13px' }}
          >
            <ImageIcon size={16} />
            <span>{t('createPost.addReceiptPhoto', 'Add Receipt / Photo')}</span>
          </button>
        </div>
      </div>
    </Container>
  );
};

export default CreatePost;
