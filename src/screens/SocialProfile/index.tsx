import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Flag, UserCheck } from 'lucide-react';
import { Container, Button, showToast } from '../../components';
import { AppDispatch, RootState } from '../../redux/Store';
import {
  fetchFeedUserProfile,
  reportUser,
  toggleFollowUser,
  toggleFollowUserOptimistic,
} from '../../redux/Slices/feedSlice';
import feedServices from '../../services/feedServices';
import { promptAppInput } from '../../utils/sweetAlert';

const fallbackAvatar =
  'https://ui-avatars.com/api/?name=Community+Member&background=00674D&color=fff';

const getProfile = (payload: any) => {
  return payload?.user ?? payload?.profile ?? payload?.data ?? payload ?? {};
};

const getDisplayName = (profile: any): string | null => {
  const name = profile?.name ?? profile?.full_name;
  if (name) return name;
  const first = profile?.first_name;
  const last = profile?.last_name;
  if (first || last) return [first, last].filter(Boolean).join(' ');
  return null;
};

export const SocialProfile: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userId } = useParams();
  const dispatch = useDispatch<AppDispatch>();
  const { userProfileData, userProfileLoading, userProfileError, toggleFollowLoadingMap } =
    useSelector((state: RootState) => state.feed);

  const profile = getProfile(userProfileData);
  const profileId = userId ?? profile?.id ?? profile?.user_id;
  const isFollowing = Boolean(profile?.is_following ?? profile?.is_followed ?? profile?.isFollowing);

  useEffect(() => {
    if (userId) {
      dispatch(fetchFeedUserProfile({ userId, params: { per_page: 15, page: 1 } }));
    }
  }, [dispatch, userId]);

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

  return (
    <Container maxWidth="540px" style={{ gap: '20px', paddingBottom: '40px' }}>
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>
          {getDisplayName(profile) ?? t('socialProfile.communityMember', 'Community Member')}
        </h2>
        <div style={{ width: '40px' }} />
      </div>

      {userProfileLoading && (
        <div className="card" style={{ padding: '20px', color: 'var(--text-muted)' }}>
          {t('socialProfile.loadingProfile', 'Loading profile...')}
        </div>
      )}

      {userProfileError && (
        <div className="card" style={{ padding: '16px', color: '#EF4444', fontSize: '13px' }}>
          {userProfileError}
        </div>
      )}

      {!userProfileLoading && (
        <div
          className="card"
          style={{
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '14px',
          }}
        >
          <img
            src={profile?.image_url ?? profile?.profile_image_url ?? profile?.avatar ?? fallbackAvatar}
            alt={getDisplayName(profile) ?? t('socialProfile.communityMember', 'Community Member')}
            style={{ width: '84px', height: '84px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #00674D' }}
          />
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>
              {getDisplayName(profile) ?? t('socialProfile.communityMember', 'Community Member')}
            </h3>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              {profile?.location ?? profile?.description ?? t('socialProfile.communityProfile', 'Community profile')}
            </span>
          </div>

          {profileId && (
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <Button
                onClick={handleFollow}
                loading={Boolean(toggleFollowLoadingMap[String(profileId)])}
                title={isFollowing ? t('socialProfile.following', 'Following') : t('socialProfile.follow', 'Follow')}
                icon={<UserCheck size={16} />}
                variant={isFollowing ? 'secondary' : 'primary'}
                style={{ minWidth: '130px' }}
              />
              <Button
                onClick={handleReportUser}
                title={t('socialProfile.report', 'Report')}
                icon={<Flag size={16} />}
                variant="secondary"
                style={{ minWidth: '110px' }}
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: '24px', marginTop: '6px' }}>
            <div>
              <strong style={{ fontSize: '16px', color: 'var(--text-main)' }}>
                {profile?.posts_count ?? profile?.posts ?? 0}
              </strong>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('socialProfile.posts', 'Posts')}</p>
            </div>
            <div>
              <strong style={{ fontSize: '16px', color: 'var(--text-main)' }}>
                {profile?.followers_count ?? profile?.followers ?? 0}
              </strong>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('socialProfile.followers', 'Followers')}</p>
            </div>
            <div>
              <strong style={{ fontSize: '16px', color: 'var(--text-main)' }}>
                {profile?.following_count ?? profile?.following ?? 0}
              </strong>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('socialProfile.followingCount', 'Following')}</p>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
};

export default SocialProfile;
