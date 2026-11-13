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
  Award,
  User,
  Crown,
} from 'lucide-react';
import images from '../../constants/images';

export const DesktopNavbar: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { label: t('bottomTabs.home', 'Home'), path: '/', icon: <Home size={18} /> },
    { label: t('bottomTabs.feed', 'Feed'), path: '/feed', icon: <Rss size={18} /> },
    { label: t('bottomTabs.scan', 'Scan Receipt'), path: '/scan', icon: <ScanLine size={18} /> },
    { label: t('bottomTabs.rewards', 'Rewards'), path: '/rewards', icon: <Gift size={18} /> },
    { label: t('bottomTabs.winners', 'Winners'), path: '/winners', icon: <Trophy size={18} /> },
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
        {/* Decorative Luxury VIP Tier Pass in Sidebar bottom */}
        <div className="desktop-sidebar__vip-divider" />
        <div
          className="desktop-sidebar__vip-card"
          onClick={() => navigate('/rewards')}
          style={{
            marginTop: '0',
            marginBottom: '16px',
            padding: '14px 14px',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, #022C22 0%, #004D3A 50%, #00674D 100%)',
            border: '1.5px solid rgba(255, 215, 0, 0.45)',
            boxShadow: '0 8px 24px rgba(0, 103, 77, 0.25), 0 0 16px rgba(255, 215, 0, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 12px 28px rgba(0, 103, 77, 0.35), 0 0 22px rgba(255, 215, 0, 0.35)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 103, 77, 0.25), 0 0 16px rgba(255, 215, 0, 0.2)';
          }}
        >
          {/* Subtle gold shimmer streak */}
          <div
            style={{
              position: 'absolute',
              top: '-50%',
              left: '-50%',
              width: '200%',
              height: '200%',
              background: 'linear-gradient(60deg, transparent 40%, rgba(255, 215, 0, 0.2) 50%, transparent 60%)',
              pointerEvents: 'none',
              animation: 'winPointShine 5s infinite',
            }}
          />

          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #FFE066 0%, #F59E0B 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.45)',
              flexShrink: 0,
            }}
          >
            <Crown size={22} color="#FFFFFF" strokeWidth={2.4} />
          </div>

          <div style={{ minWidth: 0, flex: 1, position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 900,
                  color: '#FFFFFF',
                  letterSpacing: '0.4px',
                  lineHeight: 1.2,
                }}
              >
                VIP Club
              </span>
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #FFD700 0%, #D5AD60 100%)',
                  color: '#07130F',
                  padding: '1px 6px',
                  borderRadius: '999px',
                  letterSpacing: '0.3px',
                }}
              >
                LEVEL 1
              </span>
            </div>
            <span
              style={{
                fontSize: '10.5px',
                color: 'rgba(255, 255, 255, 0.8)',
                fontWeight: 600,
                display: 'block',
                marginTop: '3px',
              }}
            >
              Earn 2x Cash Points &rarr;
            </span>
          </div>
        </div>

        <div style={{ paddingTop: '12px', borderTop: '1px solid var(--sidebar-divider)' }}>
          <NavLink
            to="/profile"
            className={`desktop-sidebar__link${isItemActive('/profile') ? ' desktop-sidebar__link--active' : ''}`}
          >
            <User size={18} />
            <span>{t('profile.title', 'Profile')}</span>
          </NavLink>
        </div>
      </nav>
    </aside>
  );
};

export const MobileBottomNav: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const leftTabs = [
    { label: t('bottomTabs.home', 'Home'), path: '/', icon: <Home size={20} /> },
    { label: t('bottomTabs.feed', 'Feed'), path: '/feed', icon: <Rss size={20} /> },
  ];

  const scanTab = { label: t('bottomTabs.scan', 'Scan'), path: '/scan', icon: <ScanLine size={24} /> };

  const rightTabs = [
    { label: t('bottomTabs.rewards', 'Rewards'), path: '/rewards', icon: <Gift size={20} /> },
    { label: t('bottomTabs.winners', 'Winners'), path: '/winners', icon: <Trophy size={20} /> },
  ];

  const renderTab = (tab: { label: string; path: string; icon: React.ReactNode }) => {
    const isActive =
      tab.path === '/'
        ? location.pathname === '/' || location.pathname === '/home'
        : location.pathname === tab.path || location.pathname.startsWith(`${tab.path}/`);

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
          color: isActive ? '#00D066' : 'var(--text-muted)',
          padding: '4px 6px',
          flex: 1,
          minWidth: 0,
          transition: 'all 0.2s ease',
        }}
      >
        <div
          style={{
            transform: isActive ? 'scale(1.1)' : 'scale(1)',
            transition: 'transform 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isActive ? '#00D066' : 'inherit',
          }}
        >
          {tab.icon}
        </div>
        <span
          style={{
            fontSize: '11px',
            fontWeight: isActive ? 700 : 500,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: isActive ? '#00D066' : 'inherit',
          }}
        >
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
        padding: '6px 8px 10px',
        pointerEvents: 'none',
      }}
    >
      <div
        className="mobile-bottom-nav__bar"
        style={{
          width: '100%',
          maxWidth: '520px',
          background: 'var(--nav-bg)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid var(--glass-border)',
          borderRadius: '32px',
          boxShadow: 'var(--shadow-lg)',
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          padding: '6px 10px',
          pointerEvents: 'auto',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: '2px' }}>
          {leftTabs.map(renderTab)}
        </div>

        <div style={{ position: 'relative', width: '64px', display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={() => navigate(scanTab.path)}
            style={{
              position: 'absolute',
              top: '-30px',
              width: '60px',
              minHeight: '70px',
              background: 'transparent',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: '2px',
              color: location.pathname === scanTab.path ? '#00674D' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'transform 0.2s ease',
              padding: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            aria-label={scanTab.label}
          >
            <span
              style={{
                width: '52px',
                height: '52px',
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
            <span style={{ fontSize: '9.5px', fontWeight: 700 }}>
              {scanTab.label}
            </span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: '2px' }}>
          {rightTabs.map(renderTab)}
        </div>
      </div>
    </div>
  );
};
