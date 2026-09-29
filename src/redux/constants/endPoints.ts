const endPoints = {
  // Auth
  LOGIN: 'auth/login',
  SIGN_UP: 'auth/register',
  FORGOT_PASSWORD: 'password-reset/send-token',
  VALIDATE_PASSWORD_CODE: 'password-reset/verify-token',
  RESET_PASSWORD: 'password-reset/reset',
  SOCIAL_LOGIN: 'auth/social/login',
  LOGOUT: 'auth/logout',
  VERIFY_OTP: 'auth/verify-otp',
  RESEND_OTP: 'auth/resend-otp',

  // User
  GET_USER: 'user',
  DELETE_USER: 'user/delete-account',
  UPDATE_PROFILE: 'user/update/profile',
  COMPLETE_PROFILE: 'auth/complete-profile',
  GET_ALL_RECEIPTS: 'games/user/receipts',

  //Games
  ALL_GAMES: 'games/get-all-games',
  CASH_N_INSTANT_GAMES: 'games/store-game',
  STREAK_LEADERBOARD: 'games/streak-leaderboard',

  //Polls
  GET_POLLS: 'polls',
  GET_POLL: (pollId: number | string) => `polls/${pollId}`,
  VOTE_POLL: (pollId: number | string) => `polls/${pollId}/vote`,
  GET_POLL_RESULTS: (pollId: number | string) => `polls/${pollId}/results`,

  //Midday Toggle
  MIDDAY_TOGGLE: 'games/midday-status',

  //mini games
  SPIN_THE_WHEEL: 'games/play-mini-game/spin-the-wheel',
  LUCKY_7: 'games/play-mini-game/lucky-7',
  SCRATCH_2_WIN: 'games/play-mini-game/scratch-2-win',
  UNLOCKED_MINI_GAMES: 'unlocked-mini-games',
  UNLOCK_MINI_GAME: 'unlock-mini-game',

  //Wallet
  GET_WALLET: 'wallet/get-wallet',
  ADD_POINTS: 'wallet/add-points',

  //rewards
  ALL_REWARDS: 'rewards/get-all-rewards',
  CLAIM_REWARD: 'rewards/claim-reward',
  REVIEW_REWARD: 'user/review-reward',

  //winners
  WINNERS: 'winners',

  //Results
  RESULTS: (gameslug: string) => `results/${gameslug}`, //gameslug is a path segment, not a query param (verified against live API)

  //Campaigns
  MY_CAMPAIGNS: 'campaigns/my-campaigns',
  GET_CAMPAIGNS: 'campaigns',
  STORE_CAMPAIGN: 'campaigns',
  INCREMENT_VIEWS: 'campaigns/increment-views',
  INCREMENT_CLICKS: 'campaigns/increment-clicks',
  RENEW_CAMPAIGN: 'campaigns/renew',

  //Campaign Locations
  ALL_STATES: 'locations/states',
  ALL_CITIES: 'locations/cities', //use stateid as query param
  ALL_ZIPCODES: 'locations/zip-codes', //use cityid as query param
  CITIES_WITH_ZIPS: 'locations/cities-with-zips',

  //Funds
  GET_FUNDS: 'funds',
  ADD_FUNDS_PAYPAL: 'funds/paypal/create',

  //notifications
  SAVE_FCM_TOKEN: 'user/save-fcm-token',
  GET_NOTIFICATIONS: 'notifications',
  GET_UNREAD_NOTIFICATIONS: 'notifications/unread',
  GET_UNREAD_NOTIFICATIONS_COUNT: 'notifications/unread-count',
  MARK_READ: (notificationId: string | number) =>
    `notifications/${notificationId}/read`,
  MARK_ALL_AS_READ: 'notifications/mark-all-read',
  DELETE_NOTIFICATION: (notificationId: string | number) =>
    `notifications/${notificationId}`,
  CLEAR_ALL_NOTIFICATIONS: 'notifications/clear-all',

  // Feed & Posts
  GET_FEED: 'feed',
  CREATE_POST: 'feed/posts',
  FEED_POSTS: 'feed/posts',
  UPDATE_POST: (postId: number | string) => `feed/posts/${postId}`,
  DELETE_POST: (postId: number | string) => `feed/posts/${postId}`,
  LIKE_POST: (postId: number | string) => `feed/posts/${postId}/like`,
  DISLIKE_POST: (postId: number | string) => `feed/posts/${postId}/dislike`,
  CREATE_COMMENT: (postId: number | string) => `feed/posts/${postId}/comments`,
  UPDATE_COMMENT: (commentId: number | string) =>
    `feed/comments/${commentId}/update`,
  DELETE_COMMENT: (commentId: number | string) =>
    `feed/comments/${commentId}/delete`,
  LIKE_COMMENT: (commentId: number | string) =>
    `feed/comments/${commentId}/like`,
  DISLIKE_COMMENT: (commentId: number | string) =>
    `feed/comments/${commentId}/dislike`,
  GET_COMMENT_LIKES: (commentId: number | string) =>
    `feed/comments/${commentId}/likes`,
  TOGGLE_FOLLOW: (userId: number | string) => `feed/follow/${userId}`,
  UNFOLLOW_USER: (userId: number | string) => `feed/follow/${userId}`,
  REMOVE_FOLLOWER: (userId: number | string) => `feed/followers/${userId}`,
  REPORT_POST: (postId: number | string) => `feed/posts/${postId}/report`,
  REPORT_USER: (userId: number | string) => `feed/accounts/${userId}/report`,
  REPORT_COMMENT: (commentId: number | string) =>
    `feed/comments/${commentId}/report`,
  GET_FEED_USER: (userId: number | string) => `feed/users/${userId}`,
  GET_FOLLOWS: (userId?: number | string) =>
    userId ? `feed/follows/${userId}` : 'feed/follows',
  GET_POST_LIKES: (postId: number | string) => `feed/posts/${postId}/likes`,
};

export default Object.freeze(endPoints);
