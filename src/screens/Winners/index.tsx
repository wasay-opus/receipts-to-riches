import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  Gift,
  Trophy,
  User,
  X,
  Search,
  Check,
} from 'lucide-react';
import { Container, Button } from '../../components';
import images from '../../constants/images';
import winnerServices from '../../services/winnerServices';
import gameServices from '../../services/gameServices';

type WinnerTab = 'winner' | 'results';

interface WinnerItem {
  id: string | number;
  name: string;
  drawTime: string;
  gameName: string;
  avatarUrl: string | null;
  badge: {
    type: 'cash' | 'picpick' | 'state' | 'mini' | 'text';
    title?: string;
    amount?: string;
    gradient?: string;
    image?: string;
  };
}

interface ResultItem {
  id: string | number;
  resultType: string;
  zipCode: string;
  date: string;
  time: string;
  state?: string;
  amount?: string;
}

interface DropdownGameOption {
  label: string;
  value: string;
  group?: string;
}

const RESULTS_GAME_OPTIONS: DropdownGameOption[] = [
  { label: 'ZDT', value: 'zdt' },
  { label: 'PICK 3', value: 'pick-3' },
  { label: 'PICK 4', value: 'pick-4' },
  { label: 'PICK 5', value: 'pick-5' },
  // Pic-Pick group
  { label: '$500 Game', value: '500-game', group: 'Pic-Pick' },
  { label: '$1000 Game', value: '1000-game', group: 'Pic-Pick' },
  { label: '$2500 Game', value: '2500-game-pic-pick', group: 'Pic-Pick' },
  // State Pick group
  { label: '$1500 Game', value: '1500-game', group: 'State Pick' },
  { label: '$2500 Game', value: '2500-game-state', group: 'State Pick' },
  { label: '$3500 Game', value: '3500-game', group: 'State Pick' },
];

export const Winners: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<WinnerTab>('winner');

  // Winners state
  const [winners, setWinners] = useState<WinnerItem[]>([]);
  const [winnersLoading, setWinnersLoading] = useState(false);
  const [winnersError, setWinnersError] = useState<string | null>(null);

  // Results state
  const [selectedGameSlug, setSelectedGameSlug] = useState<string>('pick-5');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsError, setResultsError] = useState<string | null>(null);
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 1. Format Draw Time
  const formatDrawTime = (rawDate?: string): string => {
    if (!rawDate) return 'Recently';
    const parsed = new Date(rawDate);
    if (Number.isNaN(parsed.getTime())) return rawDate;
    const dateStr = parsed.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
    const timeStr = parsed.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
    return `${dateStr} ${timeStr}`;
  };

  // 2. Format Result Date
  const formatResultDate = (rawDate?: string, createdAt?: string): string => {
    const val = rawDate || createdAt;
    if (!val) return '-';
    const parsed = new Date(val);
    if (Number.isNaN(parsed.getTime())) return val;
    const d = `${parsed.getDate()}`.padStart(2, '0');
    const m = `${parsed.getMonth() + 1}`.padStart(2, '0');
    const y = parsed.getFullYear();
    return `${d}/${m}/${y}`;
  };

  // 3. Format Result Time
  const formatResultTime = (timeVal?: string, createdAt?: string): string => {
    if (timeVal) {
      const match = String(timeVal).match(/^(\d{1,2}):(\d{2})/);
      if (match) {
        const h = Number(match[1]);
        const min = Number(match[2]);
        const d = new Date();
        d.setHours(h, min, 0, 0);
        return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      }
    }
    if (createdAt) {
      const parsed = new Date(createdAt);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      }
    }
    return '-';
  };

  // 4. Normalize Winner Item from API
  const normalizeWinner = (raw: any, index: number): WinnerItem => {
    const user = raw?.user || {};
    const game = raw?.game || {};
    const gameType = game?.game_type || {};

    const firstName = (user?.first_name || '').trim();
    const lastName = (user?.last_name || '').trim();
    let name = `${firstName} ${lastName}`.trim();
    if (!name) {
      name = user?.name || raw?.name || (user?.email ? user.email.split('@')[0] : 'Winner');
    }

    const drawTime = formatDrawTime(raw?.created_at || raw?.date);
    const gameName = game?.name || gameType?.name || 'PICK 4';
    const gameSlug = (game?.slug || raw?.game_slug || '').toLowerCase();
    const typeSlug = (gameType?.slug || raw?.type || '').toLowerCase();

    let badge: WinnerItem['badge'] = {
      type: 'cash',
      title: 'PICK 4',
      amount: '$4,000',
      gradient: 'linear-gradient(135deg, #15AE36 0%, #0EA63F 100%)',
    };

    if (gameSlug.includes('zdt') || gameName.toLowerCase().includes('zdt')) {
      badge = {
        type: 'cash',
        title: 'ZDT',
        amount: '$1,000',
        gradient: 'linear-gradient(135deg, #5B00F0 0%, #7A1DFF 100%)',
      };
    } else if (gameSlug.includes('pick-3') || gameName.toLowerCase().includes('pick 3')) {
      badge = {
        type: 'cash',
        title: 'PICK 3',
        amount: '$3,000',
        gradient: 'linear-gradient(135deg, #FF6104 0%, #FE8C00 100%)',
      };
    } else if (gameSlug.includes('pick-4') || gameName.toLowerCase().includes('pick 4')) {
      badge = {
        type: 'cash',
        title: 'PICK 4',
        amount: '$4,000',
        gradient: 'linear-gradient(135deg, #15AE36 0%, #0EA63F 100%)',
      };
    } else if (gameSlug.includes('pick-5') || gameName.toLowerCase().includes('pick 5')) {
      badge = {
        type: 'cash',
        title: 'PICK 5',
        amount: '$5,000',
        gradient: 'linear-gradient(135deg, #0070BA 0%, #0099E5 100%)',
      };
    } else if (
      typeSlug.includes('pic-pick') ||
      gameSlug.includes('pic-pick') ||
      gameSlug.includes('500-game') ||
      gameSlug.includes('1000-game') ||
      gameSlug === '2500-game'
    ) {
      badge = {
        type: 'picpick',
        image: images.picpickbg,
      };
    } else if (
      typeSlug.includes('state') ||
      gameSlug.includes('state') ||
      gameSlug === '1500-game' ||
      gameSlug === '3500-game'
    ) {
      badge = {
        type: 'state',
        image: images.statePickbg,
      };
    }

    return {
      id: raw?.id || index + 1,
      name,
      drawTime,
      gameName,
      avatarUrl: user?.image_url || user?.image || null,
      badge,
    };
  };

  // 5. Normalize Result Item from API
  const normalizeResult = (raw: any, index: number, isMidday = false): ResultItem => {
    let resultType = raw?.type || (isMidday ? 'Midday' : 'Daily');
    resultType = resultType.charAt(0).toUpperCase() + resultType.slice(1);

    const totalVal = raw?.total ?? raw?.amount ?? raw?.price;
    let formattedAmount = '-';
    if (totalVal !== undefined && totalVal !== null && totalVal !== '') {
      const str = String(totalVal).trim();
      if (str.startsWith('$')) {
        formattedAmount = str;
      } else {
        const num = parseFloat(str);
        formattedAmount = Number.isNaN(num) ? `$${str}` : `$${num}`;
      }
    }

    return {
      id: raw?.id || index + 1,
      resultType,
      zipCode: raw?.zip_code || raw?.zip || raw?.zipcode || '-',
      date: formatResultDate(raw?.date, raw?.created_at),
      time: formatResultTime(raw?.time, raw?.created_at),
      state: raw?.state || '',
      amount: formattedAmount,
    };
  };

  // Fetch Winners list
  const loadWinners = useCallback(async () => {
    setWinnersLoading(true);
    setWinnersError(null);
    try {
      const res = await winnerServices.getAllWinners();
      const rawList = Array.isArray(res?.data?.data)
        ? res.data.data
        : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.winners)
        ? res.winners
        : [];
      setWinners(rawList.map(normalizeWinner));
    } catch (err: any) {
      setWinnersError(err?.message || 'Failed to fetch winners.');
      setWinners([]);
    } finally {
      setWinnersLoading(false);
    }
  }, []);

  // Fetch Results by game slug (multi-draw for pick-3, pick-4, pick-5)
  const loadResults = useCallback(async (slug: string) => {
    setResultsLoading(true);
    setResultsError(null);
    try {
      let fullDayList: any[] = [];
      let middayList: any[] = [];

      const targetSlug =
        slug === 'state-2500' ? '2500-game-state' : slug;

      if (['pick-3', 'pick-4', 'pick-5'].includes(targetSlug)) {
        const [fullRes, midRes] = await Promise.allSettled([
          winnerServices.getResults(targetSlug),
          winnerServices.getResults(targetSlug, 'midday'),
        ]);

        const fullData =
          fullRes.status === 'fulfilled' && Array.isArray(fullRes.value?.data?.data)
            ? fullRes.value.data.data
            : fullRes.status === 'fulfilled' && Array.isArray(fullRes.value?.data)
            ? fullRes.value.data
            : [];

        const midData =
          midRes.status === 'fulfilled' && Array.isArray(midRes.value?.data?.data)
            ? midRes.value.data.data
            : midRes.status === 'fulfilled' && Array.isArray(midRes.value?.data)
            ? midRes.value.data
            : [];

        fullDayList = fullData.map((item: any, i: number) => normalizeResult(item, i, false));
        middayList = midData.map((item: any, i: number) =>
          normalizeResult(item, i + fullData.length, true),
        );
      } else {
        // Try fetching targetSlug, with fallback if needed
        let res: any = null;
        try {
          res = await winnerServices.getResults(targetSlug);
        } catch (initialErr) {
          if (targetSlug === '2500-game-pic-pick' || targetSlug === '2500-game-state') {
            try {
              res = await winnerServices.getResults('2500-game');
            } catch {
              res = null;
            }
          }
        }
        const data = Array.isArray(res?.data?.data)
          ? res.data.data
          : Array.isArray(res?.data)
          ? res.data
          : [];
        fullDayList = data.map((item: any, i: number) => normalizeResult(item, i, false));
      }

      setResults([...middayList, ...fullDayList]);
    } catch {
      setResultsError(null);
      setResults([]);
    } finally {
      setResultsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWinners();
  }, [loadWinners]);

  useEffect(() => {
    if (activeTab === 'results' && selectedGameSlug) {
      loadResults(selectedGameSlug);
    }
  }, [activeTab, selectedGameSlug, loadResults]);

  // Selected game label
  const selectedGameLabel = useMemo(() => {
    const found = RESULTS_GAME_OPTIONS.find((g) => g.value === selectedGameSlug);
    return found ? (found.group ? `${found.group} (${found.label})` : found.label) : selectedGameSlug.toUpperCase();
  }, [selectedGameSlug]);

  // Filtered results by date if chosen
  const filteredResults = useMemo(() => {
    if (!selectedDateFilter) return results;
    // Format YYYY-MM-DD to DD/MM/YYYY
    const parts = selectedDateFilter.split('-');
    if (parts.length === 3) {
      const formatted = `${parts[2]}/${parts[1]}/${parts[0]}`;
      return results.filter((r) => r.date === formatted);
    }
    return results;
  }, [results, selectedDateFilter]);

  const isZdtSelected = selectedGameSlug === 'zdt';

  return (
    <Container maxWidth="600px" style={{ gap: '18px', paddingBottom: '40px' }}>
      {/* 1. Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '4px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#00674D',
            boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
          }}
          aria-label={t('common.back', 'Back')}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)' }}>
          {activeTab === 'winner' ? t('winners.tabWinner', 'Winner') : t('winners.tabResults', 'Results')}
        </h1>
      </div>

      {/* 2. Top Segmented Toggle: [Winner] | [Results] (Screenshot 1 & 2) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          background: 'var(--bg-card-secondary)',
          borderRadius: '16px',
          padding: '4px',
          border: '1px solid var(--border-color)',
          gap: '4px',
        }}
      >
        <button
          onClick={() => setActiveTab('winner')}
          style={{
            padding: '12px 16px',
            borderRadius: '12px',
            border: 'none',
            fontSize: '14px',
            fontWeight: 800,
            cursor: 'pointer',
            background: activeTab === 'winner' ? '#009944' : 'transparent',
            color: activeTab === 'winner' ? '#FFFFFF' : 'var(--text-muted)',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'winner' ? '0 4px 12px rgba(0, 153, 68, 0.3)' : 'none',
          }}
        >
          {t('winners.tabWinner', 'Winner')}
        </button>

        <button
          onClick={() => setActiveTab('results')}
          style={{
            padding: '12px 16px',
            borderRadius: '12px',
            border: 'none',
            fontSize: '14px',
            fontWeight: 800,
            cursor: 'pointer',
            background: activeTab === 'results' ? '#009944' : 'transparent',
            color: activeTab === 'results' ? '#FFFFFF' : 'var(--text-muted)',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'results' ? '0 4px 12px rgba(0, 153, 68, 0.3)' : 'none',
          }}
        >
          {t('winners.tabResults', 'Results')}
        </button>
      </div>

      {/* 3. Tab Content */}
      {activeTab === 'winner' ? (
        /* Winner List */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {winnersLoading && winners.length === 0 && (
            <div className="card" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
              {t('winners.loadingWinners', 'Loading winners...')}
            </div>
          )}

          {!winnersLoading && winners.length === 0 && (
            <div className="card" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
              {winnersError || t('winners.noWinnersYet', 'No winners found.')}
            </div>
          )}

          {winners.map((winner) => (
            <div
              key={winner.id}
              className="card"
              style={{
                padding: '14px 16px',
                borderRadius: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                border: '1px solid var(--border-color)',
              }}
            >
              {/* Left: Avatar + Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    background: '#E5E7EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {winner.avatarUrl ? (
                    <img
                      src={winner.avatarUrl}
                      alt={winner.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <User size={24} color="#9CA3AF" />
                  )}
                </div>

                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    {winner.name}
                  </h4>
                  <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                    {winner.drawTime}
                  </p>
                </div>
              </div>

              {/* Right: Badge */}
              <div style={{ flexShrink: 0 }}>
                {winner.badge.type === 'picpick' ? (
                  <div
                    style={{
                      width: '64px',
                      height: '52px',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      boxShadow: '0 4px 10px rgba(0, 153, 68, 0.25)',
                    }}
                  >
                    <img
                      src={images.picpickbg}
                      alt="Pic Pick"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                ) : winner.badge.type === 'state' ? (
                  <div
                    style={{
                      width: '64px',
                      height: '52px',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      boxShadow: '0 4px 10px rgba(126, 34, 206, 0.25)',
                    }}
                  >
                    <img
                      src={images.statePickbg}
                      alt="State Pick"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      background: winner.badge.gradient || '#009944',
                      borderRadius: '14px',
                      padding: '8px 12px',
                      color: '#FFFFFF',
                      textAlign: 'center',
                      minWidth: '68px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <img
                      src={images.cardBgMask}
                      alt=""
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        opacity: 0.5,
                        pointerEvents: 'none',
                        mixBlendMode: 'screen',
                      }}
                    />
                    <span style={{ position: 'relative', zIndex: 2, fontSize: '10px', fontWeight: 800, letterSpacing: '0.5px' }}>
                      {winner.badge.title}
                    </span>
                    <span style={{ position: 'relative', zIndex: 2, fontSize: '14px', fontWeight: 900, marginTop: '2px' }}>
                      {winner.badge.amount}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Results Table View (Screenshot 1 & 2) */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Filters Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {/* Custom Grouped Dropdown matching Screenshots */}
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '24px',
                  background: 'var(--bg-card)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border-color)',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                }}
              >
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {selectedGameLabel}
                </span>
                <ChevronDown
                  size={18}
                  style={{
                    color: '#009944',
                    transform: isDropdownOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s ease',
                  }}
                />
              </button>

              {/* Dropdown Popover */}
              {isDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    right: 0,
                    background: 'var(--bg-card)',
                    borderRadius: '16px',
                    border: '1px solid var(--border-color)',
                    boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
                    zIndex: 50,
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    maxHeight: '380px',
                    overflowY: 'auto',
                  }}
                >
                  {/* Direct Cash Game items: ZDT, PICK 3, PICK 4, PICK 5 */}
                  {RESULTS_GAME_OPTIONS.filter((g) => !g.group).map((game) => {
                    const isSelected = selectedGameSlug === game.value;
                    return (
                      <button
                        key={game.value}
                        type="button"
                        onClick={() => {
                          setSelectedGameSlug(game.value);
                          setIsDropdownOpen(false);
                        }}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          borderRadius: '10px',
                          border: 'none',
                          background: isSelected ? '#009944' : 'transparent',
                          color: isSelected ? '#FFFFFF' : 'var(--text-main)',
                          fontWeight: isSelected ? 800 : 600,
                          fontSize: '14px',
                          textAlign: 'left',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) (e.currentTarget.style.background = 'var(--bg-secondary, rgba(128,128,128,0.1))');
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) (e.currentTarget.style.background = 'transparent');
                        }}
                      >
                        <span>{game.label}</span>
                        {isSelected && <Check size={16} />}
                      </button>
                    );
                  })}

                  {/* Pic-Pick Header & Sub-items */}
                  <div style={{ marginTop: '6px' }}>
                    <div
                      style={{
                        padding: '8px 12px 4px 12px',
                        fontSize: '13px',
                        fontWeight: 800,
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Pic-Pick
                    </div>
                    {RESULTS_GAME_OPTIONS.filter((g) => g.group === 'Pic-Pick').map((game) => {
                      const isSelected = selectedGameSlug === game.value;
                      return (
                        <button
                          key={game.value}
                          type="button"
                          onClick={() => {
                            setSelectedGameSlug(game.value);
                            setIsDropdownOpen(false);
                          }}
                          style={{
                            width: '100%',
                            padding: '10px 16px',
                            borderRadius: '10px',
                            border: 'none',
                            background: isSelected ? '#009944' : 'var(--bg-secondary, rgba(128,128,128,0.08))',
                            color: isSelected ? '#FFFFFF' : 'var(--text-main)',
                            fontWeight: isSelected ? 800 : 500,
                            fontSize: '13.5px',
                            textAlign: 'left',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '3px',
                          }}
                        >
                          <span style={{ paddingLeft: '8px' }}>{game.label}</span>
                          {isSelected && <Check size={16} />}
                        </button>
                      );
                    })}
                  </div>

                  {/* State Pick Header & Sub-items */}
                  <div style={{ marginTop: '6px' }}>
                    <div
                      style={{
                        padding: '8px 12px 4px 12px',
                        fontSize: '13px',
                        fontWeight: 800,
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      State Pick
                    </div>
                    {RESULTS_GAME_OPTIONS.filter((g) => g.group === 'State Pick').map((game) => {
                      const isSelected = selectedGameSlug === game.value;
                      return (
                        <button
                          key={game.value}
                          type="button"
                          onClick={() => {
                            setSelectedGameSlug(game.value);
                            setIsDropdownOpen(false);
                          }}
                          style={{
                            width: '100%',
                            padding: '10px 16px',
                            borderRadius: '10px',
                            border: 'none',
                            background: isSelected ? '#009944' : 'var(--bg-secondary, rgba(128,128,128,0.08))',
                            color: isSelected ? '#FFFFFF' : 'var(--text-main)',
                            fontWeight: isSelected ? 800 : 500,
                            fontSize: '13.5px',
                            textAlign: 'left',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '3px',
                          }}
                        >
                          <span style={{ paddingLeft: '8px' }}>{game.label}</span>
                          {isSelected && <Check size={16} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Date Picker Input matching Select date pill */}
            <div style={{ position: 'relative' }}>
              <input
                type="date"
                value={selectedDateFilter}
                onChange={(e) => setSelectedDateFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '24px',
                  background: 'var(--bg-card)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border-color)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                }}
              />
              {selectedDateFilter && (
                <button
                  onClick={() => setSelectedDateFilter('')}
                  style={{
                    position: 'absolute',
                    right: '32px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                  }}
                  title="Clear date filter"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Results Table matching Screenshot 1 (ZDT) and Screenshot 2 (PICK 3) */}
          <div
            className="card"
            style={{
              padding: 0,
              borderRadius: '18px',
              overflow: 'hidden',
              border: '1px solid var(--border-color)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              background: 'var(--bg-card)',
            }}
          >
            {/* Dynamic Table Green Header */}
            {isZdtSelected ? (
              /* ZDT Header: Result Type | Zip Code | Date | Time (Screenshot 1) */
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.1fr 1.1fr 1.2fr 1fr',
                  background: '#00D066',
                  color: '#052E16',
                  padding: '13px 12px',
                  fontSize: '13.5px',
                  fontWeight: 800,
                  textAlign: 'center',
                }}
              >
                <span>{t('winners.table.resultType', 'Result Type')}</span>
                <span>{t('winners.table.zipCode', 'Zip Code')}</span>
                <span>{t('winners.table.date', 'Date')}</span>
                <span>{t('winners.table.time', 'Time')}</span>
              </div>
            ) : (
              /* PICK 3/4/5, Pic-Pick, State Header: Result Type | Result Date | Amount | Time (Screenshot 2) */
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.1fr 1.2fr 1.1fr 1fr',
                  background: '#00D066',
                  color: '#052E16',
                  padding: '13px 12px',
                  fontSize: '13.5px',
                  fontWeight: 800,
                  textAlign: 'center',
                }}
              >
                <span>{t('winners.table.resultType', 'Result Type')}</span>
                <span>{t('winners.table.resultDate', 'Result Date')}</span>
                <span>{t('winners.table.amount', 'Amount')}</span>
                <span>{t('winners.table.time', 'Time')}</span>
              </div>
            )}

            {/* Table Body */}
            {resultsLoading && (
              <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                {t('winners.loadingResults', 'Loading results...')}
              </div>
            )}

            {!resultsLoading && filteredResults.length === 0 && (
              <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                {t('winners.noResults', 'No available')}
              </div>
            )}

            {!resultsLoading &&
              filteredResults.map((item, idx) => (
                <div
                  key={item.id || idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: isZdtSelected
                      ? '1.1fr 1.1fr 1.2fr 1fr'
                      : '1.1fr 1.2fr 1.1fr 1fr',
                    padding: '12px 10px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--text-main)',
                    borderBottom: '1px solid var(--border-color)',
                    background: idx % 2 === 0 ? 'transparent' : 'var(--bg-secondary, rgba(128, 128, 128, 0.05))',
                    alignItems: 'center',
                    textAlign: 'center',
                  }}
                >
                  {/* Column 1: Result Type */}
                  <span style={{ borderRight: '1px solid var(--border-color)', padding: '0 4px' }}>
                    {item.resultType}
                  </span>

                  {/* Column 2: Zip Code (ZDT) or Result Date (Others) */}
                  <span style={{ borderRight: '1px solid var(--border-color)', padding: '0 4px' }}>
                    {isZdtSelected ? item.zipCode : item.date}
                  </span>

                  {/* Column 3: Date (ZDT) or Amount (Others) */}
                  <span style={{ borderRight: '1px solid var(--border-color)', padding: '0 4px' }}>
                    {isZdtSelected ? item.date : item.amount}
                  </span>

                  {/* Column 4: Time */}
                  <span style={{ padding: '0 4px' }}>
                    {item.time}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </Container>
  );
};

export default Winners;
