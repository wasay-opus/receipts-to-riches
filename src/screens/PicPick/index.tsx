import React, { useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft, HelpCircle, Megaphone, ChevronRight } from 'lucide-react';
import { Container } from '../../components';
import { AppDispatch, RootState } from '../../redux/Store';
import { fetchAllGames, fetchGamesBySlug } from '../../redux/Slices/gamesSlice';
import { picPickScreenConfig, stateDailyGames, picPickDailyGames } from '../../config';
import { getGamesByTypeSlug } from '../../utils/gameMapper';

export const PicPick: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();

  const queryVariant = searchParams.get('variant') || (location.state as any)?.variant;
  const currentVariant = queryVariant === 'state' ? 'state' : (queryVariant === 'picpick' ? 'picpick' : 'state');
  const isState = currentVariant === 'state';

  const { allGames, gamesBySlug, loading, slugLoading } = useSelector(
    (state: RootState) => state.games,
  );

  useEffect(() => {
    dispatch(fetchAllGames(undefined));
    dispatch(fetchGamesBySlug(isState ? 'state' : 'pic-pick'));
  }, [dispatch, isState]);

  const rawGames = useMemo(() => {
    const slugKey = isState ? 'state' : 'pic-pick';
    const source =
      getGamesByTypeSlug(gamesBySlug?.[slugKey] ?? null, slugKey).length > 0
        ? getGamesByTypeSlug(gamesBySlug?.[slugKey] ?? null, slugKey)
        : getGamesByTypeSlug(allGames, slugKey);

    const templateList = isState ? stateDailyGames : picPickDailyGames;

    if (source.length > 0) {
      return source.map((g, idx) => {
        const tpl = templateList[idx] || templateList[templateList.length - 1];
        return {
          id: g.id,
          number: tpl?.number || `${idx + (isState ? 3 : 1)}`,
          amount: g.name || `$${g.price} Game`,
          description: tpl?.description1 || 'Upload Receipt and chance to win.',
          numberBackground: tpl?.numberBackground || (isState ? '#6300E4' : '#E11D48'),
          gameSlug: g.slug,
          gameType: isState ? 'state' : 'pic-pick',
          rawGame: g,
        };
      });
    }

    // Fallback template items matching Screenshot 3
    return templateList.map((tpl) => ({
      id: tpl.id,
      number: tpl.number,
      amount: tpl.amount,
      description: tpl.description1,
      numberBackground: tpl.numberBackground,
      gameSlug: isState
        ? (tpl.number === '3' ? '1500-game' : (tpl.number === '4' ? '2500-game-state' : '3500-game'))
        : (tpl.number === '1' ? '500-game' : (tpl.number === '2' ? '1000-game' : '2500-game-pic-pick')),
      gameType: isState ? 'state' : 'pic-pick',
    }));
  }, [allGames, gamesBySlug, isState]);

  const headerTitle = isState ? 'State Game' : 'Pic-Pick';
  const sectionTitle = isState ? 'Daily State Games' : 'Daily Pic-Pick Games';

  return (
    <Container maxWidth="520px" style={{ gap: '16px', paddingBottom: '40px' }}>
      {/* Top Header Bar matching Screenshot 3 */}
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          type="button"
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
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
          {headerTitle}
        </h2>
        <button
          type="button"
          onClick={() => navigate('/profile/rules')}
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
            color: 'var(--green)',
          }}
        >
          <HelpCircle size={20} />
        </button>
      </div>

      {/* Sponsored Ad Banner matching Screenshot 3 */}
      <div
        style={{
          width: '100%',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '20px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '10px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'rgba(0, 103, 77, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--green)',
          }}
        >
          <Megaphone size={28} />
        </div>
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
          Grow Your Audience!
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.4', maxWidth: '340px' }}>
          Advertise your brand, website, or mobile app directly to our active users. Tap here to launch your campaign!
        </p>
        <button
          type="button"
          onClick={() => navigate('/campaigns/create')}
          style={{
            background: 'var(--green)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '24px',
            padding: '8px 20px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          Get Started &rarr;
        </button>
      </div>

      {/* Games Section Header */}
      <div style={{ marginTop: '4px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
          {sectionTitle}
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
          Select one game
        </p>
      </div>

      {/* Games List matching Screenshot 3 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {rawGames.map((game, idx) => (
          <div
            key={game.id || idx}
            onClick={() =>
              navigate('/play/pic-pick-game', {
                state: {
                  challenge: {
                    ...game,
                    title: isState ? `State Game ${game.number}` : `Pic-Pick Game ${game.number}`,
                    amount: game.amount,
                    isState,
                  },
                },
              })
            }
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '20px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              cursor: 'pointer',
              transition: 'transform 0.2s ease, border-color 0.2s ease',
              boxShadow: 'var(--shadow-sm)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.borderColor = 'var(--green)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
            }}
          >
            {/* Colored Number Box */}
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: game.numberBackground,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontSize: '24px',
                fontWeight: 900,
                flexShrink: 0,
                boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
              }}
            >
              {game.number}
            </div>

            {/* Game Info */}
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                {game.amount}
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', margin: 0 }}>
                {game.description}
              </p>
            </div>

            <ChevronRight size={20} color="var(--text-muted)" />
          </div>
        ))}
      </div>
    </Container>
  );
};

export default PicPick;
