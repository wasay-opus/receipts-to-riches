import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import {
  Flag,
  Heart,
  MessageCircle,
  Pencil,
  Plus,
  Send,
  Share2,
  ThumbsDown,
  Trash2,
} from 'lucide-react';
import { RootState, AppDispatch } from '../../redux/Store';
import {
  addCommentOptimistic,
  createComment,
  deleteComment,
  deletePost,
  dislikeComment,
  dislikePost,
  fetchFeed,
  likeComment,
  likePost,
  reportComment,
  reportPost,
  togglePostLikeOptimistic,
  updateComment,
  updatePost,
} from '../../redux/Slices/feedSlice';
import { Container, CustomModal, showToast } from '../../components';
import pollServices from '../../services/pollServices';
import { confirmAppAction, promptAppInput } from '../../utils/sweetAlert';

type FeedPost = {
  id: string | number;
  author: string;
  avatar: string;
  time: string;
  content: string;
  image?: string;
  likes: number;
  liked: boolean;
  userId?: string | number;
  comments: Array<{
    id: string | number;
    user: string;
    text: string;
    likes: number;
    dislikes: number;
  }>;
};

type PollOption = {
  id: string | number;
  label: string;
  percent: number;
  votes: number;
};

type CommunityPoll = {
  id: string | number;
  question: string;
  totalVotes: number;
  options: PollOption[];
};

const fallbackAvatar =
  'https://ui-avatars.com/api/?name=Community+Member&background=00674D&color=fff';

type TranslateFn = any;

const getNestedArray = (payload: any): any[] => {
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
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

const getDisplayName = (user: any): string | null => {
  const name = user?.name ?? user?.full_name;
  if (name) return name;
  const first = user?.first_name;
  const last = user?.last_name;
  if (first || last) return [first, last].filter(Boolean).join(' ');
  return null;
};

const normalizeComment = (comment: any, t: TranslateFn) => ({
  id: comment?.id ?? `comment-${Math.random()}`,
  user:
    getDisplayName(comment?.user) ??
    comment?.name ??
    t('feedScreen.communityMemberFallback', 'Community Member'),
  text: comment?.body ?? comment?.comment ?? comment?.text ?? '',
  likes: Number(comment?.likes_count ?? comment?.likes ?? 0),
  dislikes: Number(comment?.dislikes_count ?? comment?.dislikes ?? 0),
});

const normalizePost = (post: any, t: TranslateFn): FeedPost => {
  const user = post?.user ?? post?.author ?? {};
  const comments = Array.isArray(post?.comments) ? post.comments : [];
  const image =
    post?.media_url ??
    post?.mediaUrl ??
    post?.image_url ??
    post?.imageUrl ??
    post?.media ??
    post?.file_url;

  return {
    id: post?.id,
    author:
      getDisplayName(user) ??
      post?.author_name ??
      post?.name ??
      t('feedScreen.communityMemberFallback', 'Community Member'),
    avatar:
      user?.image_url ??
      user?.profile_image_url ??
      user?.avatar ??
      post?.avatar ??
      fallbackAvatar,
    time: formatTime(post?.created_at ?? post?.createdAt),
    content: post?.description ?? post?.content ?? post?.body ?? '',
    image,
    likes: Number(post?.likes_count ?? post?.likes ?? post?.reactions_count ?? 0),
    liked: Boolean(post?.liked ?? post?.is_liked ?? post?.isLiked),
    userId: user?.id ?? post?.user_id,
    comments: comments.map((comment: any) => normalizeComment(comment, t)),
  };
};

const normalizePoll = (poll: any, t: TranslateFn): CommunityPoll | null => {
  if (!poll) return null;
  const rawOptions = Array.isArray(poll?.options) ? poll.options : [];
  const totalVotes = Number(
    poll?.total_votes ??
      poll?.votes_count ??
      rawOptions.reduce(
        (sum: number, option: any) =>
          sum + Number(option?.votes_count ?? option?.votes ?? 0),
        0,
      ),
  );

  return {
    id: poll.id,
    question: poll?.question ?? poll?.title ?? t('feedScreen.poll.dailyPollFallback', 'Daily community poll'),
    totalVotes,
    options: rawOptions.map((option: any, index: number) => {
      const votes = Number(option?.votes_count ?? option?.votes ?? 0);
      const percent =
        typeof option?.percentage === 'number'
          ? option.percentage
          : totalVotes > 0
          ? Math.round((votes / totalVotes) * 100)
          : 0;

      return {
        id: option?.id ?? index,
        label:
          option?.option ??
          option?.title ??
          option?.label ??
          t('feedScreen.poll.optionFallback', 'Option {{number}}', { number: index + 1 }),
        percent,
        votes,
      };
    }),
  };
};

export const Feed: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const { feedList, feedLoading, feedError, likeLoadingMap, commentLoadingMap } =
    useSelector((state: RootState) => state.feed);

  const [activeCommentPostId, setActiveCommentPostId] = useState<string | number | null>(null);
  const [commentText, setCommentText] = useState('');
  const [poll, setPoll] = useState<CommunityPoll | null>(null);
  const [selectedPollOption, setSelectedPollOption] = useState<string | number | null>(null);
  const [pollLoading, setPollLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchFeed({ params: { per_page: 15, page: 1 } }));
  }, [dispatch]);

  useEffect(() => {
    let isMounted = true;

    const loadPolls = async () => {
      setPollLoading(true);
      try {
        const response = await pollServices.getPolls();
        const firstPoll = getNestedArray(response?.data)[0];
        if (isMounted) {
          setPoll(normalizePoll(firstPoll, t));
        }
      } catch (error: any) {
        if (isMounted) {
          showToast({
            type: 'error',
            text1: t('feedScreen.toast.pollsUnavailableTitle', 'Polls unavailable'),
            text2: error?.message || t('feedScreen.toast.pollsUnavailableMessage', 'Could not load daily poll.'),
          });
        }
      } finally {
        if (isMounted) {
          setPollLoading(false);
        }
      }
    };

    loadPolls();
    return () => {
      isMounted = false;
    };
  }, []);

  const posts = useMemo(() => feedList.map((post) => normalizePost(post, t)), [feedList, t]);
  const selectedPost = posts.find((post) => String(post.id) === String(activeCommentPostId));

  const refreshFeed = useCallback(() => {
    dispatch(fetchFeed({ params: { per_page: 15, page: 1 }, isRefresh: true }));
  }, [dispatch]);

  const getReportReason = (target: string) =>
    promptAppInput({
      title: t('feedScreen.dialogs.reportDialogTitle', 'Report {{target}}', { target }),
      inputLabel: t('feedScreen.dialogs.reportDialogLabel', 'Why are you reporting this {{target}}?', { target }),
      inputValue: t('feedScreen.dialogs.reportDefaultReason', 'Inappropriate content'),
      confirmButtonText: t('feedScreen.dialogs.reportSubmitButton', 'Submit report'),
    });

  const handleLike = useCallback(
    async (post: FeedPost) => {
      if (likeLoadingMap[String(post.id)]) return;

      const nextLiked = !post.liked;
      dispatch(togglePostLikeOptimistic({ postId: post.id, liked: nextLiked }));

      try {
        await dispatch(nextLiked ? likePost(post.id) : dislikePost(post.id)).unwrap();
        refreshFeed();
      } catch (error: any) {
        dispatch(togglePostLikeOptimistic({ postId: post.id, liked: post.liked }));
        showToast({
          type: 'error',
          text1: t('feedScreen.toast.likeNotSavedTitle', 'Like not saved'),
          text2: error?.message || String(error || t('feedScreen.toast.tryAgain', 'Please try again.')),
        });
      }
    },
    [dispatch, likeLoadingMap, refreshFeed],
  );

  const handleEditPost = useCallback(
    async (post: FeedPost) => {
      const description = await promptAppInput({
        title: t('feedScreen.editPostLabel', 'Edit post'),
        inputLabel: t('feedScreen.dialogs.postTextLabel', 'Post text'),
        inputValue: post.content,
        confirmButtonText: t('feedScreen.dialogs.updatePostButton', 'Update post'),
        input: 'textarea',
      });
      if (!description || description === post.content) return;

      try {
        await dispatch(
          updatePost({ postId: post.id, payload: { description } }),
        ).unwrap();
        showToast({ type: 'success', text1: t('feedScreen.toast.postUpdatedTitle', 'Post updated') });
        refreshFeed();
      } catch (error: any) {
        showToast({
          type: 'error',
          text1: t('feedScreen.toast.postNotUpdatedTitle', 'Post not updated'),
          text2: error?.message || String(error || t('feedScreen.toast.tryAgain', 'Please try again.')),
        });
      }
    },
    [dispatch, refreshFeed],
  );

  const handleDeletePost = useCallback(
    async (postId: string | number) => {
      const confirmed = await confirmAppAction({
        title: t('feedScreen.dialogs.deletePostConfirmTitle', 'Delete this post?'),
        text: t('feedScreen.dialogs.deleteConfirmText', 'This action cannot be undone.'),
        confirmButtonText: t('feedScreen.dialogs.deleteButton', 'Delete'),
      });
      if (!confirmed) return;

      try {
        await dispatch(deletePost(postId)).unwrap();
        showToast({ type: 'success', text1: t('feedScreen.toast.postDeletedTitle', 'Post deleted') });
        if (String(activeCommentPostId) === String(postId)) {
          setActiveCommentPostId(null);
        }
        refreshFeed();
      } catch (error: any) {
        showToast({
          type: 'error',
          text1: t('feedScreen.toast.postNotDeletedTitle', 'Post not deleted'),
          text2: error?.message || String(error || t('feedScreen.toast.tryAgain', 'Please try again.')),
        });
      }
    },
    [activeCommentPostId, dispatch, refreshFeed],
  );

  const handleReportPost = useCallback(
    async (postId: string | number) => {
      const reason = await getReportReason(t('feedScreen.reportTargetPost', 'post'));
      if (!reason) return;

      try {
        await dispatch(reportPost({ postId, reason })).unwrap();
        showToast({ type: 'success', text1: t('feedScreen.toast.postReportSubmittedTitle', 'Post report submitted') });
      } catch (error: any) {
        showToast({
          type: 'error',
          text1: t('feedScreen.toast.postReportNotSentTitle', 'Post report not sent'),
          text2: error?.message || String(error || t('feedScreen.toast.tryAgain', 'Please try again.')),
        });
      }
    },
    [dispatch],
  );

  const handleEditComment = useCallback(
    async (commentId: string | number, currentText: string) => {
      const body = await promptAppInput({
        title: t('feedScreen.comments.editLabel', 'Edit comment'),
        inputLabel: t('feedScreen.dialogs.commentLabel', 'Comment'),
        inputValue: currentText,
        confirmButtonText: t('feedScreen.dialogs.updateCommentButton', 'Update comment'),
        input: 'textarea',
      });
      if (!body || body === currentText) return;

      try {
        await dispatch(updateComment({ commentId, body })).unwrap();
        showToast({ type: 'success', text1: t('feedScreen.toast.commentUpdatedTitle', 'Comment updated') });
      } catch (error: any) {
        showToast({
          type: 'error',
          text1: t('feedScreen.toast.commentNotUpdatedTitle', 'Comment not updated'),
          text2: error?.message || String(error || t('feedScreen.toast.tryAgain', 'Please try again.')),
        });
      }
    },
    [dispatch],
  );

  const handleDeleteComment = useCallback(
    async (commentId: string | number) => {
      if (String(commentId).startsWith('temp-')) {
        return;
      }

      const confirmed = await confirmAppAction({
        title: t('feedScreen.dialogs.deleteCommentConfirmTitle', 'Delete this comment?'),
        text: t('feedScreen.dialogs.deleteConfirmText', 'This action cannot be undone.'),
        confirmButtonText: t('feedScreen.dialogs.deleteButton', 'Delete'),
      });
      if (!confirmed) return;

      try {
        await dispatch(deleteComment(commentId)).unwrap();
        showToast({ type: 'success', text1: t('feedScreen.toast.commentDeletedTitle', 'Comment deleted') });
      } catch (error: any) {
        showToast({
          type: 'error',
          text1: t('feedScreen.toast.commentNotDeletedTitle', 'Comment not deleted'),
          text2: error?.message || String(error || t('feedScreen.toast.tryAgain', 'Please try again.')),
        });
      }
    },
    [dispatch],
  );

  const handleCommentReaction = useCallback(
    async (commentId: string | number, reaction: 'like' | 'dislike') => {
      if (String(commentId).startsWith('temp-')) return;

      try {
        await dispatch(
          reaction === 'like' ? likeComment(commentId) : dislikeComment(commentId),
        ).unwrap();
        refreshFeed();
      } catch (error: any) {
        showToast({
          type: 'error',
          text1: t('feedScreen.toast.commentReactionNotSavedTitle', 'Comment reaction not saved'),
          text2: error?.message || String(error || t('feedScreen.toast.tryAgain', 'Please try again.')),
        });
      }
    },
    [dispatch, refreshFeed],
  );

  const handleReportComment = useCallback(
    async (commentId: string | number) => {
      if (String(commentId).startsWith('temp-')) return;
      const reason = await getReportReason(t('feedScreen.reportTargetComment', 'comment'));
      if (!reason) return;

      try {
        await dispatch(reportComment({ commentId, reason })).unwrap();
        showToast({ type: 'success', text1: t('feedScreen.toast.commentReportSubmittedTitle', 'Comment report submitted') });
      } catch (error: any) {
        showToast({
          type: 'error',
          text1: t('feedScreen.toast.commentReportNotSentTitle', 'Comment report not sent'),
          text2: error?.message || String(error || t('feedScreen.toast.tryAgain', 'Please try again.')),
        });
      }
    },
    [dispatch],
  );

  const handleVote = useCallback(
    async (option: PollOption) => {
      if (!poll || selectedPollOption !== null) return;

      setSelectedPollOption(option.id);
      try {
        await pollServices.votePoll(poll.id, option.id);
        const resultResponse = await pollServices.getPollResults(poll.id);
        const resultPoll = normalizePoll(resultResponse?.data?.data ?? resultResponse?.data, t);
        if (resultPoll) {
          setPoll(resultPoll);
        }
        showToast({ type: 'success', text1: t('feedScreen.toast.voteRecordedTitle', 'Vote recorded!') });
      } catch (error: any) {
        setSelectedPollOption(null);
        showToast({
          type: 'error',
          text1: t('feedScreen.toast.voteNotSavedTitle', 'Vote not saved'),
          text2: error?.message || t('feedScreen.toast.tryAgain', 'Please try again.'),
        });
      }
    },
    [poll, selectedPollOption],
  );

  const handleAddComment = useCallback(async () => {
    const body = commentText.trim();
    if (!body || !activeCommentPostId) return;

    const tempComment = {
      id: `temp-${Date.now()}`,
      body,
      user: { name: t('feedScreen.you', 'You') },
    };

    dispatch(addCommentOptimistic({ postId: activeCommentPostId, comment: tempComment }));
    setCommentText('');

    try {
      await dispatch(
        createComment({
          postId: activeCommentPostId,
          payload: { body },
        }),
      ).unwrap();
      showToast({ type: 'success', text1: t('feedScreen.toast.commentPostedTitle', 'Comment posted!') });
    } catch (error: any) {
      showToast({
        type: 'error',
        text1: t('feedScreen.toast.commentNotSavedTitle', 'Comment not saved'),
        text2: error?.message || String(error || t('feedScreen.toast.tryAgain', 'Please try again.')),
      });
      dispatch(fetchFeed({ params: { per_page: 15, page: 1 }, isRefresh: true }));
    }
  }, [activeCommentPostId, commentText, dispatch]);

  return (
    <Container maxWidth="640px" style={{ gap: '20px', paddingBottom: '40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)' }}>
            {t('feedScreen.title', 'Community Feed')}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {t('feedScreen.subtitle', 'Share shopping hauls, vote on polls & see winner receipts!')}
          </p>
        </div>

        <button
          onClick={() => navigate('/feed/create')}
          className="btn-primary"
          style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '12px' }}
        >
          <Plus size={16} />
          <span>{t('feedScreen.createPost', 'New Post')}</span>
        </button>
      </div>

      {poll && (
        <div
          className="card"
          style={{
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            border: '1.5px solid rgba(0, 103, 77, 0.3)',
            background: 'var(--bg-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="pill-badge pill-green" style={{ fontSize: '11px' }}>
              {t('feedScreen.poll.badge', 'DAILY COMMUNITY POLL')}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {t('feedScreen.poll.votesCount', '{{count}} votes', { count: poll.totalVotes })}
            </span>
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>
            {poll.question}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {poll.options.map((option) => {
              const isSelected = selectedPollOption === option.id;
              const showResults = selectedPollOption !== null;
              return (
                <button
                  key={option.id}
                  onClick={() => handleVote(option)}
                  disabled={showResults || pollLoading}
                  style={{
                    position: 'relative',
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: isSelected ? '2px solid var(--green)' : '1px solid var(--border-color)',
                    background: 'var(--bg-card-secondary)',
                    cursor: showResults ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    textAlign: 'left',
                    overflow: 'hidden',
                  }}
                >
                  {showResults && (
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: `${option.percent}%`,
                        background: isSelected ? 'rgba(0, 103, 77, 0.2)' : 'rgba(0, 0, 0, 0.05)',
                        zIndex: 1,
                        transition: 'width 0.5s ease',
                      }}
                    />
                  )}
                  <span style={{ position: 'relative', zIndex: 2, fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>
                    {option.label}
                  </span>
                  {showResults && (
                    <span style={{ position: 'relative', zIndex: 2, fontSize: '13px', fontWeight: 700, color: 'var(--green)' }}>
                      {option.percent}%
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {feedError && (
        <div className="card" style={{ padding: '16px', color: '#EF4444', fontSize: '13px' }}>
          {feedError}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {feedLoading && posts.length === 0 && (
          <div className="card" style={{ padding: '20px', color: 'var(--text-muted)' }}>
            {t('feedScreen.loadingFeed', 'Loading feed...')}
          </div>
        )}

        {!feedLoading && posts.length === 0 && (
          <div className="card" style={{ padding: '20px', color: 'var(--text-muted)' }}>
            {t('feedScreen.emptyState', 'No community posts yet.')}
          </div>
        )}

        {posts.map((post) => (
          <div key={post.id} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button
                onClick={() => post.userId && navigate(`/social-profile/${post.userId}`)}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', border: 'none', background: 'transparent', padding: 0, cursor: post.userId ? 'pointer' : 'default', textAlign: 'left' }}
              >
                <img
                  src={post.avatar}
                  alt={post.author}
                  style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
                    {post.author}
                  </h4>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{post.time}</span>
                </div>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  onClick={() => handleEditPost(post)}
                  title={t('feedScreen.editPostLabel', 'Edit post')}
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-card-secondary)',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleReportPost(post.id)}
                  title={t('feedScreen.reportPostLabel', 'Report post')}
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-card-secondary)',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <Flag size={14} />
                </button>
                <button
                  onClick={() => handleDeletePost(post.id)}
                  title={t('feedScreen.deletePostLabel', 'Delete post')}
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '10px',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    background: 'rgba(239, 68, 68, 0.06)',
                    color: '#EF4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {post.content && (
              <p style={{ fontSize: '14px', color: 'var(--text-main)', lineHeight: '1.5' }}>
                {post.content}
              </p>
            )}

            {post.image && (
              <div style={{ width: '100%', maxHeight: '340px', borderRadius: '16px', overflow: 'hidden' }}>
                <img
                  src={post.image}
                  alt={t('feedScreen.postAttachmentAlt', 'Post attachment')}
                  style={{ width: '100%', height: '100%', maxHeight: '340px', objectFit: 'cover' }}
                />
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '18px', paddingTop: '6px', borderTop: '1px solid var(--border-color)' }}>
              <button
                onClick={() => handleLike(post)}
                disabled={Boolean(likeLoadingMap[String(post.id)])}
                style={{
                  background: 'none',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  color: post.liked ? '#EF4444' : 'var(--text-muted)',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                <Heart size={18} fill={post.liked ? '#EF4444' : 'none'} />
                <span>{post.likes}</span>
              </button>

              <button
                onClick={() => setActiveCommentPostId(post.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                <MessageCircle size={18} />
                <span>{t('feedScreen.commentsCount', '{{count}} Comments', { count: post.comments.length })}</span>
              </button>

              <button
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href);
                  showToast({ type: 'info', text1: t('feedScreen.toast.linkCopiedTitle', 'Link copied to clipboard!') });
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  fontSize: '13px',
                  fontWeight: 600,
                  marginLeft: 'auto',
                }}
              >
                <Share2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <CustomModal
        visible={Boolean(activeCommentPostId)}
        onClose={() => setActiveCommentPostId(null)}
        title={t('feedScreen.comments.modalTitle', 'Post Comments')}
        maxWidth="480px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '420px', overflowY: 'auto' }}>
          {selectedPost?.comments.map((comment) => (
            <div
              key={comment.id}
              style={{
                padding: '10px 14px',
                borderRadius: '12px',
                background: 'var(--bg-card-secondary)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>{comment.user}</strong>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{comment.text}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                <button
                  onClick={() => handleCommentReaction(comment.id, 'like')}
                  title={t('feedScreen.comments.likeLabel', 'Like comment')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    padding: 0,
                  }}
                >
                  <Heart size={14} />
                  <span>{comment.likes}</span>
                </button>
                <button
                  onClick={() => handleCommentReaction(comment.id, 'dislike')}
                  title={t('feedScreen.comments.dislikeLabel', 'Dislike comment')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    padding: 0,
                  }}
                >
                  <ThumbsDown size={14} />
                  <span>{comment.dislikes}</span>
                </button>
                <button
                  onClick={() => handleEditComment(comment.id, comment.text)}
                  title={t('feedScreen.comments.editLabel', 'Edit comment')}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleReportComment(comment.id)}
                  title={t('feedScreen.comments.reportLabel', 'Report comment')}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                >
                  <Flag size={14} />
                </button>
                <button
                  onClick={() => handleDeleteComment(comment.id)}
                  title={t('feedScreen.comments.deleteLabel', 'Delete comment')}
                  style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 0, marginLeft: 'auto' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <input
              type="text"
              className="form-input"
              placeholder={t('feedScreen.comments.placeholder', 'Write a comment...')}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddComment();
              }}
            />
            <button
              onClick={handleAddComment}
              disabled={Boolean(activeCommentPostId && commentLoadingMap[String(activeCommentPostId)])}
              className="btn-primary"
              style={{ borderRadius: '12px', padding: '12px 18px' }}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </CustomModal>
    </Container>
  );
};

export default Feed;
