import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Share2,
  Trash2,
  UserCheck,
  UserPlus,
  Flag,
  Send,
  ThumbsDown,
  Reply,
  Pencil,
  Sparkles,
  Bot,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { AppDispatch, RootState } from '../../redux/Store';
import {
  createComment,
  deleteComment,
  deletePost,
  dislikeComment,
  dislikePost,
  fetchFeed,
  likeComment,
  likePost,
  toggleFollowUser,
  toggleFollowUserOptimistic,
  togglePostLikeOptimistic,
  updateComment,
} from '../../redux/Slices/feedSlice';
import feedServices from '../../services/feedServices';
import { Container, Loader, ReportModal, showToast } from '../../components';
import { confirmAppAction, promptAppInput } from '../../utils/sweetAlert';
import { getUserAvatarUrl, getUserFullName } from '../../utils/userDisplay';

const fallbackAvatar =
  'https://ui-avatars.com/api/?name=Community+Member&background=00674D&color=fff';

const isVideoUrl = (url?: string, type?: string) => {
  if (!url) return false;
  if (type === 'video') return true;
  return /\.(mp4|mov|webm|m4v|ogg)(\?.*)?$/i.test(url);
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

const PostDetail: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { t } = useTranslation();

  const currentUser = useSelector((state: RootState) => state.user?.userData);
  const currentUserId = currentUser?.id;
  const feedList = useSelector((state: RootState) => state.feed?.feedList ?? []);

  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Comments state
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentReactions, setCommentReactions] = useState<
    Record<
      string,
      {
        liked: boolean;
        disliked: boolean;
        likesOffset: number;
        dislikesOffset: number;
      }
    >
  >({});

  // Report modal state
  const [reportModalState, setReportModalState] = useState<{
    visible: boolean;
    targetId: string | number;
    targetType: 'post' | 'account' | 'comment';
    targetName?: string;
  }>({
    visible: false,
    targetId: '',
    targetType: 'post',
  });

  // Find post in Redux cache first, or fetch from API
  const loadPostDetails = useCallback(async () => {
    if (!postId) return;
    setLoading(true);
    setError(null);

    // 1. Check if post is in feedList
    const cachedPost = feedList.find(
      (item: any) => String(item.id) === String(postId)
    );
    if (cachedPost) {
      setPost(cachedPost);
    }

    // 2. Fetch fresh from API
    try {
      const response = await feedServices.getPost(postId);
      const postData = response?.data?.data ?? response?.data ?? response;
      if (postData && (postData.id || postData.description || postData.content)) {
        setPost(postData);
      } else if (!cachedPost) {
        setError(t('postDetail.notFound', 'Post not found.'));
      }
    } catch (err: any) {
      if (!cachedPost) {
        // Try fallback to fetching feed and searching
        try {
          const feedRes = await feedServices.getFeed({ per_page: 50, page: 1 });
          const list = feedRes?.data?.data ?? feedRes?.data ?? [];
          const found = list.find((item: any) => String(item.id) === String(postId));
          if (found) {
            setPost(found);
          } else {
            setError(t('postDetail.notFound', 'Post could not be loaded.'));
          }
        } catch {
          setError(t('postDetail.notFound', 'Post could not be loaded.'));
        }
      }
    } finally {
      setLoading(false);
    }
  }, [postId, feedList, t]);

  useEffect(() => {
    loadPostDetails();
  }, [loadPostDetails]);

  // Derived post values
  const author = post?.user ?? post?.author ?? {};
  const authorId = author?.id ?? post?.user_id ?? post?.userId ?? post?.author_id;
  const authorName =
    getUserFullName(author) ||
    author?.name ||
    post?.author_name ||
    post?.name ||
    t('feedScreen.communityMemberFallback', 'Community Member');
  const authorAvatar = getUserAvatarUrl(author) || post?.avatar || fallbackAvatar;
  const isOwnPost = Boolean(currentUserId && authorId && String(currentUserId) === String(authorId));

  const postMedia =
    post?.media_url ??
    post?.mediaUrl ??
    post?.image_url ??
    post?.imageUrl ??
    post?.media ??
    post?.image ??
    post?.file_url;
  const postMediaType = post?.media_type;
  const isVideo = isVideoUrl(postMedia, postMediaType);

  const postText = post?.description || post?.content || post?.body || '';
  const isLiked = Boolean(post?.is_liked || post?.liked || post?.isLiked);
  const likesCount = Number(post?.likes_count ?? post?.likes ?? 0);
  const isFollowing = Boolean(author?.is_following || author?.is_followed || post?.is_following);
  const commentsList = Array.isArray(post?.comments) ? post.comments : [];

  // AI Tools metadata if available on post
  const aiTools =
    post?.ai_tools ??
    post?.ai_tool ??
    post?.tools ??
    post?.model ??
    post?.ai_model ??
    null;

  // Handle Like Post
  const handleLike = async () => {
    if (!post?.id) return;
    const nextLiked = !isLiked;
    const nextCount = Math.max(0, likesCount + (nextLiked ? 1 : -1));

    // Optimistic local state update
    setPost((prev: any) => ({
      ...prev,
      liked: nextLiked,
      is_liked: nextLiked,
      likes_count: nextCount,
      likes: nextCount,
    }));

    dispatch(togglePostLikeOptimistic({ postId: post.id, liked: nextLiked }));

    try {
      if (isLiked) {
        await dispatch(dislikePost(post.id)).unwrap();
      } else {
        await dispatch(likePost(post.id)).unwrap();
      }
    } catch {
      // Revert on error
      setPost((prev: any) => ({
        ...prev,
        liked: isLiked,
        is_liked: isLiked,
        likes_count: likesCount,
        likes: likesCount,
      }));
      dispatch(togglePostLikeOptimistic({ postId: post.id, liked: isLiked }));
    }
  };

  // Handle Follow / Unfollow Author
  const handleToggleFollow = async () => {
    if (!authorId) return;
    const nextFollowing = !isFollowing;

    setPost((prev: any) => ({
      ...prev,
      is_following: nextFollowing,
      user: {
        ...(prev?.user || {}),
        is_following: nextFollowing,
      },
    }));

    dispatch(toggleFollowUserOptimistic({ userId: authorId, isFollowing: nextFollowing }));

    try {
      if (isFollowing) {
        await feedServices.unfollowUser(authorId);
      } else {
        await dispatch(toggleFollowUser(authorId)).unwrap();
      }
      showToast({
        type: 'success',
        text1: nextFollowing
          ? t('socialProfile.nowFollowing', 'Following user')
          : t('socialProfile.unfollowed', 'Unfollowed user'),
      });
    } catch (err: any) {
      setPost((prev: any) => ({
        ...prev,
        is_following: isFollowing,
        user: {
          ...(prev?.user || {}),
          is_following: isFollowing,
        },
      }));
      dispatch(toggleFollowUserOptimistic({ userId: authorId, isFollowing }));
      showToast({
        type: 'error',
        text1: t('socialProfile.followNotSaved', 'Action not saved'),
        text2: err?.message || t('common.tryAgain', 'Please try again.'),
      });
    }
  };

  // Handle Share URL
  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        showToast({
          type: 'success',
          text1: t('feedScreen.shareCopied', 'Link Copied!'),
          text2: t('feedScreen.shareCopiedDesc', 'Post URL copied to clipboard.'),
        });
      } else if (navigator.share) {
        await navigator.share({
          title: `Post by ${authorName}`,
          text: postText.substring(0, 100),
          url,
        });
      }
    } catch {
      // Fallback prompt
      window.prompt('Copy post URL:', url);
    }
  };

  // Handle Delete Post
  const handleDelete = async () => {
    if (!post?.id) return;
    const confirmed = await confirmAppAction({
      title: t('feed.deletePostTitle', 'Delete post?'),
      text: t('feed.deletePostPrompt', 'Are you sure you want to permanently delete this post?'),
      confirmButtonText: t('common.delete', 'Delete'),
    });
    if (!confirmed) return;

    try {
      await dispatch(deletePost(post.id)).unwrap();
      showToast({ type: 'success', text1: t('feed.postDeleted', 'Post deleted') });
      navigate(-1);
    } catch (err: any) {
      showToast({
        type: 'error',
        text1: t('feed.postNotDeleted', 'Post not deleted'),
        text2: err?.message || t('common.tryAgain', 'Please try again.'),
      });
    }
  };

  // Handle Add Comment
  const handleAddComment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const body = commentText.trim();
    if (!body || !post?.id || isSubmittingComment) return;

    setIsSubmittingComment(true);
    const parentId = replyingTo?.id;

    const tempComment = {
      id: `temp-${Date.now()}`,
      body,
      user: {
        name: getUserFullName(currentUser) || t('feedScreen.you', 'You'),
        id: currentUserId,
        image_url: getUserAvatarUrl(currentUser),
      },
      user_id: currentUserId,
      parent_id: parentId,
      created_at: new Date().toISOString(),
      likes_count: 0,
      dislikes_count: 0,
    };

    // Optimistically append comment
    setPost((prev: any) => ({
      ...prev,
      comments: [tempComment, ...(prev?.comments || [])],
      comments_count: (prev?.comments_count || 0) + 1,
    }));
    setCommentText('');
    setReplyingTo(null);

    try {
      await dispatch(
        createComment({
          postId: post.id,
          payload: { body, parent_id: parentId },
        })
      ).unwrap();
      showToast({
        type: 'success',
        text1: t('feedScreen.toast.commentPostedTitle', 'Comment posted!'),
      });
      // Refresh details
      loadPostDetails();
    } catch (err: any) {
      showToast({
        type: 'error',
        text1: t('feedScreen.toast.commentNotSavedTitle', 'Comment not saved'),
        text2: err?.message || t('common.tryAgain', 'Please try again.'),
      });
      loadPostDetails();
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Handle Delete Comment
  const handleDeleteComment = async (commentId: string | number) => {
    const confirmed = await confirmAppAction({
      title: t('feedScreen.dialogs.deleteCommentConfirmTitle', 'Delete this comment?'),
      text: t('feedScreen.dialogs.deleteConfirmText', 'This action cannot be undone.'),
      confirmButtonText: t('common.delete', 'Delete'),
    });
    if (!confirmed) return;

    try {
      await dispatch(deleteComment(commentId)).unwrap();
      showToast({
        type: 'success',
        text1: t('feedScreen.toast.commentDeletedTitle', 'Comment deleted'),
      });
      setPost((prev: any) => ({
        ...prev,
        comments: (prev?.comments || []).filter((c: any) => String(c.id) !== String(commentId)),
        comments_count: Math.max(0, (prev?.comments_count || 1) - 1),
      }));
    } catch (err: any) {
      showToast({
        type: 'error',
        text1: t('feedScreen.toast.commentNotDeletedTitle', 'Comment not deleted'),
        text2: err?.message || t('common.tryAgain', 'Please try again.'),
      });
    }
  };

  // Handle Edit Comment
  const handleEditComment = async (commentId: string | number, currentText: string) => {
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
      showToast({
        type: 'success',
        text1: t('feedScreen.toast.commentUpdatedTitle', 'Comment updated'),
      });
      loadPostDetails();
    } catch (err: any) {
      showToast({
        type: 'error',
        text1: t('feedScreen.toast.commentNotUpdatedTitle', 'Comment not updated'),
        text2: err?.message || t('common.tryAgain', 'Please try again.'),
      });
    }
  };

  // Handle Comment Reaction (like / dislike)
  const handleCommentReaction = async (
    commentId: string | number,
    reaction: 'like' | 'dislike',
    initialLiked = false,
    initialDisliked = false
  ) => {
    if (String(commentId).startsWith('temp-')) return;
    const key = String(commentId);
    const prev = commentReactions[key] || {
      liked: initialLiked,
      disliked: initialDisliked,
      likesOffset: 0,
      dislikesOffset: 0,
    };

    let nextLiked = prev.liked;
    let nextDisliked = prev.disliked;
    let nextLikesOffset = prev.likesOffset;
    let nextDislikesOffset = prev.dislikesOffset;

    if (reaction === 'like') {
      if (prev.liked) {
        nextLiked = false;
        nextLikesOffset -= 1;
      } else {
        nextLiked = true;
        nextLikesOffset += 1;
        if (prev.disliked) {
          nextDisliked = false;
          nextDislikesOffset -= 1;
        }
      }
    } else {
      if (prev.disliked) {
        nextDisliked = false;
        nextDislikesOffset -= 1;
      } else {
        nextDisliked = true;
        nextDislikesOffset += 1;
        if (prev.liked) {
          nextLiked = false;
          nextLikesOffset -= 1;
        }
      }
    }

    setCommentReactions((curr) => ({
      ...curr,
      [key]: {
        liked: nextLiked,
        disliked: nextDisliked,
        likesOffset: nextLikesOffset,
        dislikesOffset: nextDislikesOffset,
      },
    }));

    try {
      if (reaction === 'like') {
        await dispatch(likeComment(commentId)).unwrap();
      } else {
        await dispatch(dislikeComment(commentId)).unwrap();
      }
    } catch {
      setCommentReactions((curr) => ({ ...curr, [key]: prev }));
    }
  };

  if (loading && !post) {
    return (
      <Container maxWidth="720px" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader />
      </Container>
    );
  }

  if (error && !post) {
    return (
      <Container maxWidth="640px" style={{ gap: '20px', padding: '40px 16px', textAlign: 'center' }}>
        <div className="card" style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
            {error}
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
            {t('postDetail.notFoundDesc', 'The post you are looking for may have been deleted or is unavailable.')}
          </p>
          <button
            onClick={() => navigate('/feed')}
            className="btn btn--primary"
            style={{ marginTop: '12px', padding: '10px 24px', borderRadius: '12px' }}
          >
            {t('postDetail.backToFeed', 'Back to Feed')}
          </button>
        </div>
      </Container>
    );
  }

  return (
    <Container maxWidth="720px" style={{ gap: '20px', paddingBottom: '60px' }}>
      {/* Top Navigation Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
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
            transition: 'all 0.2s ease',
          }}
          title={t('common.back', 'Back')}
        >
          <ArrowLeft size={19} />
        </button>

        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
          {t('feed.postDetails', 'Post Details')}
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleShare}
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
            title={t('common.share', 'Share post link')}
          >
            <Share2 size={18} />
          </button>

          {isOwnPost ? (
            <button
              onClick={handleDelete}
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '12px',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#EF4444',
              }}
              title={t('common.delete', 'Delete post')}
            >
              <Trash2 size={18} />
            </button>
          ) : (
            <button
              onClick={() =>
                setReportModalState({
                  visible: true,
                  targetId: post?.id,
                  targetType: 'post',
                  targetName: authorName,
                })
              }
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
                color: 'var(--text-muted)',
              }}
              title={t('socialProfile.report', 'Report post')}
            >
              <Flag size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Main Post Card */}
      <div
        className="card"
        style={{
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          borderRadius: '20px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
          border: '1px solid var(--border-color)',
          background: 'var(--bg-card)',
        }}
      >
        {/* Author Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div
            onClick={() => authorId && navigate(`/social-profile/${authorId}`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: authorId ? 'pointer' : 'default',
              minWidth: 0,
            }}
          >
            <img
              src={authorAvatar}
              alt={authorName}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                objectFit: 'cover',
                flexShrink: 0,
                border: '2px solid rgba(0, 103, 77, 0.2)',
              }}
            />
            <div style={{ minWidth: 0 }}>
              <strong
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  display: 'block',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {authorName}
              </strong>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                {formatTime(post?.created_at || post?.createdAt)}
              </span>
            </div>
          </div>

          {!isOwnPost && authorId && (
            <button
              onClick={handleToggleFollow}
              style={{
                padding: '7px 16px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 700,
                border: isFollowing ? '1px solid var(--border-color)' : 'none',
                background: isFollowing ? 'var(--bg-card-secondary)' : 'var(--green)',
                color: isFollowing ? 'var(--text-muted)' : '#ffffff',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                flexShrink: 0,
                transition: 'all 0.2s ease',
              }}
            >
              {isFollowing ? (
                <>
                  <UserCheck size={15} />
                  <span>{t('socialProfile.following', 'Following')}</span>
                </>
              ) : (
                <>
                  <UserPlus size={15} />
                  <span>{t('socialProfile.follow', 'Follow')}</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Post Text Description */}
        {postText && (
          <p
            style={{
              fontSize: '16px',
              lineHeight: '1.65',
              color: 'var(--text-main)',
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {postText}
          </p>
        )}

        {/* AI Tools Badge / Metadata if present */}
        {aiTools && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(0, 103, 77, 0.12), rgba(0, 230, 118, 0.08))',
              border: '1px solid rgba(0, 230, 118, 0.25)',
              alignSelf: 'flex-start',
              fontSize: '12.5px',
              fontWeight: 600,
              color: 'var(--text-main)',
            }}
          >
            <Sparkles size={15} color="#00e676" />
            <span>AI Tool: {typeof aiTools === 'string' ? aiTools : JSON.stringify(aiTools)}</span>
          </div>
        )}

        {/* Post Media (Image or Video) */}
        {postMedia && (
          <div
            style={{
              width: '100%',
              borderRadius: '16px',
              overflow: 'hidden',
              background: '#000000',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              maxHeight: '520px',
            }}
          >
            {isVideo ? (
              <video
                src={postMedia}
                controls
                autoPlay
                playsInline
                preload="metadata"
                style={{
                  width: '100%',
                  maxHeight: '520px',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            ) : (
              <img
                src={postMedia}
                alt="Post Media"
                style={{
                  width: '100%',
                  maxHeight: '520px',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            )}
          </div>
        )}

        {/* Action Counters & Buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '14px',
            borderTop: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* Like Button */}
            <button
              onClick={handleLike}
              style={{
                background: 'none',
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                color: isLiked ? '#FF2A54' : 'var(--text-muted)',
                fontSize: '15px',
                fontWeight: 700,
                padding: '6px 10px',
                borderRadius: '10px',
                transition: 'all 0.15s ease',
              }}
            >
              <Heart size={22} fill={isLiked ? '#FF2A54' : 'none'} color={isLiked ? '#FF2A54' : 'currentColor'} />
              <span>{likesCount}</span>
            </button>

            {/* Comments Counter */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--text-muted)',
                fontSize: '15px',
                fontWeight: 600,
              }}
            >
              <MessageCircle size={22} />
              <span>{post?.comments_count ?? commentsList.length}</span>
            </div>
          </div>

          <button
            onClick={handleShare}
            style={{
              background: 'none',
              border: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--text-muted)',
              fontSize: '13.5px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Copy size={16} />
            <span>{t('feedScreen.copyLink', 'Copy Link')}</span>
          </button>
        </div>
      </div>

      {/* Comments Section */}
      <div
        className="card"
        style={{
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          borderRadius: '20px',
          border: '1px solid var(--border-color)',
          background: 'var(--bg-card)',
        }}
      >
        <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
          {t('feedScreen.comments.title', 'Comments')} ({post?.comments_count ?? commentsList.length})
        </h3>

        {/* Add Comment Input Form */}
        <form onSubmit={handleAddComment} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {replyingTo && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 12px',
                background: 'rgba(0, 103, 77, 0.08)',
                borderRadius: '8px',
                fontSize: '12.5px',
                color: 'var(--text-main)',
              }}
            >
              <span>Replying to <strong>@{replyingTo.authorName || replyingTo.user}</strong></span>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px' }}
              >
                ✕
              </button>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <img
              src={getUserAvatarUrl(currentUser) || fallbackAvatar}
              alt="You"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                objectFit: 'cover',
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, position: 'relative' }}>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={
                  replyingTo
                    ? `Reply to @${replyingTo.authorName || replyingTo.user}...`
                    : t('feedScreen.comments.placeholder', 'Add a friendly comment...')
                }
                rows={2}
                style={{
                  width: '100%',
                  padding: '12px 46px 12px 14px',
                  borderRadius: '14px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-card-secondary)',
                  color: 'var(--text-main)',
                  fontSize: '14px',
                  resize: 'none',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
              />
              <button
                type="submit"
                disabled={!commentText.trim() || isSubmittingComment}
                style={{
                  position: 'absolute',
                  right: '10px',
                  bottom: '14px',
                  background: commentText.trim() ? 'var(--green)' : 'transparent',
                  color: commentText.trim() ? '#fff' : 'var(--text-muted)',
                  border: 'none',
                  borderRadius: '10px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: commentText.trim() ? 'pointer' : 'default',
                  transition: 'all 0.15s ease',
                }}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </form>

        {/* Comments List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {commentsList.length === 0 ? (
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center', margin: '20px 0' }}>
              {t('feedScreen.comments.emptyState', 'No comments yet. Be the first to share your thoughts!')}
            </p>
          ) : (
            commentsList.map((comment: any) => {
              const cId = comment?.id;
              const cUser = comment?.user ?? comment?.author ?? {};
              const cUserId = comment?.user_id ?? comment?.userId ?? cUser?.id;
              const cUserName =
                getUserFullName(cUser) ||
                cUser?.name ||
                comment?.name ||
                comment?.author_name ||
                t('feedScreen.communityMemberFallback', 'Community Member');
              const cAvatar = getUserAvatarUrl(cUser) || fallbackAvatar;
              const cText = comment?.body || comment?.comment || comment?.text || '';
              const cTime = formatTime(comment?.created_at || comment?.createdAt);

              const isOwnComment = Boolean(
                (currentUserId && cUserId && String(currentUserId) === String(cUserId)) ||
                String(cId).startsWith('temp-')
              );

              const rx = commentReactions[String(cId)];
              const cIsLiked = rx ? rx.liked : Boolean(comment?.liked || comment?.is_liked);
              const cIsDisliked = rx ? rx.disliked : Boolean(comment?.disliked || comment?.is_disliked);
              const cLikes = Math.max(0, Number(comment?.likes_count ?? comment?.likes ?? 0) + (rx?.likesOffset || 0));
              const cDislikes = Math.max(0, Number(comment?.dislikes_count ?? comment?.dislikes ?? 0) + (rx?.dislikesOffset || 0));

              return (
                <div
                  key={cId}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '14px',
                    background: 'var(--bg-card-secondary)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div
                      onClick={() => cUserId && navigate(`/social-profile/${cUserId}`)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        cursor: cUserId ? 'pointer' : 'default',
                      }}
                    >
                      <img
                        src={cAvatar}
                        alt={cUserName}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                        }}
                      />
                      <div>
                        <strong style={{ fontSize: '13.5px', color: 'var(--text-main)', display: 'block' }}>
                          {cUserName}
                        </strong>
                        <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                          {cTime}
                        </span>
                      </div>
                    </div>

                    {isOwnComment ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleEditComment(cId, cText)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '4px',
                          }}
                          title={t('common.edit', 'Edit')}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(cId)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#EF4444',
                            cursor: 'pointer',
                            padding: '4px',
                          }}
                          title={t('common.delete', 'Delete')}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          setReportModalState({
                            visible: true,
                            targetId: cId,
                            targetType: 'comment',
                            targetName: cUserName,
                          })
                        }
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '4px',
                        }}
                        title={t('socialProfile.report', 'Report comment')}
                      >
                        <Flag size={14} />
                      </button>
                    )}
                  </div>

                  <p
                    style={{
                      fontSize: '14px',
                      color: 'var(--text-main)',
                      lineHeight: '1.5',
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {cText}
                  </p>

                  {/* Reaction / Reply bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', paddingTop: '4px' }}>
                    <button
                      type="button"
                      onClick={() => handleCommentReaction(cId, 'like', cIsLiked, cIsDisliked)}
                      style={{
                        background: 'none',
                        border: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: cIsLiked ? '#FF2A54' : 'var(--text-muted)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      <Heart size={14} fill={cIsLiked ? '#FF2A54' : 'none'} />
                      <span>{cLikes}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCommentReaction(cId, 'dislike', cIsLiked, cIsDisliked)}
                      style={{
                        background: 'none',
                        border: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: cIsDisliked ? '#EF4444' : 'var(--text-muted)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      <ThumbsDown size={14} fill={cIsDisliked ? '#EF4444' : 'none'} />
                      <span>{cDislikes}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setReplyingTo({ id: cId, authorName: cUserName });
                        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: 'var(--text-muted)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      <Reply size={14} />
                      <span>{t('feedScreen.reply', 'Reply')}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Reusable Report Modal */}
      <ReportModal
        visible={reportModalState.visible}
        onClose={() => setReportModalState((prev) => ({ ...prev, visible: false }))}
        targetId={reportModalState.targetId}
        targetType={reportModalState.targetType}
        targetName={reportModalState.targetName}
      />
    </Container>
  );
};

export default PostDetail;
