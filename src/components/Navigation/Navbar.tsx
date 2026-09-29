import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Home,
  Rss,
  Gamepad2,
  ScanLine,
  Gift,
  Trophy,
  User,
} from 'lucide-react';
import images from '../../constants/images';

export const DesktopNavbar: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { label: t('bottomTabs.home', 'Home'), path: '/', icon: <Home size={18} /> },
    { label: t('bottomTabs.feed', 'Feed'), path: '/feed', icon: <Rss size={18} /> },
    { label: t('bottomTabs.play', 'Play'), path: '/play', icon: <Gamepad2 size={18} /> },
    { label: t('bottomTabs.scan', 'Scan Receipt'), path: '/scan', icon: <ScanLine size={18} />, highlight: true },
    { label: t('bottomTabs.rewards', 'Rewards'), path: '/rewards', icon: <Gift size={18} /> },
    { label: t('bottomTabs.rankings', 'Rankings'), path: '/rankings', icon: <Trophy size={18} /> },
    { label: t('profile.title', 'Profile'), path: '/profile', icon: <User size={18} /> },
  ];

  const isItemActive = (path: string) =>
    path === '/'
      ? location.pathname === '/' || location.pathname === '/home'
      : location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <aside className="desktop-sidebar" aria-label="Primary navigation">
      <button className="desktop-sidebar__brand" onClick={() => navigate('/')}>
        <img src={images.SplashLogo} alt="Receipts To Riches" />
        <span>Receipts To Riches</span>
      </button>

      <nav className="desktop-sidebar__nav">
        {navItems.map((item) => {
          const isActive = isItemActive(item.path);
          if (item.highlight) {
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className="desktop-sidebar__link desktop-sidebar__link--scan"
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            );
          }

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`desktop-sidebar__link${isActive ? ' desktop-sidebar__link--active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};

export const MobileBottomNav: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const leftTabs = [
    { label: t('bottomTabs.home', 'Home'), path: '/', icon: <Home size={22} /> },
    { label: t('bottomTabs.feed', 'Feed'), path: '/feed', icon: <Rss size={22} /> },
  ];
  const scanTab = { label: t('bottomTabs.scan', 'Scan'), path: '/scan', icon: <ScanLine size={24} /> };
  const rightTabs = [
    { label: t('bottomTabs.play', 'Play'), path: '/play', icon: <Gamepad2 size={22} /> },
    { label: t('bottomTabs.rankings', 'Rankings'), path: '/rankings', icon: <Trophy size={22} /> },
    { label: t('bottomTabs.rewards', 'Rewards'), path: '/rewards', icon: <Gift size={22} /> },
    { label: t('profile.title', 'Profile'), path: '/profile', icon: <User size={22} /> },
  ];

  const renderTab = (tab: { label: string; path: string; icon: React.ReactNode }) => {
    const isActive = location.pathname === tab.path;

    return (
      <button
        key={tab.path}
        onClick={() => navigate(tab.path)}
        style={{
          background: 'transparent',
          border: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '3px',
          cursor: 'pointer',
          color: isActive ? 'var(--green)' : 'var(--text-muted)',
          padding: '6px 4px',
          minWidth: '50px',
          transition: 'all 0.2s ease',
        }}
      >
        <div
          style={{
            transform: isActive ? 'scale(1.1)' : 'scale(1)',
            transition: 'transform 0.2s ease',
          }}
        >
          {tab.icon}
        </div>
        <span style={{ fontSize: '9px', fontWeight: isActive ? 600 : 500 }}>
          {tab.label}
        </span>
      </button>
    );
  };

  return (
    <div
      className="mobile-bottom-nav"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        display: 'flex',
        justifyContent: 'center',
        padding: '10px 16px 14px',
        pointerEvents: 'none',
      }}
    >
      <div
        className="mobile-bottom-nav__bar"
        style={{
          width: '100%',
          maxWidth: '620px',
          background: 'var(--nav-bg)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid var(--glass-border)',
          borderRadius: '30px',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 10px',
          pointerEvents: 'auto',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {leftTabs.map(renderTab)}
        </div>

        <button
          onClick={() => navigate(scanTab.path)}
          style={{
            position: 'absolute',
            left: '50%',
            top: '-22px',
            transform: 'translateX(-50%)',
            width: '74px',
            minHeight: '78px',
            background: 'transparent',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: '4px',
            color: location.pathname === scanTab.path ? 'var(--green)' : 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'transform 0.2s ease',
            padding: 0,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateX(-50%) scale(1.08)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateX(-50%) scale(1)')}
          aria-label={scanTab.label}
        >
          <span
            style={{
              width: '58px',
              height: '58px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #00674D 0%, #009973 100%)',
              border: '3px solid var(--bg-card)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 6px 18px rgba(0, 103, 77, 0.45)',
            }}
          >
            {scanTab.icon}
          </span>
          <span style={{ fontSize: '10px', fontWeight: 700 }}>
            {scanTab.label}
          </span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {rightTabs.map(renderTab)}
        </div>
      </div>
    </div>
  );
};
