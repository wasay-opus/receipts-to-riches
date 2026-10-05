import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import {
  User,
  Lock,
  Globe,
  FileText,
  Shield,
  HelpCircle,
  Info,
  LogOut,
  ChevronRight,
  BookOpen,
  Receipt,
  Megaphone,
  Star,
  Trash2,
} from 'lucide-react';
import { RootState, AppDispatch } from '../../redux/Store';
import { logout } from '../../redux/Slices/authSlice';
import { deleteUser, fetchUser } from '../../redux/Slices/userSlice';
import { Container, showToast } from '../../components';
import images from '../../constants/images';
import userServices from '../../services/userServices';
import { getUserAvatarUrl, getUserFullName, getUserRewardPoints } from '../../utils/userDisplay';
import { confirmAppAction } from '../../utils/sweetAlert';

export const Profile: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const user = useSelector((state: RootState) => state.user?.userData);
  const deleteUserLoading = useSelector((state: RootState) => state.user?.deleteUserLoading);
  const fullName = getUserFullName(user);
  const totalCoins = getUserRewardPoints(user);
  const avatarUrl = getUserAvatarUrl(user);
  const [avatarError, setAvatarError] = React.useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/signin');
  };

  const handleReviewReward = async () => {
    try {
      await userServices.reviewReward();
      await dispatch(fetchUser()).unwrap();
      showToast({
        type: 'success',
        text1: t('profile.reviewRewardClaimedTitle', 'Review reward claimed'),
        text2: t('profile.reviewRewardClaimedDesc', 'Your reward has been synced with your account.'),
      });
    } catch (error: any) {
      showToast({
        type: 'error',
        text1: t('profile.reviewRewardFailedTitle', 'Review reward not saved'),
        text2: error?.message || String(error || t('profile.genericTryAgain', 'Please try again.')),
      });
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = await confirmAppAction({
      title: t('profile.deleteConfirmPromptTitle', 'Delete your account permanently?'),
      text: t('profile.deleteConfirmPromptText', 'Your profile, receipts, rewards, and feed activity may be removed.'),
      confirmButtonText: t('profile.deleteConfirmButton', 'Delete account'),
    });
    if (!confirmed) return;

    try {
      await dispatch(deleteUser()).unwrap();
      dispatch(logout());
      showToast({ type: 'success', text1: t('profile.accountDeletedTitle', 'Account deleted') });
      navigate('/signin');
    } catch (error: any) {
      showToast({
        type: 'error',
        text1: t('profile.accountNotDeletedTitle', 'Account not deleted'),
        text2: error?.message || String(error || t('profile.genericTryAgain', 'Please try again.')),
      });
    }
  };

  const menuSections = [
    {
      title: t('profile.sectionAccountReceipts', 'Account & Receipts'),
      items: [
        { label: t('profile.personalInfo', 'Personal Information'), path: '/profile/personal-info', icon: <User size={18} /> },
        { label: t('profile.menuMyReceipts', 'My Uploaded Receipts'), path: '/my-receipts', icon: <Receipt size={18} /> },
        { label: t('profile.menuManageCampaigns', 'Manage Brand Campaigns'), path: '/campaigns', icon: <Megaphone size={18} /> },
        { label: t('profile.changePassword', 'Change Password'), path: '/profile/change-password', icon: <Lock size={18} /> },
      ],
    },
    {
      title: t('profile.sectionPreferencesInfo', 'Preferences & Information'),
      items: [
        { label: t('profile.menuLanguage', 'Language / Idioma'), path: '/profile/languages', icon: <Globe size={18} /> },
        { label: t('profile.menuExplainVideo', 'Explain Video & Tutorials'), path: '/guide-video', icon: <BookOpen size={18} /> },
        { label: t('profile.menuRules', 'Official Rules & Guidelines'), path: '/profile/rules', icon: <BookOpen size={18} /> },
        { label: t('profile.menuClaimReviewReward', 'Claim App Review Reward'), action: handleReviewReward, icon: <Star size={18} /> },
        { label: t('profile.helpSupport', 'Help & Support'), path: '/profile/help', icon: <HelpCircle size={18} /> },
        { label: t('profile.menuAboutUs', 'About Us'), path: '/profile/about', icon: <Info size={18} /> },
        { label: t('profile.termsConditions', 'Terms & Conditions'), path: '/profile/terms', icon: <FileText size={18} /> },
        { label: t('profile.privacyPolicy', 'Privacy Policy'), path: '/profile/privacy', icon: <Shield size={18} /> },
      ],
    },
  ];

  return (
    <Container maxWidth="640px" style={{ gap: '24px', paddingBottom: '40px' }}>
      {/* Profile Header Card */}
      <div
        className="card"
        style={{
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '18px',
          position: 'relative',
        }}
      >
        {avatarUrl && !avatarError ? (
          <img
            src={avatarUrl}
            alt={fullName || 'User'}
            onError={() => setAvatarError(true)}
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2.5px solid #D5AD60',
              background: 'var(--bg-card-secondary)',
              flexShrink: 0,
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.12)',
            }}
          />
        ) : (
          <div
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #00674D 0%, #009973 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontSize: '24px',
              fontWeight: 700,
              border: '2px solid #D5AD60',
              flexShrink: 0,
            }}
          >
            {fullName ? fullName[0].toUpperCase() : 'U'}
          </div>
        )}


        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
            {fullName || t('profile.defaultUserName', 'Receipts Hunter')}
          </h2>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {user?.email || t('profile.defaultEmail', 'user@example.com')}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
            <img src={images.Coin} alt="Pts" style={{ width: '16px', height: '16px' }} />
            <strong style={{ fontSize: '13px', color: '#D5AD60' }}>
              {t('profile.pointsLabel', '{{points}} Points', { points: Number(totalCoins).toLocaleString() })}
            </strong>
          </div>
        </div>
      </div>

      {/* Menu Sections */}
      {menuSections.map((sec, idx) => (
        <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {sec.title}
          </span>
          <div className="card" style={{ padding: '4px 0', overflow: 'hidden' }}>
            {sec.items.map((item, i) => (
              <div
                key={i}
                onClick={() => ('action' in item && item.action ? item.action() : navigate(item.path))}
                style={{
                  padding: '14px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  borderBottom: i < sec.items.length - 1 ? '1px solid var(--border-color)' : 'none',
                  transition: 'background 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-secondary)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', color: 'var(--text-main)' }}>
                  <span style={{ color: 'var(--green)' }}>{item.icon}</span>
                  <span style={{ fontSize: '14px', fontWeight: 500 }}>{item.label}</span>
                </div>
                <ChevronRight size={18} color="var(--text-muted)" />
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="btn-secondary"
        style={{
          width: '100%',
          padding: '14px',
          color: '#EF4444',
          borderColor: 'rgba(239, 68, 68, 0.3)',
          background: 'rgba(239, 68, 68, 0.05)',
        }}
      >
        <LogOut size={18} />
        <span>{t('auth.logout', 'Sign Out')}</span>
      </button>

      <button
        onClick={handleDeleteAccount}
        disabled={deleteUserLoading}
        className="btn-secondary"
        style={{
          width: '100%',
          padding: '14px',
          color: '#B91C1C',
          borderColor: 'rgba(185, 28, 28, 0.35)',
          background: 'rgba(185, 28, 28, 0.06)',
        }}
      >
        <Trash2 size={18} />
        <span>{deleteUserLoading ? t('profile.deleting', 'Deleting...') : t('profile.deleteAccount', 'Delete Account')}</span>
      </button>
    </Container>
  );
};

export default Profile;
