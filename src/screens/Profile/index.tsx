import React, { useState, useEffect } from 'react';
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
  ChevronRight,
  BookOpen,
  Receipt,
  Trash2,
  Gamepad2,
  Trophy,
  PlayCircle,
  Camera,
} from 'lucide-react';
import { RootState, AppDispatch } from '../../redux/Store';
import { logout } from '../../redux/Slices/authSlice';
import { deleteUser, fetchUser } from '../../redux/Slices/userSlice';
import { showToast } from '../../components';
import { getUserFriendlyErrorMessage } from '../../utils/errorMessages';
import {
  getUserAvatarUrl,
  getUserCoverUrl,
  getUserFullName,
  DEFAULT_COVER_URL,
} from '../../utils/userDisplay';
import { confirmAppAction } from '../../utils/sweetAlert';
import images from '../../constants/images';

export const Profile: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const user = useSelector((state: RootState) => state.user?.userData);
  const deleteUserLoading = useSelector((state: RootState) => state.user?.deleteUserLoading);
  const fullName = getUserFullName(user);
  const avatarUrl = getUserAvatarUrl(user);
  const [avatarError, setAvatarError] = useState(false);
  const coverPhotoUrl = getUserCoverUrl(user);
  const [coverError, setCoverError] = useState(false);

  useEffect(() => {
    dispatch(fetchUser());
  }, [dispatch]);

  useEffect(() => {
    setAvatarError(false);
  }, [avatarUrl]);

  useEffect(() => {
    setCoverError(false);
  }, [coverPhotoUrl]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/signin');
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
        text2: getUserFriendlyErrorMessage(error, t('profile.genericTryAgain', 'Please try again.')),
      });
    }
  };

  // Profile Menu items matching Screenshot 3
  const profileMenuItems: Array<{ label: string; path?: string; onClick?: () => void; icon: React.ReactNode }> = [
    { label: t('profile.personalInfo', 'Edit Profile'), path: '/profile/personal-info', icon: <User size={19} /> },
    { label: t('profile.myProfile', 'My Profile'), path: '/social-profile', icon: <User size={19} /> },
    { label: t('profile.changePassword', 'Change Password'), path: '/profile/change-password', icon: <Lock size={19} /> },
    { label: t('profile.playGames', 'Play Games'), path: '/play', icon: <Gamepad2 size={19} /> },
    { label: t('profile.rankingLeaderboard', 'Ranking Leaderboard'), path: '/rankings', icon: <Trophy size={19} /> },
    { label: t('profile.menuMyReceipts', 'My Receipts'), path: '/my-receipts', icon: <Receipt size={19} /> },
    { label: t('profile.menuAboutUs', 'About us'), path: '/profile/about', icon: <Info size={19} /> },
    { label: t('profile.menuExplainVideo', 'Explain Video'), path: '/guide-video', icon: <PlayCircle size={19} /> },
    { label: t('profile.menuRules', 'Rules'), path: '/profile/rules', icon: <BookOpen size={19} /> },
    { label: t('profile.privacyPolicy', 'Privacy Policy'), path: '/profile/privacy', icon: <Shield size={19} /> },
    { label: t('profile.termsConditions', 'Terms & Conditions'), path: '/profile/terms', icon: <FileText size={19} /> },
    { label: t('profile.menuLanguage', 'Language / Idioma'), path: '/profile/languages', icon: <Globe size={19} /> },
    { label: t('profile.helpSupport', 'Help & Support'), path: '/profile/help', icon: <HelpCircle size={19} /> },
  ];

  return (
    <div className="profile-screen-container">
      {/* Profile Header Card with Cover Photo Banner */}
      <div className="card" style={{ borderRadius: '24px', overflow: 'hidden', padding: 0 }}>
        {/* Cover Photo */}
        <div
          style={{
            width: '100%',
            height: '150px',
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: '#1E293B',
          }}
        >
          <img
            src={coverError ? DEFAULT_COVER_URL : coverPhotoUrl}
            alt="Cover"
            onError={() => setCoverError(true)}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, transparent 60%, rgba(0,0,0,0.25) 100%)' }} />
          <button
            type="button"
            onClick={() => navigate('/profile/personal-info')}
            title="Edit profile & cover photo"
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.55)',
              border: '1px solid rgba(255,255,255,0.25)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 3,
            }}
          >
            <Camera size={16} />
          </button>
        </div>

        {/* User Info below banner with overlapping avatar */}
        <div className="profile-header" style={{ marginTop: '-44px', paddingBottom: '20px' }}>
          {/* Centered Avatar */}
          <div className="profile-avatar-wrap">
            {avatarUrl && !avatarError ? (
              <img
                src={avatarUrl}
                alt={fullName || 'User'}
                onError={() => setAvatarError(true)}
                className="profile-avatar-img"
              />
            ) : images.Profile || images.example ? (
              <img
                src={images.Profile || images.example}
                alt={fullName || 'User'}
                className="profile-avatar-img"
              />
            ) : (
              <div className="profile-avatar-placeholder">
                {fullName ? fullName[0].toUpperCase() : 'U'}
              </div>
            )}
          </div>

          <div>
            <h2 className="profile-user-name">
              {fullName || t('profile.defaultUserName', 'Receipts Hunter')}
            </h2>
            <span className="profile-user-email">
              {user?.email || t('profile.defaultEmail', 'user@example.com')}
            </span>
          </div>
        </div>
      </div>

      {/* Menu Items List */}
      <div className="profile-menu-list">
        {profileMenuItems.map((item, i) => (
          <div
            key={i}
            onClick={() => (item.onClick ? item.onClick() : item.path ? navigate(item.path) : undefined)}
            className="profile-menu-item"
          >
            <div className="profile-menu-item__left">
              <span className="profile-menu-item__icon">
                {item.icon}
              </span>
              <span className="profile-menu-item__label">{item.label}</span>
            </div>
            <ChevronRight size={18} color="#00D066" />
          </div>
        ))}
      </div>

      {/* Logout Button */}
      <button
        type="button"
        onClick={handleLogout}
        className="profile-logout-btn"
      >
        <span>{t('auth.logout', 'Logout')}</span>
      </button>

      {/* Delete Account Subtle Button */}
      <div className="profile-delete-wrap">
        <button
          type="button"
          onClick={handleDeleteAccount}
          disabled={deleteUserLoading}
          className="profile-delete-btn"
        >
          <Trash2 size={14} color="#EF4444" />
          <span style={{ color: '#EF4444' }}>
            {deleteUserLoading ? t('profile.deleting', 'Deleting...') : t('profile.deleteAccount', 'Delete Account')}
          </span>
        </button>
      </div>
    </div>
  );
};

export default Profile;
