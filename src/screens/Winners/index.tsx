import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Gift } from 'lucide-react';
import { Button, Container, FormInput, showToast } from '../../components';
import images from '../../constants/images';
import winnerServices from '../../services/winnerServices';

const getList = (payload: any): any[] => {
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.winners)) return payload.winners;
  if (Array.isArray(payload)) return payload;
  return [];
};

const formatDate = (value?: string) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const Winners: React.FC = () => {
  const { t } = useTranslation();
  const [winners, setWinners] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [resultSlug, setResultSlug] = useState('');
  const [resultDraw, setResultDraw] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [resultsLoading, setResultsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadWinners = async () => {
      setLoading(true);
      try {
        const response = await winnerServices.getAllWinners();
        if (isMounted) {
          setWinners(getList(response?.data));
        }
      } catch (error: any) {
        if (isMounted) {
          showToast({
            type: 'error',
            text1: t('winners.notLoadedTitle', 'Winners not loaded'),
            text2: error?.message || t('winners.tryAgain', 'Please try again.'),
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadWinners();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLoadResults = async () => {
    const slug = resultSlug.trim();
    if (!slug) {
      showToast({ type: 'error', text1: t('winners.enterGameSlug', 'Enter a game slug') });
      return;
    }

    setResultsLoading(true);
    try {
      const response = await winnerServices.getResults(slug, resultDraw.trim() || undefined);
      setResults(getList(response?.data));
    } catch (error: any) {
      showToast({
        type: 'error',
        text1: t('winners.resultsNotLoadedTitle', 'Results not loaded'),
        text2: error?.message || t('winners.tryAgain', 'Please try again.'),
      });
    } finally {
      setResultsLoading(false);
    }
  };

  return (
    <Container maxWidth="640px" style={{ gap: '20px', paddingBottom: '40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <img src={images.Trophy} alt="Trophy" style={{ width: '36px', height: '36px' }} />
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)' }}>
            {t('winners.pageTitle', 'Recent Prize Winners')}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {t('winners.pageSubtitle', 'Real-time live payouts and game reward claims')}
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>
          {t('winners.resultsLookupTitle', 'Game Results Lookup')}
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px', alignItems: 'end' }}>
          <FormInput
            label={t('winners.gameSlugLabel', 'Game Slug')}
            value={resultSlug}
            onChange={(event) => setResultSlug(event.target.value)}
            placeholder={t('winners.gameSlugPlaceholder', 'Enter API game slug')}
          />
          <FormInput
            label={t('winners.drawLabel', 'Draw')}
            value={resultDraw}
            onChange={(event) => setResultDraw(event.target.value)}
            placeholder={t('winners.optionalPlaceholder', 'Optional')}
          />
          <Button
            title={t('winners.loadButton', 'Load')}
            onClick={handleLoadResults}
            loading={resultsLoading}
            style={{ padding: '12px 18px', minHeight: '48px' }}
          />
        </div>

        {results.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {results.map((result, index) => (
              <div
                key={result?.id ?? index}
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: 'var(--bg-card-secondary)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '10px',
                  fontSize: '13px',
                  color: 'var(--text-main)',
                }}
              >
                <span>
                  {formatDate(result?.date ?? result?.created_at) ||
                    t('winners.resultFallback', 'Result {{number}}', { number: index + 1 })}
                  {result?.type ? ` · ${result.type}` : ''}
                  {result?.zip_code ? ` · ${result.zip_code}` : ''}
                </span>
                <strong>{result?.total !== undefined ? `$${result.total}` : t('winners.notAvailable', 'N/A')}</strong>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {loading && winners.length === 0 && (
          <div className="card" style={{ padding: '20px', color: 'var(--text-muted)' }}>
            {t('winners.loadingWinners', 'Loading winners...')}
          </div>
        )}

        {!loading && winners.length === 0 && (
          <div className="card" style={{ padding: '20px', color: 'var(--text-muted)' }}>
            {t('winners.noWinnersYet', 'No winners yet.')}
          </div>
        )}

        {winners.map((winner, index) => {
          // The winners API only returns user_id/game_id/type - no embedded
          // user name, game name, or prize amount to display.
          const name =
            winner?.user?.name ?? winner?.name ?? t('winners.winnerFallback', 'Winner #{{id}}', { id: winner?.user_id ?? index + 1 });
          const prize = winner?.type ? winner.type : t('winners.rewardFallback', 'Reward');
          const game = winner?.game?.name ?? winner?.game_name ?? t('winners.gameFallback', 'Game #{{id}}', { id: winner?.game_id ?? '-' });
          return (
            <div
              key={winner?.id ?? index}
              className="card"
              style={{
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'rgba(213, 173, 96, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#D5AD60',
                  }}
                >
                  <Gift size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
                    {name}
                  </h4>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {t('winners.wonVia', 'Won via {{game}} - {{date}}', { game, date: formatDate(winner?.created_at) })}
                  </span>
                </div>
              </div>

              <span className="pill-badge pill-gold" style={{ fontSize: '13px', fontWeight: 700 }}>
                {typeof prize === 'number' ? `${prize} ${t('winners.ptsSuffix', 'PTS')}` : prize}
              </span>
            </div>
          );
        })}
      </div>
    </Container>
  );
};

export default Winners;
