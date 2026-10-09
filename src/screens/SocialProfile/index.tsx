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
} from 'lucide-react';
import { Button, showToast } from '../../components';
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
import { promptAppInput, confirmAppAction } from '../../utils/sweetAlert';
import { getUserAvatarUrl, getUserFullName } from '../../utils/userDisplay';

const fallbackAvatar =
  'https://ui-avatars.com/api/?name=Community+Member&background=00674D&color=fff';

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
  const activeProfile = isOwnProfile ? (currentUser || profileFromApi) : profileFromApi;

  const profileId = targetUserId || activeProfile?.id || activeProfile?.user_id;
  const isFollowing = Boolean(activeProfile?.is_following ?? activeProfile?.is_followed ?? activeProfile?.isFollowing);

  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
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
    ? getUserAvatarUrl(currentUser) || activeProfile?.image_url || activeProfile?.avatar || fallbackAvatar
    : activeProfile?.image_url || activeProfile?.profile_image_url || activeProfile?.avatar || fallbackAvatar;

  const locationText = useMemo(() => {
    if (activeProfile?.city && activeProfile?.state) {
      return `${activeProfile.city}, ${activeProfile.state}`;
    }
    if (activeProfile?.city) return activeProfile.city;
    if (activeProfile?.state) return activeProfile.state;
    if (activeProfile?.address) return activeProfile.address;
    if (activeProfile?.location) return activeProfile.location;
    return 'New York City, New York';
  }, [activeProfile]);

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
        {/* Floating Top Navigation Inside Banner (1160px Max-Width) */}
        <div className="social-profile-banner__nav">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="social-profile-banner__btn"
          >
            <ArrowLeft size={20} />
          </button>

          {isOwnProfile ? (
            <button
              type="button"
              onClick={() => navigate('/profile/personal-info')}
              className="social-profile-banner__btn"
              title={t('profile.personalInfo', 'Edit Profile')}
            >
              <Settings size={20} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleReportUser}
              className="social-profile-banner__btn"
              title={t('socialProfile.report', 'Report')}
            >
              <Flag size={18} />
            </button>
          )}
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

        {/* User Display Name & Location */}
        <div className="social-profile-header-info">
          <h2 className="social-profile-name">
            {displayName}
          </h2>

          <div className="social-profile-location">
            <MapPin size={16} color="var(--text-muted)" />
            <span>{locationText}</span>
          </div>
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

          {!userProfileLoading && userPosts.length > 0 && (
            <div className="social-profile-posts-list">
              {userPosts.map((post: any) => {
                const postId = post.id;
                const postImage = post?.image_url || post?.media || post?.image;
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

                    {/* Post Image */}
                    {postImage && (
                      <div className="social-profile-post-image-wrap">
                        <img
                          src={postImage}
                          alt="Post media"
                          className="social-profile-post-image"
                        />
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
    </div>
  );
};

export default SocialProfile;
