import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft, Check } from 'lucide-react';
import { RootState } from '../../redux/Store';
import { setLanguage } from '../../redux/Slices/languageSlice';
import { Container, showToast } from '../../components';
import images from '../../constants/images';

export const Languages: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentLang = i18n.language?.startsWith('es') ? 'es' : 'en';

  const languages = [
    { code: 'en', name: 'English (US)', flag: images.eng },
    { code: 'es', name: 'Español (Spanish)', flag: images.esp },
  ];

  const handleSelect = (code: 'en' | 'es') => {
    i18n.changeLanguage(code);
    dispatch(setLanguage(code));
    showToast({
      type: 'success',
      text1: t('languages.languageChanged', 'Language changed to English', { lng: code }),
    });
  };

  return (
    <Container maxWidth="540px" style={{ gap: '20px', paddingBottom: '40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)' }}>
          {t('languages.title', 'Select Language')}
        </h1>
      </div>

      <div className="card" style={{ padding: '8px 0', overflow: 'hidden' }}>
        {languages.map((lang) => {
          const isSelected = currentLang === lang.code;
          return (
            <div
              key={lang.code}
              onClick={() => handleSelect(lang.code as any)}
              style={{
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                background: isSelected ? 'rgba(0, 103, 77, 0.08)' : 'transparent',
                borderLeft: isSelected ? '4px solid var(--green)' : '4px solid transparent',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <img src={lang.flag} alt={lang.name} style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
                <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)' }}>
                  {lang.name}
                </span>
              </div>
              {isSelected && <Check size={20} color="var(--green)" />}
            </div>
          );
        })}
      </div>
    </Container>
  );
};

export default Languages;
