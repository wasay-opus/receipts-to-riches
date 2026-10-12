import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Settings,
  MapPin,
  Heart,
  MessageCircle,
  Trash2,
  UserCheck,
  UserPlus,
  Flag,
  Camera,
  LayoutGrid,
  List,
  Video,
} from 'lucide-react';
import { Button, CustomModal, ReportModal, showToast } from '../../components';
import { AppDispatch, RootState } from '../../redux/Store';
import {
  deletePost,
  fetchFeed,
  fetchFeedUserProfile,
  likePost,
  dislikePost,
  reportUser,
  toggleFollowUser,
  toggleFollowUserOptimistic,
  togglePostLikeOptimistic,
} from '../../redux/Slices/feedSlice';
import feedServices from '../../services/feedServices';
import { fetchUser } from '../../redux/Slices/userSlice';
import { promptAppInput, confirmAppAction } from '../../utils/sweetAlert';
import {
  getUserAvatarUrl,
  getUserCoverUrl,
  getUserFullName,
  DEFAULT_COVER_URL,
} from '../../utils/userDisplay';

const fallbackAvatar =
  'https://ui-avatars.com/api/?name=Community+Member&background=00674D&color=fff';

const isVideoUrl = (url?: string, type?: string) => {
  if (!url) return false;
  if (type === 'video') return true;
  return /\.(mp4|mov|webm|m4v|ogg)(\?.*)?$/i.test(url);
};

const getProfile = (payload: any) => {
  return payload?.user ?? payload?.profile ?? payload?.data ?? payload ?? {};
};

const getDisplayName = (profile: any, fallback?: string): string => {
  const name = profile?.name ?? profile?.full_name;
  if (name) return name;
  const first = profile?.first_name;
  const last = profile?.last_name;
  if (first || last) return [first, last].filter(Boolean).join(' ');
  return fallback || 'Community Member';
};

const formatTime = (value?: string) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const SocialProfile: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userId } = useParams();
  const dispatch = useDispatch<AppDispatch>();

  const {
    userProfileData,
    userProfileLoading,
    userProfileError,
    toggleFollowLoadingMap,
    feedList,
  } = useSelector((state: RootState) => state.feed);

  const currentUser = useSelector((state: RootState) => state.user?.userData);
  const currentUserId = currentUser?.id;

  const targetUserId = userId ? String(userId) : currentUserId ? String(currentUserId) : '';
  const isOwnProfile = Boolean(currentUserId && targetUserId && String(currentUserId) === String(targetUserId));

  const profileFromApi = getProfile(userProfileData);
  const activeProfile = isOwnProfile ? { ...(profileFromApi || {}), ...(currentUser || {}) } : profileFromApi;

  const profileId = targetUserId || activeProfile?.id || activeProfile?.user_id;
  const isFollowing = Boolean(activeProfile?.is_following ?? activeProfile?.is_followed ?? activeProfile?.isFollowing);

  const [avatarError, setAvatarError] = useState(false);
  const [coverError, setCoverError] = useState(false);
  const [selectedPostModal, setSelectedPostModal] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'feed'>('grid');
  const [reportModalOpen, setReportModalOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchUser());
    if (targetUserId) {
      dispatch(fetchFeedUserProfile({ userId: targetUserId, params: { per_page: 20, page: 1 } }));
    }
    dispatch(fetchFeed({ params: { per_page: 30, page: 1 } }));
  }, [dispatch, targetUserId]);

  const userPosts = useMemo(() => {
    if (!profileId) return [];
    const directPosts = activeProfile?.posts || userProfileData?.posts || [];
    if (Array.isArray(directPosts) && directPosts.length > 0) {
      return directPosts;
    }
    return (feedList || []).filter((item: any) => {
      const itemUserId = item?.user_id ?? item?.user?.id ?? item?.author_id;
      return itemUserId && String(itemUserId) === String(profileId);
    });
  }, [profileId, activeProfile, userProfileData, feedList]);

  const postsCount =
    activeProfile?.posts_count ??
    activeProfile?.posts?.length ??
    userPosts.length ??
    0;

  const followersCount =
    activeProfile?.followers_count ??
    activeProfile?.followers ??
    0;

  const followingCount =
    activeProfile?.following_count ??
    activeProfile?.following ??
    0;

  const displayName = isOwnProfile
    ? getUserFullName(currentUser) || getDisplayName(activeProfile)
    : getDisplayName(activeProfile);

  const avatarUrl = isOwnProfile
    ? getUserAvatarUrl(currentUser) || getUserAvatarUrl(activeProfile) || fallbackAvatar
    : getUserAvatarUrl(activeProfile) || fallbackAvatar;

  const coverPhotoUrl = useMemo(() => {
    return isOwnProfile
      ? getUserCoverUrl(currentUser)
      : getUserCoverUrl(activeProfile);
  }, [activeProfile, isOwnProfile, currentUser]);

  useEffect(() => {
    setAvatarError(false);
  }, [avatarUrl]);

  useEffect(() => {
    setCoverError(false);
  }, [coverPhotoUrl]);

  const locationText = useMemo(() => {
    const locParts = [
      activeProfile?.address,
      activeProfile?.city,
      activeProfile?.state,
    ].filter(Boolean);

    if (locParts.length > 0) {
      return locParts.join(', ');
    }
    if (activeProfile?.location) return activeProfile.location;
    return '';
  }, [activeProfile]);

  const userBio = useMemo(() => {
    const storedBio = localStorage.getItem(`user_bio_${currentUser?.id || 'me'}`) || '';
    if (isOwnProfile) {
      return (
        currentUser?.bio ||
        currentUser?.about ||
        currentUser?.description ||
        activeProfile?.bio ||
        activeProfile?.about ||
        activeProfile?.description ||
        storedBio ||
        ''
      );
    }
    return activeProfile?.bio || activeProfile?.about || activeProfile?.description || '';
  }, [isOwnProfile, currentUser, activeProfile]);

  const handleFollow = async () => {
    if (!profileId) return;

    dispatch(toggleFollowUserOptimistic({ userId: profileId, isFollowing: !isFollowing }));
    try {
      if (isFollowing) {
        await feedServices.unfollowUser(profileId);
      } else {
        await dispatch(toggleFollowUser(profileId)).unwrap();
      }
    } catch (error: any) {
      dispatch(toggleFollowUserOptimistic({ userId: profileId, isFollowing }));
      showToast({
        type: 'error',
        text1: t('socialProfile.followNotSaved', 'Follow not saved'),
        text2: error?.message || String(error || t('socialProfile.tryAgain', 'Please try again.')),
      });
    }
  };

  const handleReportUser = async () => {
    if (!profileId) return;
    const reason = await promptAppInput({
      title: t('socialProfile.reportUserTitle', 'Report user'),
      inputLabel: t('socialProfile.reportUserPrompt', 'Why are you reporting this user?'),
      inputValue: t('socialProfile.reportDefaultReason', 'Inappropriate profile'),
      confirmButtonText: t('socialProfile.submitReport', 'Submit report'),
    });
    if (!reason) return;

    try {
      await dispatch(reportUser({ userId: profileId, reason })).unwrap();
      showToast({ type: 'success', text1: t('socialProfile.reportSubmitted', 'User report submitted') });
    } catch (error: any) {
      showToast({
        type: 'error',
        text1: t('socialProfile.reportFailed', 'User report not sent'),
        text2: error?.message || String(error || t('socialProfile.tryAgain', 'Please try again.')),
      });
    }
  };

  const handleDeletePost = async (postId: string | number) => {
    const confirmed = await confirmAppAction({
      title: t('feed.deletePostTitle', 'Delete post?'),
      text: t('feed.deletePostPrompt', 'Are you sure you want to permanently delete this post?'),
      confirmButtonText: t('common.delete', 'Delete'),
    });
    if (!confirmed) return;

    try {
      await dispatch(deletePost(postId)).unwrap();
      showToast({ type: 'success', text1: t('feed.postDeleted', 'Post deleted') });
      if (targetUserId) {
        dispatch(fetchFeedUserProfile({ userId: targetUserId, params: { per_page: 20, page: 1 } }));
      }
      dispatch(fetchFeed({ params: { per_page: 30, page: 1 }, isRefresh: true }));
    } catch (error: any) {
      showToast({
        type: 'error',
        text1: t('feed.postNotDeleted', 'Post not deleted'),
        text2: error?.message || String(error || t('common.tryAgain', 'Please try again.')),
      });
    }
  };

  const handleLikePost = async (post: any) => {
    const postId = post.id;
    const isLiked = Boolean(post.is_liked || post.liked);
    dispatch(togglePostLikeOptimistic({ postId, liked: !isLiked }));
    try {
      if (isLiked) {
        await dispatch(dislikePost(postId)).unwrap();
      } else {
        await dispatch(likePost(postId)).unwrap();
      }
    } catch {
      dispatch(togglePostLikeOptimistic({ postId, liked: isLiked }));
    }
  };

  return (
    <div className="social-profile-page">
      {/* 1. Full-Width Cover Banner Across Web Page */}
      <div className="social-profile-banner">
        <img
          src={coverError ? DEFAULT_COVER_URL : coverPhotoUrl}
          alt="Cover Banner"
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
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.6) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Floating Top Navigation Inside Banner (1160px Max-Width) */}
        <div className="social-profile-banner__nav">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="social-profile-banner__btn"
          >
            <ArrowLeft size={20} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isOwnProfile ? (
              <>
                <button
                  type="button"
                  onClick={() => navigate('/profile/personal-info')}
                  className="social-profile-banner__btn"
                  title={t('profile.changeCover', 'Change Cover Photo')}
                >
                  <Camera size={19} />
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/profile/personal-info')}
                  className="social-profile-banner__btn"
                  title={t('profile.personalInfo', 'Edit Profile')}
                >
                  <Settings size={20} />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setReportModalOpen(true)}
                className="social-profile-banner__btn"
                title={t('socialProfile.report', 'Report')}
              >
                <Flag size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Responsive Content Container Below Banner (1160px Max-Width) */}
      <div className="social-profile-content">
        {/* Overlapping Avatar */}
        <div className="social-profile-avatar-wrapper">
          {avatarUrl && !avatarError ? (
            <img
              src={avatarUrl}
              alt={displayName}
              onError={() => setAvatarError(true)}
              className="social-profile-avatar-img"
            />
          ) : (
            <div className="social-profile-avatar-fallback">
              {displayName ? displayName[0].toUpperCase() : 'U'}
            </div>
          )}
        </div>

        {/* User Display Name, Bio & Location */}
        <div className="social-profile-header-info">
          <h2 className="social-profile-name">
            {displayName}
          </h2>

          {userBio ? (
            <p className="social-profile-bio">
              {userBio}
            </p>
          ) : null}

          {locationText ? (
            <div className="social-profile-location">
              <MapPin size={16} color="var(--text-muted)" />
              <span>{locationText}</span>
            </div>
          ) : null}
        </div>

        {/* Follow Button (if visiting another user) */}
        {!isOwnProfile && profileId && (
          <div className="social-profile-follow-wrap">
            <Button
              onClick={handleFollow}
              loading={Boolean(toggleFollowLoadingMap[String(profileId)])}
              title={isFollowing ? t('socialProfile.following', 'Following') : t('socialProfile.follow', 'Follow')}
              icon={isFollowing ? <UserCheck size={16} /> : <UserPlus size={16} />}
              variant={isFollowing ? 'secondary' : 'primary'}
              style={{ flex: 1, padding: '9px 16px', fontSize: '13px' }}
            />
          </div>
        )}

        {/* 3-Column Stats Card Matching Screenshot */}
        <div className="card social-profile-stats-card">
          <div className="social-profile-stat-item">
            <div className="social-profile-stat-value">
              {postsCount}
            </div>
            <div className="social-profile-stat-label">
              {t('socialProfile.posts', 'Posts')}
            </div>
          </div>

          <div className="social-profile-stat-divider" />

          <div className="social-profile-stat-item">
            <div className="social-profile-stat-value">
              {followersCount}
            </div>
            <div className="social-profile-stat-label">
              {t('socialProfile.followers', 'Followers')}
            </div>
          </div>

          <div className="social-profile-stat-divider" />

          <div className="social-profile-stat-item">
            <div className="social-profile-stat-value">
              {followingCount}
            </div>
            <div className="social-profile-stat-label">
              {t('socialProfile.followingCount', 'Following')}
            </div>
          </div>
        </div>

        {/* Posts Feed Section */}
        <div className="social-profile-feed">
          {userProfileLoading && (
            <div className="social-profile-loading">
              {t('socialProfile.loadingProfile', 'Loading profile...')}
            </div>
          )}

          {userProfileError && (
            <div className="card social-profile-error">
              {userProfileError}
            </div>
          )}

          {!userProfileLoading && userPosts.length === 0 && (
            <div className="social-profile-empty">
              {/* Sad Face Red Circle Icon from Screenshot 4 */}
              <div className="social-profile-empty__icon">
                <div className="social-profile-empty__eye-left" />
                <div className="social-profile-empty__eye-right" />
                <div className="social-profile-empty__mouth" />
              </div>

              <p className="social-profile-empty__text">
                {t('socialProfile.noPostsYet', 'No posts yet.')}
              </p>
            </div>
          )}

          {/* View Mode Switcher */}
          {!userProfileLoading && userPosts.length > 0 && (
            <div className="social-profile-view-toggle">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`social-profile-view-btn ${viewMode === 'grid' ? 'social-profile-view-btn--active' : ''}`}
              >
                <LayoutGrid size={16} />
                <span>Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('feed')}
                className={`social-profile-view-btn ${viewMode === 'feed' ? 'social-profile-view-btn--active' : ''}`}
              >
                <List size={16} />
                <span>Feed</span>
              </button>
            </div>
          )}

          {/* Grid View (Matching Screenshot 2 Mobile 3-column Grid) */}
          {!userProfileLoading && userPosts.length > 0 && viewMode === 'grid' && (
            <div className="social-profile-post-grid">
              {userPosts.map((post: any) => {
                const postId = post.id;
                const postMedia =
                  post?.media_url ??
                  post?.mediaUrl ??
                  post?.image_url ??
                  post?.media ??
                  post?.image ??
                  post?.file_url;
                const postMediaType = post?.media_type;
                const isVideo = isVideoUrl(postMedia, postMediaType);
                const postDesc = post?.description || post?.content || post?.body;
                const likesCount = post?.likes_count ?? post?.likes ?? 0;
                const commentsCount = post?.comments_count ?? post?.comments?.length ?? 0;

                return (
                  <div
                    key={postId}
                    className="social-profile-grid-item"
                    onClick={() => setSelectedPostModal(post)}
                  >
                    {postMedia ? (
                      isVideo ? (
                        <>
                          <video src={postMedia} preload="metadata" muted playsInline />
                          <div
                            style={{
                              position: 'absolute',
                              top: '8px',
                              right: '8px',
                              background: 'rgba(0,0,0,0.65)',
                              borderRadius: '6px',
                              padding: '3px 6px',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              zIndex: 2,
                            }}
                          >
                            <Video size={13} />
                          </div>
                        </>
                      ) : (
                        <img src={postMedia} alt="Post thumbnail" loading="lazy" />
                      )
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          padding: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textAlign: 'center',
                          fontSize: '12.5px',
                          fontWeight: 600,
                          color: 'var(--text-main)',
                          background: 'linear-gradient(135deg, rgba(0, 103, 77, 0.22), rgba(0, 230, 118, 0.08))',
                          overflow: 'hidden',
                        }}
                      >
                        {postDesc ? (postDesc.length > 70 ? postDesc.substring(0, 70) + '...' : postDesc) : 'Text post'}
                      </div>
                    )}

                    {/* Hover Overlay with Stats */}
                    <div className="social-profile-grid-overlay">
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Heart size={16} fill="#fff" /> {likesCount}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <MessageCircle size={16} fill="#fff" /> {commentsCount}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Feed View (Single Post Vertical List) */}
          {!userProfileLoading && userPosts.length > 0 && viewMode === 'feed' && (
            <div className="social-profile-posts-list">
              {userPosts.map((post: any) => {
                const postId = post.id;
                const postMedia = post?.media_url ?? post?.mediaUrl ?? post?.image_url ?? post?.media ?? post?.image ?? post?.file_url;
                const postMediaType = post?.media_type;
                const isVideo = isVideoUrl(postMedia, postMediaType);
                const postDesc = post?.description || post?.content || post?.body;
                const isLiked = Boolean(post?.is_liked || post?.liked);
                const likesCount = post?.likes_count ?? post?.likes ?? 0;
                const commentsCount = post?.comments_count ?? post?.comments?.length ?? 0;
                const createdAt = formatTime(post?.created_at);

                return (
                  <div
                    key={postId}
                    className="card social-profile-post-card"
                  >
                    {/* Post Header */}
                    <div className="social-profile-post-header">
                      <div className="social-profile-post-author">
                        <img
                          src={avatarUrl}
                          alt={displayName}
                          className="social-profile-post-author-avatar"
                        />
                        <div>
                          <strong className="social-profile-post-author-name">
                            {displayName}
                          </strong>
                          <span className="social-profile-post-date">
                            {createdAt}
                          </span>
                        </div>
                      </div>

                      {isOwnProfile && (
                        <button
                          type="button"
                          onClick={() => handleDeletePost(postId)}
                          className="social-profile-post-del-btn"
                          title={t('common.delete', 'Delete')}
                        >
                          <Trash2 size={17} />
                        </button>
                      )}
                    </div>

                    {/* Post Description */}
                    {postDesc && (
                      <p className="social-profile-post-desc">
                        {postDesc}
                      </p>
                    )}

                    {/* Post Media (Image or Video) */}
                    {postMedia && (
                      <div
                        className="social-profile-post-image-wrap"
                        style={isVideo ? { position: 'relative', borderRadius: '14px', overflow: 'hidden', background: '#000', maxHeight: '480px' } : undefined}
                      >
                        {isVideo ? (
                          <video
                            src={postMedia}
                            controls
                            playsInline
                            preload="metadata"
                            style={{
                              width: '100%',
                              maxHeight: '480px',
                              objectFit: 'contain',
                              display: 'block',
                              backgroundColor: '#000'
                            }}
                          />
                        ) : (
                          <img
                            src={postMedia}
                            alt="Post media"
                            className="social-profile-post-image"
                          />
                        )}
                      </div>
                    )}

                    {/* Post Actions */}
                    <div className="social-profile-post-actions">
                      <button
                        type="button"
                        onClick={() => handleLikePost(post)}
                        className={`social-profile-post-action-btn ${
                          isLiked ? 'social-profile-post-action-btn--liked' : ''
                        }`}
                      >
                        <Heart size={18} fill={isLiked ? '#FF2A54' : 'none'} />
                        <span>{likesCount}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => navigate('/feed')}
                        className="social-profile-post-action-btn"
                      >
                        <MessageCircle size={18} />
                        <span>{commentsCount}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Post Detail Modal (Clicking any post tile opens full post) */}
      <CustomModal
        visible={Boolean(selectedPostModal)}
        onClose={() => setSelectedPostModal(null)}
        maxWidth="600px"
        title={t('feed.postDetails', 'Post Details')}
      >
        {selectedPostModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Author header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img
                  src={avatarUrl}
                  alt={displayName}
                  style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <div>
                  <strong style={{ fontSize: '15px', color: 'var(--text-main)', display: 'block' }}>
                    {displayName}
                  </strong>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {formatTime(selectedPostModal?.created_at)}
                  </span>
                </div>
              </div>
              {isOwnProfile && (
                <button
                  type="button"
                  onClick={() => {
                    handleDeletePost(selectedPostModal.id);
                    setSelectedPostModal(null);
                  }}
                  className="social-profile-post-del-btn"
                  title={t('common.delete', 'Delete')}
                >
                  <Trash2 size={17} />
                </button>
              )}
            </div>

            {/* Post Description */}
            {(selectedPostModal?.description || selectedPostModal?.content) && (
              <p style={{ fontSize: '15px', color: 'var(--text-main)', margin: 0, lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                {selectedPostModal?.description || selectedPostModal?.content}
              </p>
            )}

            {/* Media */}
            {(() => {
              const modalMedia =
                selectedPostModal?.media_url ??
                selectedPostModal?.mediaUrl ??
                selectedPostModal?.image_url ??
                selectedPostModal?.media ??
                selectedPostModal?.image ??
                selectedPostModal?.file_url;
              const modalType = selectedPostModal?.media_type;
              if (!modalMedia) return null;
              const isVid = isVideoUrl(modalMedia, modalType);
              return (
                <div style={{ borderRadius: '16px', overflow: 'hidden', background: '#000', maxHeight: '460px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isVid ? (
                    <video src={modalMedia} controls autoPlay playsInline style={{ width: '100%', maxHeight: '460px', objectFit: 'contain' }} />
                  ) : (
                    <img src={modalMedia} alt="Post media" style={{ width: '100%', maxHeight: '460px', objectFit: 'contain' }} />
                  )}
                </div>
              );
            })()}

            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
              <button
                type="button"
                onClick={() => handleLikePost(selectedPostModal)}
                style={{
                  background: 'none',
                  border: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: selectedPostModal?.is_liked || selectedPostModal?.liked ? '#FF2A54' : 'var(--text-muted)',
                  fontSize: '14.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Heart size={20} fill={selectedPostModal?.is_liked || selectedPostModal?.liked ? '#FF2A54' : 'none'} />
                <span>{selectedPostModal?.likes_count ?? selectedPostModal?.likes ?? 0}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedPostModal(null);
                  navigate('/feed');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'var(--text-muted)',
                  fontSize: '14.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <MessageCircle size={20} />
                <span>{selectedPostModal?.comments_count ?? selectedPostModal?.comments?.length ?? 0} Comments</span>
              </button>
            </div>
          </div>
        )}
      </CustomModal>

      {/* Reusable Report Modal Bottom Sheet matching mobile design */}
      <ReportModal
        visible={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        targetId={profileId || targetUserId || ''}
        targetType="account"
        targetName={displayName}
      />
    </div>
  );
};

export default SocialProfile;
