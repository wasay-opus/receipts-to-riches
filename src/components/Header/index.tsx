import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Moon, Sun, Bell, Crown, Sparkles } from 'lucide-react';
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
  const location = useLocation();
  const isHome = location.pathname === '/' || location.pathname === '/home';
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();
  const isDarkMode = useSelector((state: RootState) => state.theme?.isDarkMode);
  const user = useSelector((state: RootState) => state.user?.userData);
  const totalCoins = getUserRewardPoints(user);
  const unreadCount = useSelector((state: RootState) =>
    (state.notifications?.notifications ?? []).filter((notification) => !notification.read_at).length,
  );

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
    <>
      <header
        className={`app-main-header${isHome ? ' app-main-header--home' : ''}`}
      >
        <div className="app-main-header__left">
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
          <span className="app-main-header__tagline">
            <Sparkles size={16} aria-hidden="true" />
            <span className="app-main-header__tagline-text">Turn your receipts into rewards</span>
          </span>
        </div>
      </header>

      {/* Floating Sticky Right Bar - completely independent of header scroll */}
      <div className="app-header-sticky-right">
        {rightComponent ? (
          rightComponent
        ) : (
          <>
            {showBalance && (
              <div
                onClick={() => navigate('/rewards')}
                className="header-coin-badge group"
                title={t('bottomTabs.rewards', 'Rewards')}
              >
                <img
                  src={images.goldCoin05 || images.Coin}
                  alt="Coins"
                  className="coin-rotate-icon group-hover:rotate-180 transition-transform duration-500"
                  style={{ width: '20px', height: '20px', objectFit: 'contain' }}
                />
                <span className="header-coin-points-num">{Number(totalCoins).toLocaleString()}</span>
                <span className="header-coin-pts-label">PTS</span>
              </div>
            )}

            <button
              onClick={() => navigate('/rankings')}
              title={t('rankingsScreen.leaderboard', 'Leaderboard')}
              className="header-icon-btn header-crown-btn"
              style={{ color: '#F59E0B' }}
            >
              <Crown size={18} />
            </button>

            <button
              onClick={() => navigate('/notifications')}
              title="Notifications"
              className="header-icon-btn header-notification-btn"
              style={{ position: 'relative' }}
            >
              <Bell size={17} />
              {unreadCount > 0 && <span className="header-notification-badge" />}
            </button>

            <button
              onClick={handleLanguageToggle}
              title="Change Language"
              className="header-icon-btn header-lang-btn"
              style={{ fontSize: '11px', fontWeight: 700 }}
            >
              {i18n.language?.toUpperCase().slice(0, 2) || 'EN'}
            </button>

            <button
              onClick={() => dispatch(toggleDarkMode())}
              title="Toggle Dark/Light Mode"
              className="header-icon-btn header-theme-btn"
            >
              {isDarkMode ? <Sun size={17} color="#FFD700" /> : <Moon size={17} />}
            </button>
          </>
        )}
      </div>
    </>
  );
};

export default Header;
