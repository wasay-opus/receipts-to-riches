import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft, Play } from 'lucide-react';
import { Button, Container } from '../../components';
import images from '../../constants/images';
import { AppDispatch, RootState } from '../../redux/Store';
import { fetchAllGames, fetchGamesBySlug } from '../../redux/Slices/gamesSlice';
import { picPickScreenConfig } from '../../config';
import {
  getGamesByTypeSlug,
  mapApiGamesToPicPickItems,
} from '../../utils/gameMapper';

export const PicPick: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { allGames, gamesBySlug, loading, slugLoading } = useSelector(
    (state: RootState) => state.games,
  );

  useEffect(() => {
    dispatch(fetchAllGames(undefined));
    dispatch(fetchGamesBySlug('pic-pick'));
    dispatch(fetchGamesBySlug('state'));
  }, [dispatch]);

  const picPickGames = useMemo(() => {
    const source =
      getGamesByTypeSlug(gamesBySlug?.['pic-pick'] ?? null, 'pic-pick').length > 0
        ? getGamesByTypeSlug(gamesBySlug?.['pic-pick'] ?? null, 'pic-pick')
        : getGamesByTypeSlug(allGames, 'pic-pick');

    return mapApiGamesToPicPickItems(
      source,
      'picpick',
      picPickScreenConfig.picpick.games,
    );
  }, [allGames, gamesBySlug]);

  const stateGames = useMemo(() => {
    const source =
      getGamesByTypeSlug(gamesBySlug?.state ?? null, 'state').length > 0
        ? getGamesByTypeSlug(gamesBySlug?.state ?? null, 'state')
        : getGamesByTypeSlug(allGames, 'state');

    return mapApiGamesToPicPickItems(
      source,
      'state',
      picPickScreenConfig.state.games,
    );
  }, [allGames, gamesBySlug]);

  const challenges = [
    ...picPickGames.map((game) => ({
      ...game,
      title: game.amount,
      image: images.picpickbg,
      variant: 'picpick',
    })),
    ...stateGames.map((game) => ({
      ...game,
      title: game.amount,
      image: images.statePickbg,
      variant: 'state',
    })),
  ];

  return (
    <Container maxWidth="540px" style={{ gap: '20px', paddingBottom: '40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
          {t('picPick.challengesTitle', 'Pic Pick Challenges')}
        </h2>
        <div style={{ width: '40px' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {(loading || slugLoading) && challenges.length === 0 && (
          <div className="card" style={{ padding: '20px', color: 'var(--text-muted)' }}>
            {t('picPick.loadingGames', 'Loading Pic Pick games...')}
          </div>
        )}

        {!loading && !slugLoading && challenges.length === 0 && (
          <div className="card" style={{ padding: '20px', color: 'var(--text-muted)' }}>
            {t('picPick.noGamesFromApi', 'No Pic Pick games are available from the API right now.')}
          </div>
        )}

        {challenges.map((c) => (
          <div
            key={c.id}
            className="card"
            style={{
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ width: '100%', height: '160px', borderRadius: '16px', overflow: 'hidden' }}>
              <img src={c.image} alt={c.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>
                  {c.title}
                </h3>
                <span style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 600 }}>
                  {c.description1 ?? t('picPick.defaultDescription', 'Receipt reward challenge')}
                </span>
              </div>

              <Button
                title={t('picPick.playNow', 'Play Now')}
                icon={<Play size={16} />}
                onClick={() => navigate('/play/pic-pick-game', { state: { challenge: c } })}
              />
            </div>
          </div>
        ))}
      </div>
    </Container>
  );
};

export default PicPick;
