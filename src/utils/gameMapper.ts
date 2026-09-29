import {
  CashGameSlug,
  cashGameIdBySlug,
  GameItem,
  PicPickGameItem,
  PicPickVariant,
} from '../config';
import { images } from '../constants';
import NavigationStrings from '../navigation/NavigationStrings';
import {
  ApiGame,
  GamesData,
  UnlockedMiniGamesData,
} from '../redux/Slices/gamesSlice';

const CASH_COLORS_BY_SLUG: Record<string, [string, string]> = {
  zdt: ['#5B00F0', '#7A1DFF'],
  'pick-3': ['#FE6104', '#FE6104'],
  'pick-4': ['#15AE36', '#15AE36'],
  'pick-5': ['#105998', '#105998'],
};

const MINI_CARD_CONFIG_BY_SLUG: Record<
  string,
  {
    colors: [string, string];
    image: any;
  }
> = {
  'lucky-7': {
    colors: ['#1E0D88', '#3519C7'],
    image: images.playmini777,
  },
  'spin-the-wheel': {
    colors: ['#034C2A', '#0D8350'],
    image: images.playminispin,
  },
  'scratch-2-win': {
    colors: ['#2F1308', '#5D2B16'],
    image: images.playminiscratch,
  },
};

const HOME_POINTS_CARD_IMAGE_BY_SLUG: Record<string, any> = {
  'spin-the-wheel': images.BigWinGame,
  'lucky-7': images.Game777,
  'scratch-2-win': images.ScratchGame,
};

const HOME_POINTS_CARD_ORDER: string[] = [
  'spin-the-wheel',
  'lucky-7',
  'scratch-2-win',
];

const isMiniGameLocked = (slug: string, userLevel: number): boolean => {
  const normalizedLevel = Math.max(0, Math.floor(Number(userLevel) || 0));

  if (normalizedLevel >= 4) {
    return false;
  }

  if (normalizedLevel <= 1) {
    return true;
  }

  if (normalizedLevel === 2) {
    return slug !== 'spin-the-wheel';
  }

  if (normalizedLevel === 3) {
    return slug === 'scratch-2-win';
  }

  return true;
};

type MiniGameAvailability = {
  locked: boolean;
  lockReason?: 'level' | 'slots';
  blockedUntil?: string | null;
};

const getEarliestBlockedUntil = (blockedUntilValues: Array<string | null | undefined>) => {
  const validBlockedUntilValues = blockedUntilValues
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .map(value => ({ value, timestamp: Date.parse(value) }))
    .filter(item => !Number.isNaN(item.timestamp))
    .sort((first, second) => first.timestamp - second.timestamp);

  if (validBlockedUntilValues.length === 0) {
    return null;
  }

  return validBlockedUntilValues[0].value;
};

const resolveMiniGameAvailability = (
  slug: string,
  userLevel: number,
  unlockedMiniGames?: UnlockedMiniGamesData | null,
): MiniGameAvailability => {
  const normalizedSlug = slug.toLowerCase();
  const levelLocked = isMiniGameLocked(normalizedSlug, userLevel);

  // Keep existing level-based lock flow as primary gate.
  if (levelLocked) {
    return { locked: true, lockReason: 'level' };
  }

  const slotEntries = unlockedMiniGames?.[normalizedSlug] ?? [];

  if (slotEntries.length > 0) {
    const hasOpenSlot = slotEntries.some(slotItem => Number(slotItem?.is_open) === 1);
    if (hasOpenSlot) {
      return { locked: false };
    }

    return {
      locked: true,
      lockReason: 'slots',
      blockedUntil: getEarliestBlockedUntil(
        slotEntries.map(slotItem => slotItem?.blocked_until),
      ),
    };
  }

  return { locked: false };
};

const resolveMiniGameNavigateTo = (game: ApiGame): GameItem['navigateTo'] => {
  if (game.slug === 'spin-the-wheel') {
    return {
      route: NavigationStrings.PLAY_STACK,
      screen: NavigationStrings.SPIN_WHEEL,
      params: {
        gameSlug: game.slug,
        gameName: game.name,
      },
    };
  }

  if (game.slug === 'scratch-2-win') {
    return {
      route: NavigationStrings.PLAY_STACK,
      screen: NavigationStrings.SCRATCH_2_WIN,
      params: {
        gameSlug: game.slug,
        gameName: game.name,
      },
    };
  }

  if (game.slug === 'lucky-7') {
    return {
      route: NavigationStrings.PLAY_STACK,
      screen: NavigationStrings.LUCKY_7,
      params: {
        gameSlug: game.slug,
        gameName: game.name,
      },
    };
  }

  return {
    route: NavigationStrings.PLAY_STACK,
    screen: NavigationStrings.PICPICK,
  };
};

const formatPrice = (price?: string | number) => {
  const numericPrice = Number(price);
  if (Number.isFinite(numericPrice)) {
    return `$${numericPrice.toLocaleString()}`;
  }
  if (typeof price === 'string' && price.trim().length > 0) {
    return `$${price}`;
  }
  return '';
};

export const getGamesByTypeSlug = (
  gamesData: GamesData | ApiGame[] | null | undefined,
  slug: string,
): ApiGame[] => {
  if (Array.isArray(gamesData)) {
    return gamesData.filter(
      game => game?.game_type?.slug === slug || game?.slug === slug,
    );
  }

  const groupedGames = Object.values(gamesData ?? {}).filter(
    Array.isArray,
  ) as ApiGame[][];
  const flattenedGames = groupedGames.flat();
  const matchedByGameType = flattenedGames.filter(
    game => game?.game_type?.slug === slug,
  );

  if (matchedByGameType.length > 0) {
    return matchedByGameType;
  }

  const directGroup = gamesData?.[slug];
  return Array.isArray(directGroup) ? directGroup : [];
};

export const mapCashApiToGameItems = (
  cashGames: ApiGame[] = [],
): GameItem[] => {
  return cashGames.map(game => {
    const gameSlug = game.slug as CashGameSlug;
    const isSupportedSlug = Boolean(cashGameIdBySlug[gameSlug]);
    if (!isSupportedSlug) {
      console.warn('[GamesMapper] Unsupported cash game slug', game.slug);
    }
    return {
      id: String(game.id),
      title: game.name,
      amount: formatPrice(game.price),
      colors: CASH_COLORS_BY_SLUG[game.slug] ?? ['#105998', '#105998'],
      cardBgMask: images.cardBgMask,
      navigateTo: isSupportedSlug
        ? {
            route: NavigationStrings.PLAY_STACK,
            screen: NavigationStrings.CASH_GAME,
            params: {
              gameSlug,
              gameType: game.game_type?.slug ?? 'cash',
            },
          }
        : undefined,
    };
  });
};

export const mapInstantApiToGameItems = (
  picPickGames: ApiGame[] = [],
  stateGames: ApiGame[] = [],
): GameItem[] => {
  const instantData: GameItem[] = [];
  const picPickSlug = picPickGames[0]?.game_type?.slug || 'pic-pick';
  const stateSlug = stateGames[0]?.game_type?.slug || 'state';

  if (picPickGames.length > 0) {
    instantData.push({
      id: 'instant-pic-pick',
      title: '',
      cardBgMask: images.picpickbg,
      maskOpacity: 1,
      navigateTo: {
        route: NavigationStrings.PLAY_STACK,
        screen: NavigationStrings.PICPICK,
        params: {
          variant: 'picpick',
          apiSlug: picPickSlug,
        },
      },
    });
  }

  if (stateGames.length > 0) {
    instantData.push({
      id: 'instant-state',
      title: '',
      cardBgMask: images.statePickbg,
      maskOpacity: 1,
      navigateTo: {
        route: NavigationStrings.PLAY_STACK,
        screen: NavigationStrings.PICPICK,
        params: {
          variant: 'state',
          apiSlug: stateSlug,
        },
      },
    });
  }

  return instantData;
};

export const mapMiniApiToPlayGameItems = (
  miniGames: ApiGame[] = [],
  userLevel = 1,
  unlockedMiniGames?: UnlockedMiniGamesData | null,
): GameItem[] => {
  return miniGames.map(game => {
    const config = MINI_CARD_CONFIG_BY_SLUG[game.slug];
    const amount = formatPrice(game.price);
    const availability = resolveMiniGameAvailability(
      game.slug,
      userLevel,
      unlockedMiniGames,
    );

    return {
      id: String(game.id),
      title: game.name,
      description: `Play ${game.name}\nand win ${amount || '$0'}`,
      buttonText: 'Play Now',
      colors: config?.colors ?? ['#1E0D88', '#3519C7'],
      cardBgMask: config?.image ?? images.playmini777,
      variant: 'mini',
      locked: availability.locked,
      lockReason: availability.lockReason,
      blockedUntil: availability.blockedUntil,
      navigateTo: resolveMiniGameNavigateTo(game),
    };
  });
};

export const mapMiniApiToHomeGameItems = (
  miniGames: ApiGame[] = [],
  userLevel = 1,
  unlockedMiniGames?: UnlockedMiniGamesData | null,
): GameItem[] => {
  const sortedMiniGames = [...miniGames].sort((first, second) => {
    const firstOrder = HOME_POINTS_CARD_ORDER.indexOf(first.slug);
    const secondOrder = HOME_POINTS_CARD_ORDER.indexOf(second.slug);
    const safeFirstOrder = firstOrder === -1 ? Number.MAX_SAFE_INTEGER : firstOrder;
    const safeSecondOrder =
      secondOrder === -1 ? Number.MAX_SAFE_INTEGER : secondOrder;

    return safeFirstOrder - safeSecondOrder;
  });

  return sortedMiniGames.map(game => {
    const availability = resolveMiniGameAvailability(
      game.slug,
      userLevel,
      unlockedMiniGames,
    );

    return {
      id: String(game.id),
      title: '',
      maskOpacity: 1,
      cardBgMask: HOME_POINTS_CARD_IMAGE_BY_SLUG[game.slug] ?? images.BigWinGame,
      locked: availability.locked,
      lockReason: availability.lockReason,
      blockedUntil: availability.blockedUntil,
      navigateTo: resolveMiniGameNavigateTo(game),
    };
  });
};

const DEFAULT_PICPICK_NUMBER_BG = '#990503';
const DEFAULT_PICPICK_INPUT_BG = '#650606ff';
const DEFAULT_PICPICK_DESCRIPTION_1 = 'Upload Receipt and chance to win.';
const DEFAULT_PICPICK_DESCRIPTION_2 =
  'Enter the receipt total, select state and submit picture of receipt.';

export const mapApiGamesToPicPickItems = (
  games: ApiGame[] = [],
  variant: PicPickVariant,
  templateGames: PicPickGameItem[] = [],
): PicPickGameItem[] => {
  return games.map((game, index) => {
    const template =
      templateGames[index] ?? templateGames[templateGames.length - 1];

    return {
      id: `${variant}-${game.id}`,
      number: template?.number ?? `${index + 1}`,
      amount: game.name,
      description1: template?.description1 ?? DEFAULT_PICPICK_DESCRIPTION_1,
      description2: template?.description2 ?? DEFAULT_PICPICK_DESCRIPTION_2,
      numberBackground: template?.numberBackground ?? DEFAULT_PICPICK_NUMBER_BG,
      inputBackground: template?.inputBackground ?? DEFAULT_PICPICK_INPUT_BG,
      gameSlug: game.slug,
      gameType: game.game_type?.slug ?? variant,
    };
  });
};
