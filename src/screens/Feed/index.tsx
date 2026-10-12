import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import {
  Flag,
  Heart,
  Image as ImageIcon,
  Loader2,
  MessageCircle,
  Pencil,
  Plus,
  Reply,
  Send,
  ThumbsDown,
  Trash2,
  UserCheck,
  UserPlus,
  Video,
  X,
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
  toggleFollowUser,
  toggleFollowUserOptimistic,
  togglePostLikeOptimistic,
  updateComment,
  updatePost,
} from '../../redux/Slices/feedSlice';
import { Container, CustomModal, ReportModal, showToast } from '../../components';
import feedServices from '../../services/feedServices';
import pollServices from '../../services/pollServices';
import { confirmAppAction, promptAppInput } from '../../utils/sweetAlert';

type FeedComment = {
  id: string | number;
  user: string;
  userId?: string | number;
  text: string;
  likes: number;
  dislikes: number;
  liked?: boolean;
  disliked?: boolean;
  parentId?: string | number;
  replies?: FeedComment[];
};

type FeedPost = {
  id: string | number;
  author: string;
  avatar: string;
  time: string;
  content: string;
  image?: string;
  media_type?: string;
  likes: number;
  liked: boolean;
  userId?: string | number;
  isFollowing?: boolean;
  comments: FeedComment[];
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

const normalizeComment = (comment: any, t: TranslateFn): FeedComment => {
  const user = comment?.user ?? comment?.author ?? {};
  const userId = comment?.user_id ?? comment?.userId ?? user?.id ?? comment?.author_id;
  const parentId = comment?.parent_id ?? comment?.parentId;
  const rawReplies = Array.isArray(comment?.replies) ? comment.replies : [];
  const replies = rawReplies.map((r: any) => normalizeComment(r, t));

  return {
    id: comment?.id ?? `comment-${Math.random()}`,
    user:
      getDisplayName(user) ??
      comment?.name ??
      comment?.author_name ??
      t('feedScreen.communityMemberFallback', 'Community Member'),
    userId,
    text: comment?.body ?? comment?.comment ?? comment?.text ?? '',
    likes: Number(comment?.likes_count ?? comment?.likes ?? 0),
    dislikes: Number(comment?.dislikes_count ?? comment?.dislikes ?? 0),
    liked: Boolean(comment?.liked ?? comment?.is_liked ?? comment?.isLiked),
    disliked: Boolean(comment?.disliked ?? comment?.is_disliked ?? comment?.isDisliked),
    parentId,
    replies,
  };
};

const isVideoUrl = (url?: string, type?: string) => {
  if (!url) return false;
  if (type === 'video') return true;
  return /\.(mp4|mov|webm|m4v|ogg)(\?.*)?$/i.test(url);
};

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
  const media_type = post?.media_type ?? (isVideoUrl(image) ? 'video' : 'image');

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
    media_type,
    likes: Number(post?.likes_count ?? post?.likes ?? post?.reactions_count ?? 0),
    liked: Boolean(post?.liked ?? post?.is_liked ?? post?.isLiked),
    userId: user?.id ?? post?.user_id ?? post?.userId,
    isFollowing: Boolean(
      user?.is_following ??
      user?.is_followed ??
      post?.is_following ??
      post?.is_followed,
    ),
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

  const currentUser = useSelector((state: RootState) => state.user?.userData);
  const currentUserId = currentUser?.id ?? currentUser?._id;

  const {
    feedList,
    feedLoading,
    feedError,
    likeLoadingMap,
    commentLoadingMap,
    updatePostLoading,
    toggleFollowLoadingMap,
  } = useSelector((state: RootState) => state.feed);

  const [activeCommentPostId, setActiveCommentPostId] = useState<string | number | null>(null);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string | number; user: string } | null>(null);
  const [commentReactions, setCommentReactions] = useState<
    Record<string, { liked: boolean; disliked: boolean; likesOffset: number; dislikesOffset: number }>
  >({});
  const [poll, setPoll] = useState<CommunityPoll | null>(null);
  const [selectedPollOption, setSelectedPollOption] = useState<string | number | null>(null);
  const [pollLoading, setPollLoading] = useState(false);

  // Edit Post state
  const [editingPost, setEditingPost] = useState<FeedPost | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editMediaPreview, setEditMediaPreview] = useState<string | null>(null);
  const [editMediaFile, setEditMediaFile] = useState<File | null>(null);
  const [editRemoveMedia, setEditRemoveMedia] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement | null>(null);
  // Floating New Post button visibility (only visible when scrolled down; hides when at top)
  const [showFloatingNewPost, setShowFloatingNewPost] = useState(false);
  const [reportModalState, setReportModalState] = useState<{
    visible: boolean;
    targetId: string | number;
    targetType: 'post' | 'comment' | 'account';
    targetName?: string;
  }>({
    visible: false,
    targetId: '',
    targetType: 'post',
    targetName: '',
  });
  const headerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (headerRef.current) {
        const rect = headerRef.current.getBoundingClientRect();
        setShowFloatingNewPost(rect.bottom < 60);
      } else {
        setShowFloatingNewPost(window.scrollY > 80);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    [dispatch, likeLoadingMap, refreshFeed, t],
  );

  const handleFollowUser = useCallback(
    async (targetUserId: string | number, currentlyFollowing: boolean) => {
      if (!targetUserId) return;
      dispatch(toggleFollowUserOptimistic({ userId: targetUserId, isFollowing: !currentlyFollowing }));
      try {
        if (currentlyFollowing) {
          await feedServices.unfollowUser(targetUserId);
        } else {
          await dispatch(toggleFollowUser(targetUserId)).unwrap();
        }
        refreshFeed();
      } catch (error: any) {
        dispatch(toggleFollowUserOptimistic({ userId: targetUserId, isFollowing: currentlyFollowing }));
        showToast({
          type: 'error',
          text1: t('socialProfile.followNotSaved', 'Follow not saved'),
          text2: error?.message || String(error || t('socialProfile.tryAgain', 'Please try again.')),
        });
      }
    },
    [dispatch, refreshFeed, t],
  );

  const handleOpenEdit = useCallback((post: FeedPost) => {
    setEditingPost(post);
    setEditDescription(post.content || '');
    setEditMediaPreview(post.image || null);
    setEditMediaFile(null);
    setEditRemoveMedia(false);
  }, []);

  const handleCloseEdit = useCallback(() => {
    if (editMediaPreview && editMediaFile) {
      URL.revokeObjectURL(editMediaPreview);
    }
    setEditingPost(null);
    setEditDescription('');
    setEditMediaPreview(null);
    setEditMediaFile(null);
    setEditRemoveMedia(false);
    if (editFileInputRef.current) {
      editFileInputRef.current.value = '';
    }
  }, [editMediaFile, editMediaPreview]);

  const handleEditImageSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        if (editMediaPreview && editMediaFile) {
          URL.revokeObjectURL(editMediaPreview);
        }
        setEditMediaFile(file);
        setEditMediaPreview(URL.createObjectURL(file));
        setEditRemoveMedia(false);
      }
    },
    [editMediaFile, editMediaPreview],
  );

  const handleRemoveEditImage = useCallback(() => {
    if (editMediaPreview && editMediaFile) {
      URL.revokeObjectURL(editMediaPreview);
    }
    setEditMediaFile(null);
    setEditMediaPreview(null);
    setEditRemoveMedia(true);
    if (editFileInputRef.current) {
      editFileInputRef.current.value = '';
    }
  }, [editMediaFile, editMediaPreview]);

  const handleSaveEdit = useCallback(async () => {
    if (!editingPost) return;
    if (!editDescription.trim() && !editMediaPreview && !editMediaFile) {
      showToast({
        type: 'error',
        text1: t('createPost.postEmpty', 'Post cannot be empty'),
      });
      return;
    }

    try {
      if (editMediaFile) {
        const formData = new FormData();
        formData.append('description', editDescription.trim());
        formData.append('media', editMediaFile, editMediaFile.name || `post_media_${Date.now()}.jpg`);
        await dispatch(updatePost({ postId: editingPost.id, payload: formData })).unwrap();
      } else if (editRemoveMedia) {
        const formData = new FormData();
        formData.append('description', editDescription.trim());
        formData.append('remove_media', '1');
        await dispatch(updatePost({ postId: editingPost.id, payload: formData })).unwrap();
      } else {
        await dispatch(
          updatePost({
            postId: editingPost.id,
            payload: { description: editDescription.trim() },
          }),
        ).unwrap();
      }

      showToast({
        type: 'success',
        text1: t('feedScreen.toast.postUpdatedTitle', 'Post updated'),
      });
      handleCloseEdit();
      refreshFeed();
    } catch (error: any) {
      showToast({
        type: 'error',
        text1: t('feedScreen.toast.postNotUpdatedTitle', 'Post not updated'),
        text2: error?.message || String(error || t('feedScreen.toast.tryAgain', 'Please try again.')),
      });
    }
  }, [
    dispatch,
    editDescription,
    editMediaFile,
    editMediaPreview,
    editRemoveMedia,
    editingPost,
    handleCloseEdit,
    refreshFeed,
    t,
  ]);

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
    [activeCommentPostId, dispatch, refreshFeed, t],
  );

  const handleReportPost = useCallback(
    (postId: string | number, authorName?: string) => {
      setReportModalState({
        visible: true,
        targetId: postId,
        targetType: 'post',
        targetName: authorName,
      });
    },
    [],
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
        refreshFeed();
      } catch (error: any) {
        showToast({
          type: 'error',
          text1: t('feedScreen.toast.commentNotUpdatedTitle', 'Comment not updated'),
          text2: error?.message || String(error || t('feedScreen.toast.tryAgain', 'Please try again.')),
        });
      }
    },
    [dispatch, refreshFeed, t],
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
        refreshFeed();
      } catch (error: any) {
        showToast({
          type: 'error',
          text1: t('feedScreen.toast.commentNotDeletedTitle', 'Comment not deleted'),
          text2: error?.message || String(error || t('feedScreen.toast.tryAgain', 'Please try again.')),
        });
      }
    },
    [dispatch, refreshFeed, t],
  );

  const handleCommentReaction = useCallback(
    async (
      commentId: string | number,
      reaction: 'like' | 'dislike',
      initialLiked = false,
      initialDisliked = false,
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

      setCommentReactions((current) => ({
        ...current,
        [key]: {
          liked: nextLiked,
          disliked: nextDisliked,
          likesOffset: nextLikesOffset,
          dislikesOffset: nextDislikesOffset,
        },
      }));

      try {
        await dispatch(
          reaction === 'like' ? likeComment(commentId) : dislikeComment(commentId),
        ).unwrap();
        refreshFeed();
      } catch (error: any) {
        setCommentReactions((current) => ({
          ...current,
          [key]: prev,
        }));
        showToast({
          type: 'error',
          text1: t('feedScreen.toast.commentReactionNotSavedTitle', 'Comment reaction not saved'),
          text2: error?.message || String(error || t('feedScreen.toast.tryAgain', 'Please try again.')),
        });
      }
    },
    [commentReactions, dispatch, refreshFeed, t],
  );

  const handleReportComment = useCallback(
    (commentId: string | number, authorName?: string) => {
      if (String(commentId).startsWith('temp-')) return;
      setReportModalState({
        visible: true,
        targetId: commentId,
        targetType: 'comment',
        targetName: authorName,
      });
    },
    [],
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
    [poll, selectedPollOption, t],
  );

  const handleAddComment = useCallback(async () => {
    const body = commentText.trim();
    if (!body || !activeCommentPostId) return;

    const parentId = replyingTo?.id;
    const tempComment = {
      id: `temp-${Date.now()}`,
      body,
      user: { name: t('feedScreen.you', 'You'), id: currentUserId },
      user_id: currentUserId,
      parent_id: parentId,
    };

    dispatch(addCommentOptimistic({ postId: activeCommentPostId, comment: tempComment }));
    setCommentText('');
    setReplyingTo(null);

    try {
      await dispatch(
        createComment({
          postId: activeCommentPostId,
          payload: { body, parent_id: parentId },
        }),
      ).unwrap();
      showToast({ type: 'success', text1: t('feedScreen.toast.commentPostedTitle', 'Comment posted!') });
      dispatch(fetchFeed({ params: { per_page: 15, page: 1 }, isRefresh: true }));
    } catch (error: any) {
      showToast({
        type: 'error',
        text1: t('feedScreen.toast.commentNotSavedTitle', 'Comment not saved'),
        text2: error?.message || String(error || t('feedScreen.toast.tryAgain', 'Please try again.')),
      });
      dispatch(fetchFeed({ params: { per_page: 15, page: 1 }, isRefresh: true }));
    }
  }, [activeCommentPostId, commentText, currentUserId, dispatch, replyingTo, t]);

  return (
    <Container maxWidth="640px" style={{ gap: '20px', paddingBottom: '40px' }}>
      {/* Top Header Row (Title, Subtitle & Regular New Post Button) */}
      <div className="feed-header-wrap" ref={headerRef}>
        <div className="feed-header-text">
          <h1 className="feed-header-title">
            {t('feedScreen.title', 'Community Feed')}
          </h1>
          <p className="feed-header-subtitle">
            {t('feedScreen.subtitle', 'Share shopping hauls, vote on polls & see winner receipts!')}
          </p>
        </div>

        <button
          onClick={() => navigate('/feed/create')}
          className="btn-primary feed-new-post-btn"
        >
          <Plus size={16} />
          <span>{t('feedScreen.createPost', 'New Post')}</span>
        </button>
      </div>

      {/* Floating Sticky New Post Button (Only appears when scrolled down; hides when at top) */}
      <button
        onClick={() => navigate('/feed/create')}
        className={`btn-primary feed-floating-btn ${showFloatingNewPost ? 'feed-floating-btn--visible' : ''}`}
        aria-label={t('feedScreen.createPost', 'New Post')}
      >
        <Plus size={18} />
        <span>{t('feedScreen.createPost', 'New Post')}</span>
      </button>

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

        {posts.map((post) => {
          const isOwnPost = Boolean(
            currentUserId && post.userId && String(currentUserId) === String(post.userId),
          );

          return (
            <div
              key={post.id}
              className="card"
              style={{
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <button
                  onClick={() => post.userId && navigate(`/social-profile/${post.userId}`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    border: 'none',
                    background: 'transparent',
                    padding: 0,
                    cursor: post.userId ? 'pointer' : 'default',
                    textAlign: 'left',
                    minWidth: 0,
                    flex: 1,
                  }}
                >
                  <img
                    src={post.avatar}
                    alt={post.author}
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <h4
                      style={{
                        fontSize: '15px',
                        fontWeight: 700,
                        color: 'var(--text-main)',
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {post.author}
                    </h4>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {post.time}
                    </span>
                  </div>
                </button>

                {/* Post Header Action: Edit & Delete for own post; Follow button for others */}
                {isOwnPost ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <button
                      onClick={() => handleOpenEdit(post)}
                      title={t('feedScreen.editPostLabel', 'Edit post')}
                      style={{
                        width: '32px',
                        height: '32px',
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
                      onClick={() => handleDeletePost(post.id)}
                      title={t('feedScreen.deletePostLabel', 'Delete post')}
                      style={{
                        width: '32px',
                        height: '32px',
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
                ) : post.userId ? (
                  <button
                    onClick={() => handleFollowUser(post.userId!, Boolean(post.isFollowing))}
                    disabled={Boolean(toggleFollowLoadingMap[String(post.userId)])}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 700,
                      border: post.isFollowing ? '1px solid var(--border-color)' : 'none',
                      background: post.isFollowing ? 'var(--bg-card-secondary)' : 'var(--green)',
                      color: post.isFollowing ? 'var(--text-muted)' : '#ffffff',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      flexShrink: 0,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {post.isFollowing ? (
                      <>
                        <UserCheck size={14} />
                        <span>{t('socialProfile.following', 'Following')}</span>
                      </>
                    ) : (
                      <>
                        <UserPlus size={14} />
                        <span>{t('socialProfile.follow', 'Follow')}</span>
                      </>
                    )}
                  </button>
                ) : null}
              </div>

              {post.content && (
                <div
                  style={{
                    padding: !post.image ? '14px 18px' : '0',
                    background: !post.image ? 'var(--bg-card-secondary)' : 'transparent',
                    borderRadius: !post.image ? '14px' : '0',
                    border: !post.image ? '1px solid var(--border-color)' : 'none',
                  }}
                >
                  <p
                    style={{
                      fontSize: !post.image ? '15.5px' : '14px',
                      fontWeight: !post.image ? 500 : 400,
                      color: 'var(--text-main)',
                      lineHeight: '1.6',
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {post.content}
                  </p>
                </div>
              )}

              {post.image && (
                <div
                  style={{
                    width: '100%',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    background: 'var(--bg-card-secondary)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  {isVideoUrl(post.image, post.media_type) ? (
                    <video
                      src={post.image}
                      controls
                      playsInline
                      preload="metadata"
                      style={{
                        width: '100%',
                        maxHeight: '440px',
                        display: 'block',
                        background: '#000000',
                      }}
                    />
                  ) : (
                    <img
                      src={post.image}
                      alt={t('feedScreen.postAttachmentAlt', 'Post attachment')}
                      style={{
                        width: '100%',
                        maxHeight: '380px',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  )}
                </div>
              )}

              {/* Post Footer Action Bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  paddingTop: '10px',
                  borderTop: '1px solid var(--border-color)',
                }}
              >
                {/* Like Button: Heart on top, Count underneath */}
                <button
                  onClick={() => handleLike(post)}
                  disabled={Boolean(likeLoadingMap[String(post.id)])}
                  style={{
                    background: 'none',
                    border: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '2px',
                    cursor: 'pointer',
                    color: post.liked ? '#EF4444' : 'var(--text-muted)',
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '4px 8px',
                    borderRadius: '8px',
                  }}
                >
                  <Heart size={20} fill={post.liked ? '#EF4444' : 'none'} color={post.liked ? '#EF4444' : 'currentColor'} />
                  <span>{post.likes}</span>
                </button>

                {/* Comments Button */}
                <button
                  onClick={() => {
                    setActiveCommentPostId(post.id);
                    setReplyingTo(null);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '2px',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '4px 8px',
                    borderRadius: '8px',
                  }}
                >
                  <MessageCircle size={20} />
                  <span>{post.comments.length}</span>
                </button>

                {/* Report button for other users' posts only (replaces Share button) */}
                {!isOwnPost && (
                  <button
                    onClick={() => handleReportPost(post.id, post.author)}
                    title={t('feedScreen.reportPostLabel', 'Report post')}
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
                    <Flag size={18} />
                    <span>{t('socialProfile.report', 'Report')}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <CustomModal
        visible={Boolean(activeCommentPostId)}
        onClose={() => {
          setActiveCommentPostId(null);
          setReplyingTo(null);
          setCommentText('');
        }}
        title={t('feedScreen.comments.modalTitle', 'Post Comments')}
        maxWidth="480px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '440px', overflowY: 'auto' }}>
          {selectedPost?.comments.length === 0 && (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', margin: '16px 0' }}>
              {t('feedScreen.comments.emptyState', 'No comments yet. Be the first to comment!')}
            </p>
          )}

          {selectedPost?.comments.map((comment) => {
            const isOwnComment = Boolean(
              (currentUserId && comment.userId && String(currentUserId) === String(comment.userId)) ||
                String(comment.id).startsWith('temp-'),
            );

            const cRx = commentReactions[String(comment.id)];
            const cIsLiked = cRx ? cRx.liked : comment.liked;
            const cIsDisliked = cRx ? cRx.disliked : comment.disliked;
            const cLikesCount = Math.max(0, comment.likes + (cRx?.likesOffset || 0));
            const cDislikesCount = Math.max(0, comment.dislikes + (cRx?.dislikesOffset || 0));

            return (
              <div
                key={comment.id}
                style={{
                  padding: '12px 14px',
                  borderRadius: '14px',
                  background: 'var(--bg-card-secondary)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>{comment.user}</strong>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-main)', margin: 0, lineHeight: '1.4' }}>{comment.text}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                  {isOwnComment ? (
                    <>
                      {/* User's own comment: Edit and Delete */}
                      <button
                        onClick={() => handleEditComment(comment.id, comment.text)}
                        title={t('feedScreen.comments.editLabel', 'Edit comment')}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '2px 6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '12px',
                        }}
                      >
                        <Pencil size={13} />
                        <span>{t('feedScreen.comments.editLabel', 'Edit')}</span>
                      </button>
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        title={t('feedScreen.comments.deleteLabel', 'Delete comment')}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#EF4444',
                          cursor: 'pointer',
                          padding: '2px 6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '12px',
                          marginLeft: 'auto',
                        }}
                      >
                        <Trash2 size={13} />
                        <span>{t('feedScreen.dialogs.deleteButton', 'Delete')}</span>
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Others' comment: Like, Dislike, Reply, Report */}
                      <button
                        onClick={() => handleCommentReaction(comment.id, 'like', comment.liked, comment.disliked)}
                        title={t('feedScreen.comments.likeLabel', 'Like comment')}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: cIsLiked ? '#EF4444' : 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          padding: '2px 4px',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <Heart
                          size={14}
                          fill={cIsLiked ? '#EF4444' : 'none'}
                          color={cIsLiked ? '#EF4444' : 'currentColor'}
                        />
                        <span style={{ fontWeight: cIsLiked ? 800 : 500 }}>{cLikesCount}</span>
                      </button>
                      <button
                        onClick={() => handleCommentReaction(comment.id, 'dislike', comment.liked, comment.disliked)}
                        title={t('feedScreen.comments.dislikeLabel', 'Dislike comment')}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: cIsDisliked ? '#F59E0B' : 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          padding: '2px 4px',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <ThumbsDown
                          size={14}
                          fill={cIsDisliked ? '#F59E0B' : 'none'}
                          color={cIsDisliked ? '#F59E0B' : 'currentColor'}
                        />
                        <span style={{ fontWeight: cIsDisliked ? 800 : 500 }}>{cDislikesCount}</span>
                      </button>
                      <button
                        onClick={() => {
                          setReplyingTo({ id: comment.id, user: comment.user });
                        }}
                        title={t('feedScreen.comments.replyLabel', 'Reply')}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          padding: '2px 6px',
                        }}
                      >
                        <Reply size={13} />
                        <span>{t('feedScreen.comments.replyLabel', 'Reply')}</span>
                      </button>
                      <button
                        onClick={() => handleReportComment(comment.id, comment.user)}
                        title={t('feedScreen.comments.reportLabel', 'Report comment')}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '2px 6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '12px',
                          marginLeft: 'auto',
                        }}
                      >
                        <Flag size={13} />
                        <span>{t('socialProfile.report', 'Report')}</span>
                      </button>
                    </>
                  )}
                </div>

                {/* Nested Replies under this comment (User Request 2) */}
                {comment.replies && comment.replies.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      marginTop: '8px',
                      paddingLeft: '14px',
                      borderLeft: '2px solid rgba(0, 153, 68, 0.35)',
                    }}
                  >
                    {comment.replies.map((reply) => {
                      const isOwnReply = Boolean(
                        (currentUserId && reply.userId && String(currentUserId) === String(reply.userId)) ||
                          String(reply.id).startsWith('temp-'),
                      );
                      const rRx = commentReactions[String(reply.id)];
                      const rIsLiked = rRx ? rRx.liked : reply.liked;
                      const rIsDisliked = rRx ? rRx.disliked : reply.disliked;
                      const rLikesCount = Math.max(0, reply.likes + (rRx?.likesOffset || 0));
                      const rDislikesCount = Math.max(0, reply.dislikes + (rRx?.dislikesOffset || 0));

                      return (
                        <div
                          key={reply.id}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '10px',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-color)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '3px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <strong style={{ fontSize: '12px', color: 'var(--text-main)' }}>{reply.user}</strong>
                          </div>
                          <p style={{ fontSize: '12.5px', color: 'var(--text-main)', margin: 0, lineHeight: '1.4' }}>
                            {reply.text}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                            {isOwnReply ? (
                              <>
                                <button
                                  onClick={() => handleEditComment(reply.id, reply.text)}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--text-muted)',
                                    cursor: 'pointer',
                                    padding: 0,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    fontSize: '11px',
                                  }}
                                >
                                  <Pencil size={11} />
                                  <span>{t('feedScreen.comments.editLabel', 'Edit')}</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteComment(reply.id)}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#EF4444',
                                    cursor: 'pointer',
                                    padding: 0,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    fontSize: '11px',
                                    marginLeft: 'auto',
                                  }}
                                >
                                  <Trash2 size={11} />
                                  <span>{t('feedScreen.dialogs.deleteButton', 'Delete')}</span>
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleCommentReaction(reply.id, 'like', reply.liked, reply.disliked)}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: rIsLiked ? '#EF4444' : 'var(--text-muted)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    cursor: 'pointer',
                                    fontSize: '11px',
                                    padding: 0,
                                  }}
                                >
                                  <Heart
                                    size={13}
                                    fill={rIsLiked ? '#EF4444' : 'none'}
                                    color={rIsLiked ? '#EF4444' : 'currentColor'}
                                  />
                                  <span style={{ fontWeight: rIsLiked ? 800 : 500 }}>{rLikesCount}</span>
                                </button>
                                <button
                                  onClick={() => handleCommentReaction(reply.id, 'dislike', reply.liked, reply.disliked)}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: rIsDisliked ? '#F59E0B' : 'var(--text-muted)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    cursor: 'pointer',
                                    fontSize: '11px',
                                    padding: 0,
                                  }}
                                >
                                  <ThumbsDown
                                    size={13}
                                    fill={rIsDisliked ? '#F59E0B' : 'none'}
                                    color={rIsDisliked ? '#F59E0B' : 'currentColor'}
                                  />
                                  <span style={{ fontWeight: rIsDisliked ? 800 : 500 }}>{rDislikesCount}</span>
                                </button>
                                <button
                                  onClick={() => handleReportComment(reply.id)}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--text-muted)',
                                    cursor: 'pointer',
                                    padding: 0,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    fontSize: '11px',
                                    marginLeft: 'auto',
                                  }}
                                >
                                  <Flag size={11} />
                                  <span>{t('socialProfile.report', 'Report')}</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Replying banner indicator */}
          {replyingTo && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 12px',
                borderRadius: '8px',
                background: 'rgba(0, 103, 77, 0.1)',
                border: '1px solid rgba(0, 103, 77, 0.25)',
                fontSize: '12px',
                color: 'var(--text-main)',
              }}
            >
              <span>
                Replying to <strong>@{replyingTo.user}</strong>
              </span>
              <button
                onClick={() => setReplyingTo(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0,
                }}
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Comment input row */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <input
              type="text"
              className="form-input"
              placeholder={
                replyingTo
                  ? `Reply to @${replyingTo.user}...`
                  : t('feedScreen.comments.placeholder', 'Write a comment...')
              }
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

      <CustomModal
        visible={Boolean(editingPost)}
        onClose={handleCloseEdit}
        title={t('feedScreen.editPostLabel', 'Edit post')}
        maxWidth="540px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
              {t('feedScreen.dialogs.postTextLabel', 'Post text')}
            </label>
            <textarea
              rows={4}
              className="form-input"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder={t(
                'createPost.sharePlaceholder',
                'Share your shopping deals, winning receipts, or questions with the community...',
              )}
              style={{ resize: 'vertical', width: '100%', minHeight: '100px' }}
            />
          </div>

          {editMediaPreview && (
            <div
              style={{
                position: 'relative',
                width: '100%',
                maxHeight: '280px',
                borderRadius: '14px',
                overflow: 'hidden',
                border: '1px solid var(--border-color)',
                background: '#000',
              }}
            >
              {isVideoUrl(editMediaPreview, editMediaFile?.type) ? (
                <video
                  src={editMediaPreview}
                  controls
                  playsInline
                  style={{ width: '100%', maxHeight: '280px', display: 'block', background: '#000' }}
                />
              ) : (
                <img
                  src={editMediaPreview}
                  alt={t('createPost.previewImageAlt', 'Preview')}
                  style={{ width: '100%', maxHeight: '260px', objectFit: 'cover', display: 'block' }}
                />
              )}
              <button
                type="button"
                onClick={handleRemoveEditImage}
                title={t('feedScreen.removeImage', 'Remove photo')}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: 'rgba(0, 0, 0, 0.65)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={16} />
              </button>
            </div>
          )}

          <input
            type="file"
            ref={editFileInputRef}
            accept="image/*,video/*"
            style={{ display: 'none' }}
            onChange={handleEditImageSelect}
          />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '12px',
              borderTop: '1px solid var(--border-color)',
              gap: '10px',
              flexWrap: 'wrap',
              width: '100%',
            }}
          >
            <button
              type="button"
              className="btn-secondary"
              onClick={() => editFileInputRef.current?.click()}
              style={{
                padding: '8px 12px',
                fontSize: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
              }}
            >
              <ImageIcon size={15} />
              <Video size={15} />
              <span>
                {editMediaPreview
                  ? t('feedScreen.changeMedia', 'Change Media')
                  : t('createPost.addMedia', 'Add Photo / Video')}
              </span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleCloseEdit}
                style={{ padding: '8px 14px', fontSize: '12px', whiteSpace: 'nowrap' }}
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleSaveEdit}
                disabled={updatePostLoading}
                style={{
                  padding: '8px 16px',
                  fontSize: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                }}
              >
                {updatePostLoading && <Loader2 size={14} className="animate-spin" />}
                <span>{t('feedScreen.dialogs.updatePostButton', 'Update post')}</span>
              </button>
            </div>
          </div>
        </div>
      </CustomModal>

      {/* Reusable Report Modal Bottom Sheet matching mobile design */}
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

export default Feed;
