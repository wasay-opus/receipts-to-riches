import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Gamepad2, Sparkles, Trophy, Flame, ChevronRight, Lock, PlayCircle } from 'lucide-react';
import { Container, CustomModal, Button, showToast } from '../../components';
import images from '../../constants/images';
import { AppDispatch, RootState } from '../../redux/Store';
import {
  fetchAllGames,
  fetchGamesBySlug,
  fetchUnlockedMiniGames,
  unlockedMiniGame,
} from '../../redux/Slices/gamesSlice';

const getGameMeta = (t: (key: string, fallback: string) => string): Record<string, any> => ({
  'spin-the-wheel': {
    title: t('play.games.spinTheWheel.title', 'Spin the Wheel'),
    subtitle: t('play.games.spinTheWheel.subtitle', 'Rotate to win bonus points'),
    image: images.playminispin,
    path: '/play/spin-wheel',
    badge: t('play.badges.popular', 'POPULAR'),
  },
  'scratch-2-win': {
    title: t('play.games.scratch2Win.title', 'Scratch 2 Win'),
    subtitle: t('play.games.scratch2Win.subtitle', 'Instant scratch-off surprise rewards'),
    image: images.playminiscratch,
    path: '/play/scratch-to-win',
    badge: t('play.badges.hot', 'HOT'),
  },
  'lucky-7': {
    title: t('play.games.lucky7.title', 'Lucky 777 Slot'),
    subtitle: t('play.games.lucky7.subtitle', 'Hit triple 7s for jackpot bonuses'),
    image: images.playmini777,
    path: '/play/lucky-7',
    badge: t('play.badges.jackpot', 'JACKPOT'),
  },
  'pic-pick': {
    title: t('play.games.picPick.title', 'Pic Pick Challenge'),
    subtitle: t('play.games.picPick.subtitle', 'Select winning images and state puzzles'),
    image: images.picpickbg,
    path: '/play/pic-pick',
    badge: t('play.badges.daily', 'DAILY'),
  },
  zdt: {
    title: t('play.games.zdt.title', 'ZDT Cash Game'),
    subtitle: t('play.games.zdt.subtitle', 'Submit receipt details for this cash game'),
    image: images.BigWinGame,
    path: '/play/cash-game',
    badge: t('play.badges.exclusive', 'EXCLUSIVE'),
  },
  'pick-3': {
    title: t('play.games.pick3.title', 'Pick 3 Cash Game'),
    subtitle: t('play.games.pick3.subtitle', 'Submit receipt details for this cash game'),
    image: images.BigWinGame,
    path: '/play/cash-game',
    badge: t('play.badges.cash', 'CASH'),
  },
  'pick-4': {
    title: t('play.games.pick4.title', 'Pick 4 Cash Game'),
    subtitle: t('play.games.pick4.subtitle', 'Submit receipt details for this cash game'),
    image: images.BigWinGame,
    path: '/play/cash-game',
    badge: t('play.badges.cash', 'CASH'),
  },
  'pick-5': {
    title: t('play.games.pick5.title', 'Pick 5 Cash Game'),
    subtitle: t('play.games.pick5.subtitle', 'Submit receipt details for this cash game'),
    image: images.BigWinGame,
    path: '/play/cash-game',
    badge: t('play.badges.cash', 'CASH'),
  },
});

const flattenGames = (allGames: any): any[] => {
  if (!allGames) return [];
  if (Array.isArray(allGames)) return allGames;
  return Object.values(allGames).flatMap((value) => (Array.isArray(value) ? value : []));
};

const getGameTypeSlug = (game: any) =>
  String(game?.game_type?.slug ?? game?.gameType ?? game?.type ?? '').toLowerCase();

const resolveGamePath = (game: any, slug: string) => {
  const typeSlug = getGameTypeSlug(game);
  if (slug === 'spin-the-wheel') return '/play/spin-wheel';
  if (slug === 'scratch-2-win') return '/play/scratch-to-win';
  if (slug === 'lucky-7') return '/play/lucky-7';
  if (slug === 'pic-pick' || typeSlug === 'pic-pick' || typeSlug === 'state') return '/play/pic-pick';
  if (typeSlug === 'cash' || ['zdt', 'pick-3', 'pick-4', 'pick-5'].includes(slug)) return '/play/cash-game';
  return '/play';
};

const AD_DURATION_SECONDS = 15;

export const Play: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { allGames, unlockedMiniGames, loading } = useSelector((state: RootState) => state.games);

  const [adGame, setAdGame] = useState<any | null>(null);
  const [adSecondsLeft, setAdSecondsLeft] = useState(AD_DURATION_SECONDS);
  const [unlocking, setUnlocking] = useState(false);
  const adTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    dispatch(fetchAllGames(undefined));
    dispatch(fetchUnlockedMiniGames());
  }, [dispatch]);

  useEffect(() => {
    if (!adGame) return;
    setAdSecondsLeft(AD_DURATION_SECONDS);
    adTimerRef.current = setInterval(() => {
      setAdSecondsLeft((prev) => {
        if (prev <= 1) {
          if (adTimerRef.current) clearInterval(adTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (adTimerRef.current) clearInterval(adTimerRef.current);
    };
  }, [adGame]);

  const gameMeta = useMemo(() => getGameMeta(t), [t]);

  const closeAdModal = () => {
    if (adTimerRef.current) clearInterval(adTimerRef.current);
    setAdGame(null);
    setAdSecondsLeft(AD_DURATION_SECONDS);
  };

  const handleClaimUnlock = async () => {
    if (!adGame) return;
    setUnlocking(true);
    try {
      await dispatch(unlockedMiniGame({ game_slug: adGame.slug })).unwrap();
      await dispatch(fetchUnlockedMiniGames()).unwrap();
      showToast({
        type: 'success',
        text1: t('play.gameUnlockedTitle', 'Game Unlocked'),
        text2: t('play.gameUnlockedDesc', '{{gameTitle}} is now unlocked. You can play it now.', {
          gameTitle: adGame.title,
        }),
      });
      closeAdModal();
    } catch (error: any) {
      showToast({
        type: 'error',
        text1: t('play.miniGameNotUnlocked', 'Mini game not unlocked'),
        text2: error?.message || String(error || t('play.tryAgain', 'Please try again.')),
      });
    } finally {
      setUnlocking(false);
    }
  };

  const games = useMemo(() => {
    const apiGames = flattenGames(allGames);

    return apiGames.map((game: any) => {
      const slug = String(game.slug ?? game.game_slug ?? '').toLowerCase();
      const meta = gameMeta[slug] ?? {};
      const unlockSlots = unlockedMiniGames?.[slug];
      const hasUnlockData = Array.isArray(unlockSlots) && unlockSlots.length > 0;
      const isOpen = !hasUnlockData || unlockSlots.some((slot) => Number(slot.is_open) === 1);

      return {
        id: game.id ?? slug,
        slug,
        rawGame: game,
        title: game.name ?? meta.title ?? t('play.defaultGameTitle', 'Game'),
        subtitle:
          meta.subtitle ??
          (game.price
            ? t('play.entryCost', 'Entry cost: {{price}} points', { price: game.price })
            : t('play.liveGameFromApi', 'Live game from API')),
        image: meta.image ?? images.playminispin,
        path: meta.path ?? resolveGamePath(game, slug),
        badge: isOpen ? meta.badge ?? t('play.badges.play', 'PLAY') : t('play.badges.locked', 'LOCKED'),
        locked: !isOpen,
      };
    });
  }, [allGames, unlockedMiniGames, gameMeta, t]);

  const handleGameSelect = async (game: any) => {
    if (game.locked) {
      setAdGame(game);
      return;
    }

    if (game.slug) {
      dispatch(fetchGamesBySlug(game.slug));
    }
    navigate(game.path, { state: { game: game.rawGame ?? game } });
  };

  return (
    <Container maxWidth="720px" style={{ gap: '20px', paddingBottom: '40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-main)' }}>
            {t('playScreen.title', 'Mini Games & Arcade')}
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {t('playScreen.subtitle', 'Play daily instant-win games to boost your reward earnings!')}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {loading && games.length === 0 && (
          <div className="card" style={{ padding: '20px', color: 'var(--text-muted)' }}>
            {t('play.loadingGames', 'Loading games...')}
          </div>
        )}

        {!loading && games.length === 0 && (
          <div className="card" style={{ padding: '20px', color: 'var(--text-muted)' }}>
            {t('play.noGamesFromApi', 'No games are available from the API right now.')}
          </div>
        )}

        {games.map((game) => (
          <div
            key={game.id}
            className="card"
            onClick={() => handleGameSelect(game)}
            style={{
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: game.locked ? 'not-allowed' : 'pointer',
              opacity: game.locked ? 0.65 : 1,
              transition: 'all 0.25s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.borderColor = 'var(--green)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  position: 'relative',
                  width: '84px',
                  height: '84px',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  flexShrink: 0,
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <img
                  src={game.image}
                  alt={game.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              <div>
                <span className="pill-badge pill-gold" style={{ fontSize: '10px', padding: '2px 8px' }}>
                  {game.badge}
                </span>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px' }}>
                  {game.title}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {game.subtitle}
                </p>
              </div>
            </div>

            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'var(--bg-card-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-main)',
              }}
            >
              {game.locked ? <Lock size={18} /> : <ChevronRight size={18} />}
            </div>
          </div>
        ))}
      </div>

      <CustomModal
        visible={Boolean(adGame)}
        onClose={closeAdModal}
        title={t('play.gameLocked', 'Game Locked')}
      >
        {adGame && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', whiteSpace: 'pre-line' }}>
              {t('play.watchAds', "Watch a short ad now to unlock '{{gameTitle}}' immediately.", {
                gameTitle: adGame.title,
              })}
            </p>

            <div
              style={{
                width: '100%',
                aspectRatio: '16 / 9',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(0,103,77,0.15), rgba(213,173,96,0.15))',
                border: '1px dashed var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <PlayCircle size={40} color={adSecondsLeft > 0 ? '#D5AD60' : '#10B981'} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                {adSecondsLeft > 0
                  ? t('play.sponsoredAdPlaying', 'Sponsored Ad Playing…')
                  : t('play.adComplete', 'Ad Complete')}
              </span>
            </div>

            <div style={{ width: '100%', height: '8px', borderRadius: '4px', background: 'var(--bg-card-secondary)', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${((AD_DURATION_SECONDS - adSecondsLeft) / AD_DURATION_SECONDS) * 100}%`,
                  background: '#00674D',
                  transition: 'width 1s linear',
                }}
              />
            </div>

            <Button
              onClick={handleClaimUnlock}
              disabled={adSecondsLeft > 0}
              loading={unlocking}
              title={
                adSecondsLeft > 0
                  ? t('play.adEndsIn', 'Ad ends in {{seconds}}s', { seconds: adSecondsLeft })
                  : t('play.claimAndUnlock', 'Claim & Unlock')
              }
              variant="gold"
              width="100%"
            />
          </div>
        )}
      </CustomModal>
    </Container>
  );
};

export default Play;
