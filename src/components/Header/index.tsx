import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Moon, Sun, Bell, Globe } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { RootState } from '../../redux/Store';
import { toggleDarkMode } from '../../redux/Slices/darkModeSlice';
import { setLanguage } from '../../redux/Slices/languageSlice';
import images from '../../constants/images';
import { getUserRewardPoints } from '../../utils/userDisplay';

export interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
  showBalance?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  showBackButton = false,
  onBackPress,
  rightComponent,
  showBalance = true,
}) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { i18n } = useTranslation();
  const isDarkMode = useSelector((state: RootState) => state.theme?.isDarkMode);
  const user = useSelector((state: RootState) => state.user?.userData);
  const totalCoins = getUserRewardPoints(user);

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigate(-1);
    }
  };

  const handleLanguageToggle = () => {
    const nextLang = i18n.language === 'es' ? 'en' : 'es';
    i18n.changeLanguage(nextLang);
    dispatch(setLanguage(nextLang));
  };

  return (
    <header
      className="app-main-header"
      style={{
        width: '100%',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'var(--nav-bg)',
        backdropFilter: 'blur(16px)',
        borderBottom: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {showBackButton ? (
          <button
            onClick={handleBack}
            className="header-icon-btn"
            style={{ borderRadius: '10px', width: '36px', height: '36px' }}
          >
            <ArrowLeft size={18} />
          </button>
        ) : (
          <div
            onClick={() => navigate('/')}
            className="mobile-header-logo"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
          >
            <img
              src={images.SplashLogo}
              alt="Receipts To Riches"
              style={{ height: '36px', objectFit: 'contain' }}
            />
          </div>
        )}

        {title && (
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
            {title}
          </h2>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {rightComponent ? (
          rightComponent
        ) : (
          <>
            {showBalance && (
              <div
                onClick={() => navigate('/rewards')}
                className="header-coin-badge"
              >
                <img src={images.Coin} alt="Coins" style={{ width: '18px', height: '18px' }} />
                <span>{Number(totalCoins).toLocaleString()}</span>
              </div>
            )}

            <button
              onClick={handleLanguageToggle}
              title="Change Language"
              className="header-icon-btn"
              style={{ fontSize: '11px', fontWeight: 700 }}
            >
              {i18n.language?.toUpperCase().slice(0, 2) || 'EN'}
            </button>

            <button
              onClick={() => dispatch(toggleDarkMode())}
              title="Toggle Dark/Light Mode"
              className="header-icon-btn"
            >
              {isDarkMode ? <Sun size={17} color="#FFD700" /> : <Moon size={17} />}
            </button>

            <button
              onClick={() => navigate('/notifications')}
              title="Notifications"
              className="header-icon-btn"
              style={{ position: 'relative' }}
            >
              <Bell size={17} />
            </button>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
