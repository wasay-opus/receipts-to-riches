import { images } from '../constants';
import NavigationStrings from '../navigation/NavigationStrings';

export const screenConfig = {
  change: {
    title: 'Password Change',
    showCurrentPassword: true,
    buttonText: 'Update',
    showHeading: false,
  },
  set_new: {
    title: '',
    showCurrentPassword: false,
    buttonText: 'Continue',
    showHeading: true,
    headingText: 'Set New',
    headingGreen: 'Password',
    subText:
      'In order to change password you need to enter the current password',
  },
};

export const menuItems = [
  {
    id: 1,
    label: 'Edit Profile',
    icon: images.Profile,
    navigateTo: NavigationStrings.PERSONAL_INFO,
  },
  {
    id: 2,
    label: 'Change Password',
    icon: images.ChangePassword,
    navigateTo: NavigationStrings.PASSWORD_SCREEN,
    params: { type: 'change' },
  },
  {
    id: 3,
    label: 'My Receipts',
    icon: images.receipt,
    navigateTo: NavigationStrings.MY_RECEIPTS,
    params: { type: 'change' },
  },
  {
    id: 4,
    label: 'About us',
    icon: images.AboutIcon,
    navigateTo: NavigationStrings.ABOUT_US,
  },
  {
    id: 5,
    label: 'Explain Video',
    icon: images.VideoIcon,
    navigateTo: NavigationStrings.GUIDE_VIDEO,
    params: {
      fromProfile: true,
    },
  },
  {
    id: 6,
    label: 'Rules',
    icon: images.RulesIcon,
    navigateTo: NavigationStrings.RULES,
  },
  {
    id: 7,
    label: 'Privacy Policy',
    icon: images.PrivacyPolicy,
    navigateTo: NavigationStrings.PRIVACY_POLICY,
  },
  {
    id: 8,
    label: 'Terms & Conditions',
    icon: images.Terms,
    navigateTo: NavigationStrings.TERMS_N_CONDITION,
  },
  {
    id: 9,
    label: 'Help & Support',
    icon: images.SupportIcon,
    navigateTo: NavigationStrings.HELP_N_SUPPORT,
  },
  {
    id: 10,
    label: 'Languages',
    icon: images.language,
    navigateTo: NavigationStrings.LANGUAGES,
  },
  {
    id: 11,
    label: 'Manage Campaigns',
    icon: images.campaign,
    navigateTo: NavigationStrings.MANAGE_CAMPAIGNS,
  },
];

export const RULE_TABS = ['Cash Game Rule', 'Instant Game', 'Lucky 7'];

export const RULES_DATA: Record<
  string,
  { id: string; title: string; content: string }[]
> = {
  'Cash Game Rule': [
    {
      id: '1',
      title: 'Game Rule 1',
      content:
        ' This is dummy copy. It is not meant to be read. It has been placed here solely to demonstrate the look and feel of finished, typeset text. Only for show. He who searches for meaning here will be sorely disappointed.',
    },
    {
      id: '2',
      title: 'Game Rule 2',
      content:
        'This is dummy copy. It is not meant to be read. It has been placed here solely to demonstrate the look and feel of finished, typeset text. Only for show. He who searches for meaning here will be sorely disappointed.',
    },
    {
      id: '3',
      title: 'Game Rule 3',
      content:
        'This is dummy copy. It is not meant to be read. It has been placed here solely to demonstrate the look and feel of finished, typeset text. Only for show. He who searches for meaning here will be sorely disappointed.',
    },
  ],
  'Instant Game': [
    {
      id: '1',
      title: 'Instant Rule 1',
      content: 'Instant Game Rule 1 details go here.',
    },
    {
      id: '2',
      title: 'Instant Rule 2',
      content: 'Instant Game Rule 2 details go here.',
    },
  ],
  'Lucky 7': [
    {
      id: '1',
      title: 'Lucky Rule 1',
      content: 'Lucky 7 Rule 1 details go here.',
    },
    {
      id: '2',
      title: 'Lucky Rule 2',
      content: 'Lucky 7 Rule 2 details go here.',
    },
  ],
};

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  section: string;
};

// export const allNotifications: NotificationItem[] = [
//   {
//     id: '1',
//     title: 'You have won $10.00 in instant...',
//     message: 'Check your winning detail....',
//     time: '08:15',
//     isRead: false,
//     section: 'Today',
//   },
//   {
//     id: '2',
//     title: 'Please rate this app...',
//     message: 'waiting for your review....',
//     time: '08:15',
//     isRead: true,
//     section: 'Today',
//   },
//   {
//     id: '3',
//     title: 'System update',
//     message: 'time to update your app....',
//     time: '08:15',
//     isRead: true,
//     section: 'Today',
//   },
//   {
//     id: '4',
//     title: 'Please change your pass...',
//     message: 'We have found suspicious....',
//     time: '08:15',
//     isRead: true,
//     section: 'Today',
//   },
//   {
//     id: '5',
//     title: 'You have won $10.00 in Lucky...',
//     message: 'Check your winning detail....',
//     time: '08:15',
//     isRead: false,
//     section: 'Today',
//   },
//   {
//     id: '6',
//     title: 'Please rate this app...',
//     message: 'waiting for your review....',
//     time: '08:15',
//     isRead: true,
//     section: 'Today',
//   },
//   {
//     id: '7',
//     title: 'System update',
//     message: 'time to update your app....',
//     time: '08:15',
//     isRead: true,
//     section: 'Today',
//   },
// ];

export type DayStatus = 'completed' | 'active' | 'pending';

export interface StreakDay {
  id: string;
  status: DayStatus;
}

export interface GameItem {
  id: string;
  title: string;
  subtitle?: string;
  amount?: string;
  description?: string;
  buttonText?: string;
  colors?: [string, string];
  maskOpacity?: number;
  locked?: boolean;
  lockReason?: 'level' | 'slots';
  blockedUntil?: string | null;
  cardBgMask?: string;
  variant?: 'default' | 'mini';
  navigateTo?: {
    route: (typeof NavigationStrings)[keyof typeof NavigationStrings];
    screen?: (typeof NavigationStrings)[keyof typeof NavigationStrings];
    params?: any;
  };
}

export interface PicPickGameItem {
  id: string;
  number: string;
  amount: string;
  description1: string;
  description2: string;
  numberBackground: string;
  inputBackground: string;
  gameSlug?: string;
  gameType?: string;
}

export type PicPickVariant = 'picpick' | 'state';

export interface PicPickScreenConfig {
  headerTitle: string;
  sectionTitle: string;
  sectionSubtitle: string;
  games: PicPickGameItem[];
}

export interface RewardProgress {
  title: string;
  subtitle: string;
  currentPoints: number;
  targetPoints: number;
}

export interface RewardItem {
  id: string;
  title: string;
  cardColor: string;
  image?: string;
}

export type CashGameId = 'zdt' | 'pick3' | 'pick4' | 'pick5';
export type CashGameSlug = 'zdt' | 'pick-3' | 'pick-4' | 'pick-5';

export const cashGameIdBySlug: Record<CashGameSlug, CashGameId> = {
  zdt: 'zdt',
  'pick-3': 'pick3',
  'pick-4': 'pick4',
  'pick-5': 'pick5',
};

export const cashGameSlugById: Record<CashGameId, CashGameSlug> = {
  zdt: 'zdt',
  pick3: 'pick-3',
  pick4: 'pick-4',
  pick5: 'pick-5',
};

export interface CashGameScreenItem {
  id: CashGameId;
  headerTitle: string;
  introText: string;
  amountLabel: string;
  amountPlaceholder: string;
  amountHint?: string;
  requiresZip: boolean;
  requiresDate: boolean;
}

export const dailyStreakDays: StreakDay[] = [
  { id: '01', status: 'completed' },
  { id: '02', status: 'active' },
  { id: '03', status: 'pending' },
  { id: '04', status: 'pending' },
  { id: '05', status: 'pending' },
  { id: '06', status: 'pending' },
  { id: '07', status: 'pending' },
];

export const cashGameScreenConfig: Record<CashGameId, CashGameScreenItem> = {
  zdt: {
    id: 'zdt',
    headerTitle: 'Zip Date Time',
    introText:
      'Play the Zip Code, Date and Time info from any receipt. You can win up to $1,430,000 in prizes!',
    amountLabel: 'Vendor Zip Code',
    amountPlaceholder: 'Enter Zip Code',
    requiresZip: true,
    requiresDate: true,
  },
  pick3: {
    id: 'pick3',
    headerTitle: 'Pick 3',
    introText:
      'Play the total (3-Digit) and time info from any receipt. You can win up to $1,095,000 prizes!',
    amountLabel: 'Receipt Total',
    amountPlaceholder: 'Enter Amount',
    amountHint: '(from 0.01 to 9.99)',
    requiresZip: false,
    requiresDate: false,
  },
  pick4: {
    id: 'pick4',
    headerTitle: 'Pick 4',
    introText:
      'Play the total (4-Digit) and time info from any receipt. You can win up to $1,825,000 prizes!',
    amountLabel: 'Receipt Total',
    amountPlaceholder: 'Enter Amount',
    amountHint: '(from 10.00 to 99.99)',
    requiresZip: false,
    requiresDate: false,
  },
  pick5: {
    id: 'pick5',
    headerTitle: 'Pick 5',
    introText:
      'Play the total (5-Digit) and time info from any receipt. You can win up to $3,659,000 prizes!',
    amountLabel: 'Receipt Total',
    amountPlaceholder: 'Enter Amount',
    amountHint: '(from 100.00 to 999.99)',
    requiresZip: false,
    requiresDate: false,
  },
};

export const pointsGames: GameItem[] = [
  {
    id: 'big-win',
    title: '',
    maskOpacity: 1,
    cardBgMask: images.BigWinGame,
    navigateTo: {
      route: NavigationStrings.PLAY_STACK,
    },
  },
  {
    id: 'slot-777',
    title: '',
    maskOpacity: 1,
    cardBgMask: images.Game777,
    navigateTo: {
      route: NavigationStrings.PLAY_STACK,
    },
  },
  {
    id: 'scratch',
    title: '',
    maskOpacity: 1,
    cardBgMask: images.ScratchGame,
    locked: true,
    navigateTo: {
      route: NavigationStrings.PLAY_STACK,
    },
  },
];

export const picPickDailyGames: PicPickGameItem[] = [
  {
    id: 'picpick-3',
    number: '3',
    amount: '$500 Game',
    description1: 'Upload Receipt and chance to win.',
    description2:
      'Enter the receipt total, select state and submit picture of receipt.',
    numberBackground: '#990503',
    inputBackground: '#650606ff',
  },
  {
    id: 'picpick-4',
    number: '4',
    amount: '$1,000 Game',
    description1: 'Upload Receipt and chance to win.',
    description2:
      'Enter the receipt total, select state and submit picture of receipt.',
    numberBackground: '#FE6104',
    inputBackground: '#8c3a00ff',
  },
  {
    id: 'picpick-5',
    number: '5',
    amount: '$2,500 Game',
    description1: 'Upload Receipt and chance to win.',
    description2:
      'Enter the receipt total, select state and submit picture of receipt.',
    numberBackground: '#105998',
    inputBackground: '#053562ff',
  },
];

export const stateDailyGames: PicPickGameItem[] = [
  {
    id: 'state-3',
    number: '3',
    amount: '$1,500 Game',
    description1: 'Upload Receipt and chance to win.',
    description2:
      'Enter the receipt total, select state and submit picture of receipt.',
    numberBackground: '#5604B7',
    inputBackground: '#3D0974',
  },
  {
    id: 'state-4',
    number: '4',
    amount: '$2,500 Game',
    description1: 'Upload Receipt and chance to win.',
    description2:
      'Enter the receipt total, select state and submit picture of receipt.',
    numberBackground: '#FE8904',
    inputBackground: '#b66a00ff',
  },
  {
    id: 'state-5',
    number: '5',
    amount: '$3,500 Game',
    description1: 'Upload Receipt and chance to win.',
    description2:
      'Enter the receipt total, select state and submit picture of receipt.',
    numberBackground: '#981076',
    inputBackground: '#6e0058ff',
  },
];

export const picPickScreenConfig: Record<PicPickVariant, PicPickScreenConfig> =
  {
    picpick: {
      headerTitle: 'Pic-Pick',
      sectionTitle: 'Daily Pic-Pick Games',
      sectionSubtitle: 'Select one game',
      games: picPickDailyGames,
    },
    state: {
      headerTitle: 'State Game',
      sectionTitle: 'Daily State Games',
      sectionSubtitle: 'Select one game',
      games: stateDailyGames,
    },
  };

export const rewardsProgress: RewardProgress = {
  title: 'Next Reward $10',
  subtitle: '(15,000 Points=$10)',
  currentPoints: 14500,
  targetPoints: 15000,
};

// export const rewardItems: RewardItem[] = [
//   {
//     id: 'reward-1',
//     title: "McDonald's $10\nVoucher",
//     cardColor: '#d9221cff',
//     image: images.mcDonald,
//   },
//   {
//     id: 'reward-2',
//     title: 'StarBucks $10\nVoucher',
//     cardColor: '#007142ff',
//     image: images.starbucks,
//   },
//   {
//     id: 'reward-3',
//     title: 'Walmart  $10\nVoucher',
//     cardColor: '#1756d3ff',
//     image: images.walmart,
//   },
//   {
//     id: 'reward-4',
//     title: 'Dunkin Donuts $10\nVoucher',
//     cardColor: '#E43590',
//     image: images.dunkin,
//   },
//   {
//     id: 'reward-5',
//     title: 'Mobile Gas $10\nVoucher',
//     cardColor: '#e0e0e0ff',
//     image: images.mobilegas,
//   },
//   {
//     id: 'reward-6',
//     title: '$10 Cash\nReward',
//     cardColor: '#8CC63F',
//     image: images.dollar,
//   },
//   {
//     id: 'reward-7',
//     title: 'Gold Coin\nReward',
//     cardColor: '#8CC63F',
//     image: images.coinReward,
//   },
// ];



export const winPointsGameVideos = [
  {
    id: 1,
    title: "Spin the Wheel",
    videoUrl:
      "https://receipts-to-riches.koderspedia.live/images/game-guide/video-folder/WIN%20POINTS%20GAMES/GAME%2011%20SPIN%20THE%20WHEEL.mov",
    videoUrl_es:"https://receipts-to-riches.koderspedia.live/images/game-guide/video-folder/spanish/WIN%20POINTS%20GAMES/GAME%2011%20SPIN%20THE%20WHEEL%20SPANISH%20.mp4"
  },
  {
    id: 2,
    title: "Lucky 7",
    videoUrl:
      "https://receipts-to-riches.koderspedia.live/images/game-guide/video-folder/WIN%20POINTS%20GAMES/GAME%2012%20LUCKY%2072(1).mov",
    videoUrl_es:"https://receipts-to-riches.koderspedia.live/images/game-guide/video-folder/spanish/WIN%20POINTS%20GAMES/GAME%2012%20LUCKY%2072%20SPANISH.mp4"
  },
  {
    id: 3,
    title: "Scratch to Win",
    videoUrl:
      "https://receipts-to-riches.koderspedia.live/images/game-guide/video-folder/WIN%20POINTS%20GAMES/GAME%2013%20SCRATCH%20TO%20WIN(1).mov",
    videoUrl_es:"https://receipts-to-riches.koderspedia.live/images/game-guide/video-folder/spanish/WIN%20POINTS%20GAMES/GAME%2013%20SCRATCH%20TO%20WIN%20Spanish%20.mp4"
  },
];

export const cashGamesVideos = [
  {
    id: 1,
    title: "Pick 5 Game",
    videoUrl:
      "https://receipts-to-riches.koderspedia.live/images/game-guide/video-folder/CASH%20GAMES%20%E2%80%94%20DAILY%20DRAW%20/%20Pick%205%20Game.mov",
    videoUrl_es: "https://receipts-to-riches.koderspedia.live/images/game-guide/video-folder/spanish/CASH%20GAMES/Pick%205%20Game%20spanish.mp4",
  },
  {
    id: 2,
    title: "Pick 3 Game",
    videoUrl:
      "https://receipts-to-riches.koderspedia.live/images/game-guide/video-folder/CASH%20GAMES%20%E2%80%94%20DAILY%20DRAW%20/Pick%203%20Game.mov",
    videoUrl_es: "https://receipts-to-riches.koderspedia.live/images/game-guide/video-folder/spanish/CASH%20GAMES/Pick%203%20Game%20Spanish%20.mp4",
  },
  {
    id: 3,
    title: "Pick 4 Game",
    videoUrl:
      "https://receipts-to-riches.koderspedia.live/images/game-guide/video-folder/CASH%20GAMES%20%E2%80%94%20DAILY%20DRAW%20/Pick%204%20Game.mov",
    videoUrl_es: "https://receipts-to-riches.koderspedia.live/images/game-guide/video-folder/spanish/CASH%20GAMES/Pick%204%20Game%20Spanish%20.mp4",
  },
  {
    id: 4,
    title: "ZDT Game",
    videoUrl:
      "https://receipts-to-riches.koderspedia.live/images/game-guide/video-folder/CASH%20GAMES%20%E2%80%94%20DAILY%20DRAW%20/ZIP%20CODE%20DATE%20%26%20TIME%20(ZDT)%20Game.mov",
    videoUrl_es: "https://receipts-to-riches.koderspedia.live/images/game-guide/video-folder/spanish/CASH%20GAMES/GAME%201%20ZIP%20CODE%20DATE%20%26%20TIME%20%28ZDT%29%20SPANISH.mp4",
  },
];

export const picPickGameVideos = [
  {
    id: 1,
    title: "Pic-Pick 3",
    videoUrl:
      "https://receipts-to-riches.koderspedia.live/images/game-guide/video-folder/INSTANT%20WIN%20GAMES/GAME%205%20PIC-PICK%203%20(INSTANT).mov",
      videoUrl_es:"https://receipts-to-riches.koderspedia.live/images/game-guide/video-folder/spanish/INSTANT%20WIN%20GAMES/GAME%205%20PIC-PICK%203%20%28INSTANT%29%20SPANISH.mp4"
  },
  {
    id: 2,
    title: "Pic-Pick 4",
    videoUrl:
      "https://receipts-to-riches.koderspedia.live/images/game-guide/video-folder/INSTANT%20WIN%20GAMES/GAME%206%20PIC-PICK%204%20(INSTANT).mov",
      videoUrl_es: "https://receipts-to-riches.koderspedia.live/images/game-guide/video-folder/spanish/INSTANT%20WIN%20GAMES/PICK%20PICK%204%20SPANISH%20.mp4"
  },
  {
    id: 3,
    title: "Pic-Pick 5",
    videoUrl:
      "https://receipts-to-riches.koderspedia.live/images/game-guide/video-folder/INSTANT%20WIN%20GAMES/GAME%207%20PIC-PICK%205%20(INSTANT).mov",
    videoUrl_es: "https://receipts-to-riches.koderspedia.live/images/game-guide/video-folder/spanish/INSTANT%20WIN%20GAMES/GAME%207%20PIC-PICK%205%20%28INSTANT%29%20SPANISH%20.mp4"
  },
 
];

export const statePickGameVideos = [
  {
    id: 1,
    title: "State 3",
    videoUrl:
      "https://receipts-to-riches.koderspedia.live/images/game-guide/video-folder/INSTANT%20WIN%20GAMES/GAME%208%20STATE%203%20(INSTANT).mov",
    videoUrl_es: "https://receipts-to-riches.koderspedia.live/images/game-guide/video-folder/spanish/INSTANT%20WIN%20GAMES/GAME%208%20STATE%203%20%28INSTANT%29%20%20SPANISH%20.mp4"
  },
  {
    id: 2,
    title: "State 4",
    videoUrl:
      "https://receipts-to-riches.koderspedia.live/images/game-guide/video-folder/INSTANT%20WIN%20GAMES/GAME%209%20STATE%204%20(INSTANT).mov",
    videoUrl_es: "https://receipts-to-riches.koderspedia.live/images/game-guide/video-folder/spanish/INSTANT%20WIN%20GAMES/GAME%209%20STATE%204%20%28INSTANT%29%20SPANISH.mp4"
  },
  {
    id: 3,
    title: "State 5",
    videoUrl:
      "https://receipts-to-riches.koderspedia.live/images/game-guide/video-folder/INSTANT%20WIN%20GAMES/GAME%2010%20STATE%205%20(INSTANT).mov",
    videoUrl_es: "https://receipts-to-riches.koderspedia.live/images/game-guide/video-folder/spanish/INSTANT%20WIN%20GAMES/GAME%2010%20STATE%205%20%28INSTANT%29%20SPANISH.mp4"
  },
]