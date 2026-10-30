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
  Megaphone,
  UserX,
  Loader2,
} from 'lucide-react';
import { RootState, AppDispatch } from '../../redux/Store';
import { logout } from '../../redux/Slices/authSlice';
import { deleteUser, fetchUser } from '../../redux/Slices/userSlice';
import { CustomModal, showToast } from '../../components';
import feedServices from '../../services/feedServices';
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

  const [blockedModalOpen, setBlockedModalOpen] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [blockedLoading, setBlockedLoading] = useState(false);

  const [unblockingId, setUnblockingId] = useState<string | number | null>(null);

  const loadBlockedUsers = async () => {
    setBlockedLoading(true);
    try {
      const res = await feedServices.getBlockedUsers();
      const raw = res?.data;
      const list =
        Array.isArray(raw?.data?.data)
          ? raw.data.data
          : Array.isArray(raw?.data)
          ? raw.data
          : Array.isArray(raw?.users)
          ? raw.users
          : Array.isArray(raw?.data?.users)
          ? raw.data.users
          : Array.isArray(raw?.blocked_users)
          ? raw.blocked_users
          : Array.isArray(raw?.data?.blocked_users)
          ? raw.data.blocked_users
          : Array.isArray(raw)
          ? raw
          : Array.isArray(res?.data?.data?.data)
          ? res.data.data.data
          : Array.isArray(res?.data?.data)
          ? res.data.data
          : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.users)
          ? res.users
          : [];
      setBlockedUsers(list);
    } catch (err) {
      console.error('Failed to load blocked users:', err);
      setBlockedUsers([]);
    } finally {
      setBlockedLoading(false);
    }
  };

  useEffect(() => {
    if (blockedModalOpen) {
      loadBlockedUsers();
    }
  }, [blockedModalOpen]);

  const handleUnblockUser = async (uId: string | number, name: string) => {
    setUnblockingId(uId);
    try {
      await feedServices.blockUser(uId);
      showToast({
        type: 'success',
        text1: t('profile.unblocked', 'User Unblocked'),
        text2: t('profile.unblockedDesc', '{{name}} has been unblocked.', { name }),
      });
      await loadBlockedUsers();
    } catch (err: any) {
      showToast({
        type: 'error',
        text1: t('profile.unblockFailed', 'Failed to unblock'),
        text2: getUserFriendlyErrorMessage(err, t('auth.tryAgain', 'Please try again.')),
      });
    } finally {
      setUnblockingId(null);
    }
  };

  // Profile Menu items matching Screenshot 3
  const profileMenuItems: Array<{ label: string; path?: string; onClick?: () => void; icon: React.ReactNode }> = [
    { label: t('profile.personalInfo', 'Edit Profile'), path: '/profile/personal-info', icon: <User size={19} /> },
    { label: t('profile.myProfile', 'My Profile'), path: '/social-profile', icon: <User size={19} /> },
    { label: t('profile.campaigns', 'Campaigns'), path: '/campaigns', icon: <Megaphone size={19} /> },
    { label: t('profile.changePassword', 'Change Password'), path: '/profile/change-password', icon: <Lock size={19} /> },
    { label: t('profile.blockedUsers', 'Blocked Users'), onClick: () => setBlockedModalOpen(true), icon: <UserX size={19} /> },
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

      {/* Blocked Users Modal */}
      <CustomModal
        visible={blockedModalOpen}
        onClose={() => setBlockedModalOpen(false)}
        title={t('profile.blockedUsers', 'Blocked Users')}
        maxWidth="480px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '120px', maxHeight: '380px', overflowY: 'auto' }}>
          {blockedLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '30px', color: 'var(--text-muted)' }}>
              <Loader2 size={24} className="animate-spin" />
            </div>
          ) : blockedUsers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '14px' }}>
              {t('profile.noBlockedUsers', 'No blocked users.')}
            </div>
          ) : (
            blockedUsers.map((bu: any) => {
              const buId = bu.id || bu.user_id || bu.blocked_user_id;
              const buName =
                `${bu.first_name || ''} ${bu.last_name || ''}`.trim() ||
                bu.name ||
                'Blocked User';
              const buAvatar =
                bu.image_url ||
                bu.image ||
                bu.avatar ||
                'https://ui-avatars.com/api/?name=User&background=00674D&color=fff';
              const isProcessing = unblockingId === buId;

              return (
                <div
                  key={buId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: 'var(--bg-hover)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img
                      src={buAvatar}
                      alt={buName}
                      style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://ui-avatars.com/api/?name=User&background=00674D&color=fff';
                      }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>
                        {buName}
                      </span>
                      {bu.email && (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {bu.email}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleUnblockUser(buId, buName)}
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#EF4444',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '8px',
                      padding: '6px 14px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: isProcessing ? 'not-allowed' : 'pointer',
                      opacity: isProcessing ? 0.6 : 1,
                    }}
                  >
                    {isProcessing ? t('profile.unblocking', 'Unblocking...') : t('profile.unblock', 'Unblock')}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </CustomModal>
    </div>
  );
};

export default Profile;
