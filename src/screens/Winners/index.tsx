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
  Play,
  Video,
  Sparkles,
} from 'lucide-react';
import { Container, Button } from '../../components';
import images from '../../constants/images';
import winnerServices from '../../services/winnerServices';
import gameServices from '../../services/gameServices';

type WinnerTab = 'winner' | 'results';

export interface WinnerVideoItem {
  id: string;
  winnerName: string;
  gameTitle: string;
  prizeAmount: string;
  videoUrl: string;
  tag: string;
  description?: string;
}

export const PREVIOUS_WINNERS_VIDEOS: WinnerVideoItem[] = [
  {
    id: 'vid-1',
    winnerName: 'Sarah Jenkins',
    gameTitle: 'Pick 4 Game',
    prizeAmount: '$4,000 Cash',
    videoUrl: 'https://api.receiptstoriches.net/images/game-guide/video-folder/ourWinners.mov',
    tag: 'Previous Grand Winner',
    description: 'Celebrating a massive $4,000 winning receipt upload!',
  },
  {
    id: 'vid-2',
    winnerName: 'Marcus Johnson',
    gameTitle: 'Pic-Pick Instant Game',
    prizeAmount: '$2,500 Cash',
    videoUrl: 'https://api.receiptstoriches.net/images/game-guide/video-folder/IMG_6536.mp4',
    tag: 'Previous Instant Winner',
    description: 'Instant win celebration from shopping receipt uploads!',
  },
  {
    id: 'vid-3',
    winnerName: 'Elena Rodriguez',
    gameTitle: 'Zip Date Time (ZDT)',
    prizeAmount: '$1,000 Cash',
    videoUrl: 'https://api.receiptstoriches.net/images/game-guide/video-folder/IMG_0.MOV',
    tag: 'Previous Daily Winner',
    description: 'Daily cash winner turning everyday receipts into real dollars!',
  },
  {
    id: 'vid-4',
    winnerName: 'David Miller',
    gameTitle: 'Pick 5 Game',
    prizeAmount: '$5,000 Cash',
    videoUrl: 'https://api.receiptstoriches.net/images/game-guide/video-folder/Video.MOV',
    tag: 'Previous Cash Winner',
    description: 'Celebrating an incredible cash win from everyday shopping!',
  },
  {
    id: 'vid-5',
    winnerName: 'Ashley Williams',
    gameTitle: 'State Pick Game',
    prizeAmount: '$3,500 Cash',
    videoUrl: 'https://api.receiptstoriches.net/images/game-guide/video-folder/copy_A5624927-EC78-4FB4-A1A7-77F7F131ADA2.mov',
    tag: 'Previous State Winner',
    description: 'State winner celebration from shopping receipt uploads!',
  },
];

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
  createdAt?: string;
  rawDate?: string;
  canonicalYMD: string;
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
  const [activeVideoModal, setActiveVideoModal] = useState<WinnerVideoItem | null>(null);

  // Results state
  const [selectedGameSlug, setSelectedGameSlug] = useState<string>('pick-5');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsError, setResultsError] = useState<string | null>(null);
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const openDatePicker = () => {
    try {
      if (dateInputRef.current && typeof dateInputRef.current.showPicker === 'function') {
        dateInputRef.current.showPicker();
        return;
      }
    } catch {
      // fallback for browsers that don't allow showPicker
    }
    dateInputRef.current?.focus();
  };

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

  // 2. Extract unified Result Date info (displayDate in DD/MM/YYYY and canonicalYMD in YYYY-MM-DD)
  const getResultDateInfo = (
    rawDate?: string | null,
    createdAt?: string | null,
  ): { displayDate: string; canonicalYMD: string } => {
    const str =
      rawDate && typeof rawDate === 'string' && rawDate !== '-' && rawDate !== 'null'
        ? rawDate.trim()
        : createdAt && typeof createdAt === 'string' && createdAt !== '-' && createdAt !== 'null'
        ? createdAt.trim()
        : '';

    if (!str) {
      return {
        displayDate: '-',
        canonicalYMD: '',
      };
    }

    // 1. Match YYYY-MM-DD prefix directly (e.g. "2026-10-07" or "2026-10-07T22:00:02.000000Z")
    const ymd = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (ymd) {
      const y = ymd[1];
      const m = ymd[2];
      const d = ymd[3];
      return {
        canonicalYMD: `${y}-${m}-${d}`,
        displayDate: `${d}/${m}/${y}`,
      };
    }

    // 2. Match DD/MM/YYYY prefix directly (e.g. "07/10/2026")
    const dmy = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (dmy) {
      const d = dmy[1].padStart(2, '0');
      const m = dmy[2].padStart(2, '0');
      const y = dmy[3];
      return {
        canonicalYMD: `${y}-${m}-${d}`,
        displayDate: `${d}/${m}/${y}`,
      };
    }

    // Fallback if full date parsing is needed
    const parsed = new Date(str);
    if (!Number.isNaN(parsed.getTime())) {
      const y = parsed.getFullYear();
      const m = `${parsed.getMonth() + 1}`.padStart(2, '0');
      const d = `${parsed.getDate()}`.padStart(2, '0');
      return {
        canonicalYMD: `${y}-${m}-${d}`,
        displayDate: `${d}/${m}/${y}`,
      };
    }

    return {
      displayDate: '-',
      canonicalYMD: '',
    };
  };

  // 3. Format Result Time
  const formatResultTime = (timeVal?: string, createdAt?: string): string => {
    const val = timeVal || createdAt;
    if (!val) return '-';
    const str = String(val).trim();
    // If already a 12-hour formatted time (e.g. "10:37 AM")
    if (/^\d{1,2}:\d{2}\s*(?:AM|PM)$/i.test(str)) {
      return str;
    }
    const match = str.match(/^(\d{1,2}):(\d{2})/);
    if (match) {
      const h = Number(match[1]);
      const min = Number(match[2]);
      const d = new Date();
      d.setHours(h, min, 0, 0);
      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    const parsed = new Date(str);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
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

    const formatGamePrice = (priceVal?: any, fallback?: string): string => {
      if (priceVal !== undefined && priceVal !== null && priceVal !== '') {
        const num = parseFloat(String(priceVal).replace(/[$,]/g, ''));
        if (!Number.isNaN(num)) {
          return `$${num.toLocaleString('en-US')}`;
        }
      }
      return fallback || '$4,000';
    };

    let badge: WinnerItem['badge'] = {
      type: 'cash',
      title: 'PICK 4',
      amount: formatGamePrice(game?.price, '$4,000'),
      gradient: 'linear-gradient(135deg, #15AE36 0%, #0EA63F 100%)',
    };

    if (gameSlug.includes('zdt') || gameName.toLowerCase().includes('zdt')) {
      badge = {
        type: 'cash',
        title: 'ZDT',
        amount: formatGamePrice(game?.price, '$1,000'),
        gradient: 'linear-gradient(135deg, #5B00F0 0%, #7A1DFF 100%)',
      };
    } else if (gameSlug.includes('pick-3') || gameName.toLowerCase().includes('pick 3')) {
      badge = {
        type: 'cash',
        title: 'PICK 3',
        amount: formatGamePrice(game?.price, '$3,000'),
        gradient: 'linear-gradient(135deg, #FF6104 0%, #FE8C00 100%)',
      };
    } else if (gameSlug.includes('pick-4') || gameName.toLowerCase().includes('pick 4')) {
      badge = {
        type: 'cash',
        title: 'PICK 4',
        amount: formatGamePrice(game?.price, '$4,000'),
        gradient: 'linear-gradient(135deg, #15AE36 0%, #0EA63F 100%)',
      };
    } else if (gameSlug.includes('pick-5') || gameName.toLowerCase().includes('pick 5')) {
      badge = {
        type: 'cash',
        title: 'PICK 5',
        amount: formatGamePrice(game?.price, '$5,000'),
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

    let avatarUrl: string | null = user?.image_url || user?.image || null;
    if (avatarUrl && typeof avatarUrl === 'string') {
      if (avatarUrl.includes('https://lh3.googleusercontent.com')) {
        avatarUrl = avatarUrl.substring(avatarUrl.indexOf('https://lh3.googleusercontent.com'));
      } else if (avatarUrl.startsWith('http') && avatarUrl.lastIndexOf('http') > 0) {
        avatarUrl = avatarUrl.substring(avatarUrl.lastIndexOf('http'));
      }
    }

    return {
      id: raw?.id || index + 1,
      name,
      drawTime,
      gameName,
      avatarUrl,
      badge,
    };
  };

  // 5. Normalize Result Item from API
  const normalizeResult = (raw: any, index: number, isMidday = false): ResultItem => {
    let resultType = raw?.result_type || raw?.type || (isMidday ? 'Midday' : 'Daily');
    resultType = resultType.charAt(0).toUpperCase() + resultType.slice(1);

    const totalVal = raw?.total ?? raw?.amount ?? raw?.price;
    let formattedAmount = '-';
    if (totalVal !== undefined && totalVal !== null && totalVal !== '') {
      const cleanStr = String(totalVal).replace(/[$,]/g, '').trim();
      const num = parseFloat(cleanStr);
      if (!Number.isNaN(num)) {
        formattedAmount = `$${num.toFixed(2)}`;
      } else {
        formattedAmount = String(totalVal).startsWith('$') ? String(totalVal) : `$${totalVal}`;
      }
    }

    const rawCreatedAt = raw?.created_at || raw?.createdAt;
    const rawDate = raw?.draw_date || raw?.drawDate || raw?.date;
    const rawTime = raw?.draw_time || raw?.drawTime || raw?.time;
    const dateInfo = getResultDateInfo(rawDate, rawCreatedAt);

    return {
      id: raw?.id || index + 1,
      resultType,
      zipCode: raw?.zip_code || raw?.zip || raw?.zipcode || '-',
      date: dateInfo.displayDate,
      time: formatResultTime(rawTime, rawCreatedAt),
      state: raw?.state || '',
      amount: formattedAmount,
      createdAt: rawCreatedAt,
      rawDate: rawDate,
      canonicalYMD: dateInfo.canonicalYMD,
    };
  };

  // Fetch Winners list
  const loadWinners = useCallback(async () => {
    setWinnersLoading(true);
    setWinnersError(null);
    try {
      const res = await winnerServices.getAllWinners();
      const raw = res?.data;
      const rawList =
        Array.isArray(raw?.data?.data)
          ? raw.data.data
          : Array.isArray(raw?.data)
          ? raw.data
          : Array.isArray(raw?.winners)
          ? raw.winners
          : Array.isArray(raw?.data?.winners)
          ? raw.data.winners
          : Array.isArray(raw)
          ? raw
          : Array.isArray(res?.data?.data?.data)
          ? res.data.data.data
          : Array.isArray(res?.data?.data)
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

  // Fetch Results by game slug
  const loadResults = useCallback(async (slug: string) => {
    setResultsLoading(true);
    setResultsError(null);
    setResults([]); // Clear results immediately to avoid stale data display
    try {
      const targetSlug =
        slug === 'state-2500' ? '2500-game-state' : slug;

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
      const list = data.map((item: any, i: number) => normalizeResult(item, i));
      setResults(list);
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

  // Format YYYY-MM-DD from date input to DD/MM/YYYY for display matching the table
  const formatDisplayFilterDate = (ymd: string): string => {
    if (!ymd) return '';
    const parts = ymd.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return ymd;
  };

  // Filtered results by actual game result date
  const filteredResults = useMemo(() => {
    if (!selectedDateFilter) return results;
    return results.filter((item) => item.canonicalYMD === selectedDateFilter);
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Previous Winners' Video Showcase (Client 5th Point) */}
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: '24px',
              padding: '20px 16px',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            {/* Section Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '12px',
                    background: 'rgba(245, 158, 11, 0.15)',
                    border: '1px solid rgba(245, 158, 11, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#F59E0B',
                    flexShrink: 0,
                  }}
                >
                  <Video size={19} />
                </div>
                <div>
                  <h3
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: '16.5px',
                      fontWeight: 800,
                      color: 'var(--text-main)',
                      margin: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span>Previous Winners' Videos</span>
                    <Sparkles size={14} color="#F59E0B" />
                  </h3>
                  <p
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                      margin: '2px 0 0 0',
                    }}
                  >
                    Watch real winner celebrations & previous winner stories
                  </p>
                </div>
              </div>

              <span
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  background: 'rgba(0, 208, 102, 0.12)',
                  border: '1px solid rgba(0, 208, 102, 0.3)',
                  color: '#00D066',
                  borderRadius: '20px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                }}
              >
                {PREVIOUS_WINNERS_VIDEOS.length} Featured Videos
              </span>
            </div>

            {/* Video Cards Grid - 3 cards in row 1, 2 cards in row 2 */}
            <div className="previous-winners-video-grid">
              {PREVIOUS_WINNERS_VIDEOS.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setActiveVideoModal(item)}
                  style={{
                    background: 'var(--bg-card-secondary, #F8FAFC)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '18px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 8px 22px rgba(0,0,0,0.12)';
                    e.currentTarget.style.borderColor = '#F59E0B';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                  }}
                >
                  {/* Video Thumbnail Box with Glowing Play Button */}
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      paddingTop: '62%',
                      background: '#0B0F19',
                      overflow: 'hidden',
                    }}
                  >
                    <video
                      src={item.videoUrl}
                      preload="metadata"
                      muted
                      playsInline
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        opacity: 0.72,
                      }}
                    />
                    {/* Gradient Overlay */}
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.7) 100%)',
                      }}
                    />

                    {/* Tag badge on top */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '8px',
                        left: '8px',
                        background: 'rgba(0, 0, 0, 0.7)',
                        backdropFilter: 'blur(4px)',
                        borderRadius: '8px',
                        padding: '2px 8px',
                        fontSize: '10px',
                        fontWeight: 700,
                        color: '#FBBF24',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Trophy size={10} color="#FBBF24" />
                      <span>{item.tag}</span>
                    </div>

                    {/* Big Center Glowing Play Button */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #00D066 0%, #009944 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFFFFF',
                        boxShadow: '0 4px 16px rgba(0, 208, 102, 0.55)',
                      }}
                    >
                      <Play size={18} fill="#FFFFFF" style={{ marginLeft: '2px' }} />
                    </div>
                  </div>

                  {/* Card Content with Previous Winner Name */}
                  <div
                    style={{
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      flex: 1,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        flexWrap: 'nowrap',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#F59E0B',
                          textTransform: 'uppercase',
                          letterSpacing: '0.4px',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                        }}
                      >
                        Previous Winner
                      </span>
                      <span
                        style={{
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                          fontSize: '12px',
                          fontWeight: 800,
                          color: '#00D066',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                        }}
                      >
                        {item.prizeAmount}
                      </span>
                    </div>

                    <h4
                      style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontSize: '15px',
                        fontWeight: 800,
                        color: 'var(--text-main)',
                        margin: '2px 0 0 0',
                      }}
                    >
                      {item.winnerName}
                    </h4>

                    <p
                      style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontSize: '12px',
                        color: 'var(--text-muted)',
                        margin: '0 0 8px 0',
                      }}
                    >
                      {item.gameTitle}
                    </p>

                    <button
                      type="button"
                      style={{
                        marginTop: 'auto',
                        width: '100%',
                        padding: '7px 10px',
                        borderRadius: '10px',
                        background: 'rgba(0, 208, 102, 0.1)',
                        border: '1px solid rgba(0, 208, 102, 0.25)',
                        color: '#00D066',
                        fontSize: '12px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Play size={12} fill="currentColor" />
                      <span>Watch Winner Video</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Subheader: Recent Daily Winners */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
            <Trophy size={17} color="#F59E0B" />
            <h3
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '16px',
                fontWeight: 800,
                color: 'var(--text-main)',
                margin: 0,
              }}
            >
              Recent Daily Winners
            </h3>
          </div>

          {/* Winner List */}
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

            {/* Custom Date Filter Pill matching Game Select Dropdown */}
            <div style={{ position: 'relative' }}>
              <div
                onClick={openDatePicker}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '24px',
                  background: 'var(--bg-card)',
                  color: selectedDateFilter ? 'var(--text-main)' : 'var(--text-muted)',
                  border: '1px solid var(--border-color)',
                  fontSize: '13.5px',
                  fontWeight: selectedDateFilter ? 700 : 500,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  minHeight: '45px',
                  boxSizing: 'border-box',
                }}
              >
                {/* Formatted Date or Placeholder matching table format (DD/MM/YYYY) */}
                <span
                  style={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    pointerEvents: 'none',
                    userSelect: 'none',
                  }}
                >
                  {selectedDateFilter
                    ? formatDisplayFilterDate(selectedDateFilter)
                    : t('winners.selectDate', 'Select date')}
                </span>

                {/* Right controls: Clear (X) + Calendar Icon */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', zIndex: 2 }}>
                  {selectedDateFilter && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setSelectedDateFilter('');
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title="Clear date filter"
                    >
                      <X size={15} />
                    </button>
                  )}
                  <Calendar size={18} color="#009944" style={{ pointerEvents: 'none', flexShrink: 0 }} />
                </div>

                {/* Native date input overlaying the pill for full cross-browser picker support */}
                <input
                  ref={dateInputRef}
                  type="date"
                  value={selectedDateFilter}
                  onChange={(e) => setSelectedDateFilter(e.target.value)}
                  onInput={(e: any) => setSelectedDateFilter(e.target.value)}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: selectedDateFilter ? '36px' : 0,
                    bottom: 0,
                    width: selectedDateFilter ? 'calc(100% - 36px)' : '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'pointer',
                    zIndex: 1,
                  }}
                  aria-label="Filter by result date"
                />
              </div>
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
                className="results-table-header"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.1fr 1.1fr 1.2fr 1fr',
                  background: '#00D066',
                  color: '#052E16',
                  padding: '12px 10px',
                  fontSize: '12px',
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
                className="results-table-header"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.1fr 1.2fr 1.1fr 1fr',
                  background: '#00D066',
                  color: '#052E16',
                  padding: '12px 10px',
                  fontSize: '12px',
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
                  className="results-table-row"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: isZdtSelected
                      ? '1.1fr 1.1fr 1.2fr 1fr'
                      : '1.1fr 1.2fr 1.1fr 1fr',
                    padding: '11px 8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--text-main)',
                    borderBottom: '1px solid var(--border-color)',
                    background: idx % 2 === 0 ? 'transparent' : 'var(--bg-secondary, rgba(128, 128, 128, 0.05))',
                    alignItems: 'center',
                    textAlign: 'center',
                  }}
                >
                  {/* Column 1: Result Type */}
                  <span style={{ borderRight: '1px solid var(--border-color)', padding: '0 4px', wordBreak: 'break-word' }}>
                    {item.resultType}
                  </span>

                  {/* Column 2: Zip Code (ZDT) or Result Date (Others) */}
                  <span style={{ borderRight: '1px solid var(--border-color)', padding: '0 4px', wordBreak: 'break-word' }}>
                    {isZdtSelected ? item.zipCode : item.date}
                  </span>

                  {/* Column 3: Date (ZDT) or Amount (Others) */}
                  <span style={{ borderRight: '1px solid var(--border-color)', padding: '0 4px', wordBreak: 'break-word' }}>
                    {isZdtSelected ? item.date : item.amount}
                  </span>

                  {/* Column 4: Time */}
                  <span style={{ padding: '0 4px', wordBreak: 'break-word' }}>
                    {item.time}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Video Modal Player matching modern sleek dark theme */}
      {activeVideoModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            animation: 'fadeIn 0.2s ease-out',
          }}
          onClick={() => setActiveVideoModal(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '620px',
              background: '#16181D',
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              display: 'flex',
              flexDirection: 'column',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 20px',
                background: '#1F2228',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: 'rgba(245, 158, 11, 0.15)',
                    border: '1px solid rgba(245, 158, 11, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#F59E0B',
                    flexShrink: 0,
                  }}
                >
                  <Trophy size={18} />
                </div>
                <div>
                  <h4
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: '16px',
                      fontWeight: 800,
                      color: '#FFFFFF',
                      margin: 0,
                    }}
                  >
                    {activeVideoModal.winnerName}
                  </h4>
                  <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '2px 0 0 0' }}>
                    {activeVideoModal.gameTitle} • <strong style={{ color: '#00D066' }}>{activeVideoModal.prizeAmount}</strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveVideoModal(null)}
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#9CA3AF',
                  transition: 'background 0.2s ease, color 0.2s ease',
                }}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Video Container */}
            <div
              style={{
                background: '#000000',
                padding: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '340px',
              }}
            >
              <video
                key={activeVideoModal.videoUrl}
                controls
                autoPlay
                playsInline
                style={{
                  width: '100%',
                  maxHeight: '65vh',
                  borderRadius: '14px',
                  background: '#000',
                  outline: 'none',
                }}
              >
                <source src={activeVideoModal.videoUrl} type="video/mp4" />
                <source src={activeVideoModal.videoUrl} type="video/quicktime" />
                Your browser does not support HTML5 video.
              </video>
            </div>

            {/* Modal Footer with Video Details */}
            <div
              style={{
                padding: '14px 20px',
                background: '#1F2228',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={15} color="#F59E0B" />
                <span style={{ fontSize: '12px', color: '#CBD5E1' }}>
                  {activeVideoModal.description || 'Verified Winner Story'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setActiveVideoModal(null)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
};

export default Winners;
