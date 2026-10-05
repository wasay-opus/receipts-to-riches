import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Search,
  SlidersHorizontal,
  X,
  Clock,
  Calendar,
  FileText,
  Plus,
  Filter,
  Check,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { Container, showToast } from '../../components';
import gameServices from '../../services/gameServices';

// Filter game options matching mobile screenshots
export const GAME_FILTER_OPTIONS = [
  { id: 'all', label: 'All Games' },
  { id: 'pick-3', label: 'PICK 3', matchKeywords: ['pick 3', 'pick-3', 'pick3'] },
  { id: 'pic-pick-2500', label: 'Pic Pick - $2500 Game', matchKeywords: ['pic pick', 'pic-pick', 'picpick'], prize: 2500 },
  { id: 'zdt', label: 'ZDT', matchKeywords: ['zdt', 'zip', 'zip-date-time', 'zip code'] },
  { id: 'pic-pick-1000', label: 'Pic Pick - $1000 Game', matchKeywords: ['pic pick', 'pic-pick', 'picpick'], prize: 1000 },
  { id: 'pic-pick-500', label: 'Pic Pick - $500 Game', matchKeywords: ['pic pick', 'pic-pick', 'picpick'], prize: 500 },
  { id: 'state-1500', label: 'State - $1500 Game', matchKeywords: ['state', 'state-game', 'state pick'], prize: 1500 },
  { id: 'state-2500', label: 'State - $2500 Game', matchKeywords: ['state', 'state-game', 'state pick'], prize: 2500 },
  { id: 'state-3500', label: 'State - $3500 Game', matchKeywords: ['state', 'state-game', 'state pick'], prize: 3500 },
  { id: 'pick-4', label: 'PICK 4', matchKeywords: ['pick 4', 'pick-4', 'pick4'] },
  { id: 'pick-5', label: 'PICK 5', matchKeywords: ['pick 5', 'pick-5', 'pick5'] },
];

const getReceiptList = (payload: any): any[] => {
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
};

const getReceiptImageUrl = (item: any): string => {
  return (
    item?.receipt_image ||
    item?.image_url ||
    item?.receipt_url ||
    item?.image ||
    item?.receipt ||
    item?.file_url ||
    item?.media_url ||
    item?.url ||
    item?.path ||
    ''
  );
};

const getGameBadgeLabel = (item: any): string => {
  const slug = String(item?.game_slug || item?.slug || item?.type || item?.game?.slug || '').toLowerCase();
  const rawName = String(item?.game?.name || item?.name || '').trim();

  if (slug === 'zdt' || slug.includes('zdt')) {
    return 'ZDT';
  }
  if (slug === 'pick-3' || slug.includes('pick-3') || slug.includes('pick3')) {
    return 'PICK 3';
  }
  if (slug === 'pick-4' || slug.includes('pick-4') || slug.includes('pick4')) {
    return 'PICK 4';
  }
  if (slug === 'pick-5' || slug.includes('pick-5') || slug.includes('pick5')) {
    return 'PICK 5';
  }

  // State Games (Screenshot 2: State – $1500 Game)
  if (slug.includes('state')) {
    if (slug.includes('1500') || rawName.includes('1500') || String(item?.game?.price).includes('1500')) {
      return 'State – $1500 Game';
    }
    if (slug.includes('2500') || rawName.includes('2500') || String(item?.game?.price).includes('2500')) {
      return 'State – $2500 Game';
    }
    if (slug.includes('3500') || rawName.includes('3500') || String(item?.game?.price).includes('3500')) {
      return 'State – $3500 Game';
    }
    return rawName || 'State – $1500 Game';
  }

  // Pic Pick Games (Screenshot 5: Pic Pick – $2500 Game)
  if (slug.includes('pic-pick') || slug.includes('picpick')) {
    if (slug.includes('500') || rawName.includes('500') || String(item?.game?.price).includes('500')) {
      return 'Pic Pick – $500 Game';
    }
    if (slug.includes('1000') || rawName.includes('1000') || String(item?.game?.price).includes('1000')) {
      return 'Pic Pick – $1000 Game';
    }
    if (slug.includes('2500') || rawName.includes('2500') || String(item?.game?.price).includes('2500')) {
      return 'Pic Pick – $2500 Game';
    }
    return rawName || 'Pic Pick – $2500 Game';
  }

  if (rawName) return rawName;
  if (item?.store || item?.store_name) return item.store || item.store_name;
  return 'PICK 3';
};

const getFormattedPrize = (item: any): string | null => {
  const slug = String(item?.game_slug || item?.slug || item?.type || item?.game?.slug || '').toLowerCase();
  // ZDT does not show receipt amount in mobile (Screenshot 4)
  if (slug === 'zdt' || slug.includes('zdt')) {
    return null;
  }

  const rawTotal = item?.total ?? item?.amount ?? item?.receipt_total;
  if (rawTotal !== undefined && rawTotal !== null && rawTotal !== '') {
    const num = Number(rawTotal);
    if (!isNaN(num)) {
      return `$${num.toFixed(2)}`;
    }
    return String(rawTotal).startsWith('$') ? String(rawTotal) : `$${rawTotal}`;
  }

  return null;
};

const formatReceiptTime = (timeVal?: string, dateVal?: string): string => {
  if (timeVal) {
    if (/^\d{1,2}:\d{2}/.test(timeVal)) {
      const parts = timeVal.split(':');
      let h = parseInt(parts[0], 10);
      const m = parts[1];
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
    }
    const d = new Date(timeVal);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return timeVal;
  }
  if (dateVal) {
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  }
  return '09:45 AM';
};

const formatReceiptDate = (dateVal?: string): string => {
  if (!dateVal) return 'Oct 01, 2026';
  const d = new Date(dateVal);
  if (!isNaN(d.getTime())) {
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
  }
  return dateVal;
};

export const MyReceipts: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);

  // Filter States
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedGameFilter, setSelectedGameFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  // Temp Filter States inside Modal before applying
  const [tempGameFilter, setTempGameFilter] = useState('all');
  const [tempSortBy, setTempSortBy] = useState<'newest' | 'oldest'>('newest');

  useEffect(() => {
    let isMounted = true;

    const loadReceipts = async () => {
      setLoading(true);
      try {
        const response = await gameServices.getUserReceipts(1);
        if (isMounted) {
          const raw = getReceiptList(response?.data);
          setReceipts(raw);
        }
      } catch (error: any) {
        if (isMounted) {
          showToast({
            type: 'error',
            text1: t('myReceipts.notLoadedTitle', 'Receipts not loaded'),
            text2: error?.message || t('myReceipts.tryAgain', 'Please try again.'),
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadReceipts();
    return () => {
      isMounted = false;
    };
  }, []);

  const openFilterModal = () => {
    setTempGameFilter(selectedGameFilter);
    setTempSortBy(sortBy);
    setIsFilterOpen(true);
  };

  const applyFilters = () => {
    setSelectedGameFilter(tempGameFilter);
    setSortBy(tempSortBy);
    setIsFilterOpen(false);
  };

  const clearFilters = () => {
    setTempGameFilter('all');
    setTempSortBy('newest');
    setSelectedGameFilter('all');
    setSortBy('newest');
  };

  // Active filter count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedGameFilter !== 'all') count += 1;
    if (sortBy !== 'newest') count += 1;
    return count;
  }, [selectedGameFilter, sortBy]);

  // Filter & Sort Logic
  const filteredAndSortedReceipts = useMemo(() => {
    let list = [...receipts];

    // 1. Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((r) => {
        const label = getGameBadgeLabel(r).toLowerCase();
        const store = String(r.store || r.store_name || '').toLowerCase();
        const date = String(r.date || r.created_at || '').toLowerCase();
        return label.includes(q) || store.includes(q) || date.includes(q);
      });
    }

    // 2. Game Filter
    if (selectedGameFilter !== 'all') {
      const opt = GAME_FILTER_OPTIONS.find((o) => o.id === selectedGameFilter);
      if (opt) {
        list = list.filter((r) => {
          const badge = getGameBadgeLabel(r).toLowerCase();
          const slug = String(r.game_slug || r.type || r.game?.slug || '').toLowerCase();
          const store = String(r.store || r.store_name || '').toLowerCase();
          const prize = Number(r.total || r.amount || r.prize || r.game?.prize || 0);

          const matchesKeyword = opt.matchKeywords.some(
            (k) => slug.includes(k) || badge.includes(k) || store.includes(k),
          );

          if (!matchesKeyword) return false;
          if (opt.prize) {
            return prize === opt.prize || badge.includes(String(opt.prize)) || slug.includes(String(opt.prize));
          }
          return true;
        });
      }
    }

    // 3. Sort By
    list.sort((a, b) => {
      const timeA = new Date(a.date || a.played_at || a.created_at || 0).getTime();
      const timeB = new Date(b.date || b.played_at || b.created_at || 0).getTime();
      return sortBy === 'newest' ? timeB - timeA : timeA - timeB;
    });

    return list;
  }, [receipts, searchQuery, selectedGameFilter, sortBy]);

  return (
    <Container maxWidth="1160px" style={{ gap: '22px', paddingBottom: '60px' }}>
      {/* 1. Header Bar */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '6px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-main)',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all 0.2s ease',
            }}
            aria-label={t('common.back', 'Back')}
          >
            <ArrowLeft size={20} />
          </button>

          <div>
            <h1
              style={{
                fontSize: '24px',
                fontWeight: 800,
                color: 'var(--text-main)',
                margin: 0,
                letterSpacing: '-0.02em',
              }}
            >
              {t('myReceipts.title', 'My Receipts')}
            </h1>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              {t('myReceipts.receiptsUploadedCount', '{{count}} Receipts Uploaded', {
                count: receipts.length,
              })}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/scan')}
          className="btn-primary"
          style={{
            padding: '10px 20px',
            borderRadius: '14px',
            fontSize: '14px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 14px rgba(0, 103, 77, 0.25)',
          }}
          title={t('myReceipts.scanNew', 'Scan New')}
        >
          <Plus size={18} />
          <span>{t('myReceipts.scanNew', 'Scan New Receipt')}</span>
        </button>
      </div>

      {/* 2. Search, Filter Bar & Quick Chips for Web */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          background: 'var(--bg-card)',
          borderRadius: '20px',
          padding: '18px 22px',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
          {/* Search Input Box */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'var(--bg-card-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '14px',
              padding: '11px 16px',
              boxSizing: 'border-box',
            }}
          >
            <Search size={18} color="var(--text-muted)" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('myReceipts.searchPlaceholder', 'Search receipts by game, date, or store...')}
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                outline: 'none',
                color: 'var(--text-main)',
                fontSize: '14px',
                fontFamily: 'inherit',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '2px',
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Filter Button with Active Badge */}
          <button
            type="button"
            onClick={openFilterModal}
            style={{
              height: '46px',
              padding: '0 18px',
              borderRadius: '14px',
              background: activeFiltersCount > 0 ? 'rgba(0, 230, 118, 0.12)' : 'var(--bg-card-secondary)',
              border: activeFiltersCount > 0 ? '1.5px solid #00E676' : '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: activeFiltersCount > 0 ? '#00C853' : 'var(--text-main)',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '14px',
              flexShrink: 0,
              position: 'relative',
              transition: 'all 0.2s ease',
            }}
            aria-label="Filter"
          >
            <SlidersHorizontal size={18} />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: '#00E676',
                  color: '#000000',
                  fontSize: '11px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: '2px',
                }}
              >
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Quick Filter Web Chips for 1-Click Filtering */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '2px',
            scrollbarWidth: 'none',
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0, marginRight: '4px' }}>
            Quick Filter:
          </span>
          {GAME_FILTER_OPTIONS.slice(0, 7).map((opt) => {
            const isSelected = selectedGameFilter === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSelectedGameFilter(opt.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '999px',
                  border: isSelected ? '1px solid #00E676' : '1px solid var(--border-color)',
                  background: isSelected ? '#00E676' : 'var(--bg-card-secondary)',
                  color: isSelected ? '#000000' : 'var(--text-main)',
                  fontSize: '12px',
                  fontWeight: isSelected ? 800 : 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Loading State */}
      {loading && receipts.length === 0 && (
        <div
          className="card"
          style={{
            padding: '48px 20px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            borderRadius: '20px',
          }}
        >
          {t('myReceipts.loadingReceipts', 'Loading receipts...')}
        </div>
      )}

      {/* 4. Empty State */}
      {!loading && filteredAndSortedReceipts.length === 0 && (
        <div
          className="card"
          style={{
            padding: '54px 24px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            borderRadius: '20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <FileText size={52} color="var(--text-muted)" />
          <p style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-main)' }}>
            {searchQuery || selectedGameFilter !== 'all'
              ? 'No receipts match your selected filters.'
              : t('myReceipts.noReceiptsYet', 'No receipts uploaded yet.')}
          </p>
          {(searchQuery || selectedGameFilter !== 'all') && (
            <button
              type="button"
              onClick={clearFilters}
              className="btn-primary"
              style={{ marginTop: '8px', padding: '10px 22px', borderRadius: '12px' }}
            >
              Reset Filters
            </button>
          )}
        </div>
      )}

      {/* 5. Modern Web Grid with Compact, Beautiful Receipt Cards */}
      {filteredAndSortedReceipts.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 185px))',
            gap: '18px',
            width: '100%',
          }}
        >
          {filteredAndSortedReceipts.map((receipt, index) => {
            const imgUrl = getReceiptImageUrl(receipt);
            const badgeLabel = getGameBadgeLabel(receipt);

            return (
              <div
                key={receipt.id ?? receipt.receipt_id ?? index}
                onClick={() => setSelectedReceipt(receipt)}
                style={{
                  position: 'relative',
                  aspectRatio: '3 / 4.2',
                  maxHeight: '250px',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  background: 'var(--bg-card)',
                  cursor: 'pointer',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.12)';
                  e.currentTarget.style.borderColor = '#00E676';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                }}
              >
                {/* Receipt Uploaded Image */}
                {imgUrl ? (
                  <img
                    src={imgUrl}
                    alt={badgeLabel}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'var(--bg-card-secondary)',
                    }}
                  >
                    <FileText size={36} color="var(--text-muted)" />
                  </div>
                )}

                {/* Bottom Game Label Overlay */}
                <div
                  style={{
                    position: 'relative',
                    zIndex: 2,
                    background: 'rgba(15, 23, 42, 0.88)',
                    backdropFilter: 'blur(8px)',
                    padding: '9px 8px',
                    textAlign: 'center',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <span
                    style={{
                      color: '#FFFFFF',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      display: 'block',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {badgeLabel}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. Filter Modal matching Screenshot 2 */}
      {isFilterOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1200,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            boxSizing: 'border-box',
          }}
          onClick={() => setIsFilterOpen(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '440px',
              background: '#121620',
              borderRadius: '24px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
              padding: '24px 26px',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              gap: '22px',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h2
                style={{
                  fontSize: '22px',
                  fontWeight: 800,
                  color: '#FFFFFF',
                  margin: 0,
                  letterSpacing: '-0.02em',
                }}
              >
                {t('myReceipts.filterTitle', 'Filter Receipts')}
              </h2>
              <button
                type="button"
                onClick={() => setIsFilterOpen(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                }}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Section 1: Filter by Game */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span
                style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  color: '#FFFFFF',
                }}
              >
                {t('myReceipts.filterByGame', 'Filter by Game')}
              </span>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                {GAME_FILTER_OPTIONS.map((opt) => {
                  const isSelected = tempGameFilter === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setTempGameFilter(opt.id)}
                      style={{
                        padding: '9px 18px',
                        borderRadius: '999px',
                        border: isSelected
                          ? '1.5px solid #00E676'
                          : '1px solid rgba(255, 255, 255, 0.15)',
                        background: isSelected ? '#00E676' : 'rgba(255, 255, 255, 0.05)',
                        color: isSelected ? '#000000' : '#E2E8F0',
                        fontSize: '13px',
                        fontWeight: isSelected ? 800 : 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {opt.id === 'all' ? t('myReceipts.allGames', 'All Games') : opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 2: Sort By */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span
                style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  color: '#FFFFFF',
                }}
              >
                {t('myReceipts.sortBy', 'Sort By')}
              </span>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setTempSortBy('newest')}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    borderRadius: '999px',
                    border:
                      tempSortBy === 'newest'
                        ? '1.5px solid #00E676'
                        : '1px solid rgba(255, 255, 255, 0.15)',
                    background:
                      tempSortBy === 'newest' ? '#00E676' : 'rgba(255, 255, 255, 0.05)',
                    color: tempSortBy === 'newest' ? '#000000' : '#E2E8F0',
                    fontSize: '13px',
                    fontWeight: tempSortBy === 'newest' ? 800 : 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {t('myReceipts.newestFirst', 'Newest First')}
                </button>
                <button
                  type="button"
                  onClick={() => setTempSortBy('oldest')}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    borderRadius: '999px',
                    border:
                      tempSortBy === 'oldest'
                        ? '1.5px solid #00E676'
                        : '1px solid rgba(255, 255, 255, 0.15)',
                    background:
                      tempSortBy === 'oldest' ? '#00E676' : 'rgba(255, 255, 255, 0.05)',
                    color: tempSortBy === 'oldest' ? '#000000' : '#E2E8F0',
                    fontSize: '13px',
                    fontWeight: tempSortBy === 'oldest' ? 800 : 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {t('myReceipts.oldestFirst', 'Oldest First')}
                </button>
              </div>
            </div>

            {/* Modal Bottom Action Buttons matching Screenshot 2 */}
            <div
              style={{
                display: 'flex',
                gap: '12px',
                marginTop: '10px',
                paddingTop: '16px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <button
                type="button"
                onClick={clearFilters}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '14px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'background 0.2s ease',
                }}
              >
                {t('myReceipts.clearAll', 'Clear All')}
              </button>
              <button
                type="button"
                onClick={applyFilters}
                style={{
                  flex: 1.4,
                  padding: '12px',
                  borderRadius: '14px',
                  background: '#00E676',
                  border: 'none',
                  color: '#000000',
                  fontSize: '14px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(0, 230, 118, 0.3)',
                  transition: 'transform 0.15s ease',
                }}
              >
                {t('myReceipts.applyFilters', 'Apply Filters')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Fullscreen Receipt Modal Viewer */}
      {selectedReceipt && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1300,
            background: 'rgba(0, 0, 0, 0.88)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            boxSizing: 'border-box',
          }}
          onClick={() => setSelectedReceipt(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '480px',
              maxHeight: '90vh',
              background: '#0E131F',
              borderRadius: '24px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Close Button */}
            <button
              type="button"
              onClick={() => setSelectedReceipt(null)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                zIndex: 10,
                background: 'rgba(255, 255, 255, 0.18)',
                border: 'none',
                borderRadius: '50%',
                width: '38px',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                cursor: 'pointer',
                transition: 'background 0.2s ease',
              }}
              aria-label="Close"
            >
              <X size={20} />
            </button>

            {/* Center Receipt Image Area */}
            <div
              style={{
                flex: 1,
                minHeight: '280px',
                maxHeight: '50vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                boxSizing: 'border-box',
                background: '#070A11',
              }}
            >
              {getReceiptImageUrl(selectedReceipt) ? (
                <img
                  src={getReceiptImageUrl(selectedReceipt)}
                  alt={getGameBadgeLabel(selectedReceipt)}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '44vh',
                    objectFit: 'contain',
                    borderRadius: '12px',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '200px',
                    height: '260px',
                    borderRadius: '12px',
                    background: '#1A2130',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    color: '#94A3B8',
                  }}
                >
                  <FileText size={48} color="#64748B" />
                  <span style={{ fontSize: '13px' }}>No receipt image</span>
                </div>
              )}
            </div>

            {/* Bottom Card / Info Sheet */}
            <div
              style={{
                background: '#131826',
                padding: '20px 24px 24px',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              {/* Top Row: Game Name & Emerald Green Prize */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <h3
                  style={{
                    fontSize: '19px',
                    fontWeight: 800,
                    color: '#FFFFFF',
                    margin: 0,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {getGameBadgeLabel(selectedReceipt)}
                </h3>
                {getFormattedPrize(selectedReceipt) && (
                  <span
                    style={{
                      fontSize: '19px',
                      fontWeight: 800,
                      color: '#00E676',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {getFormattedPrize(selectedReceipt)}
                  </span>
                )}
              </div>

              {/* Bottom Row: Contextual Game Fields matching Mobile Screenshots */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '16px',
                  paddingTop: '14px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                  width: '100%',
                }}
              >
                {/* 1. Receipt Time (Show for ZDT, PICK games, or when time exists and not State/PicPick) */}
                {(function() {
                  const slug = String(selectedReceipt?.game_slug || selectedReceipt?.slug || selectedReceipt?.type || selectedReceipt?.game?.slug || '').toLowerCase();
                  const isZdt = slug === 'zdt' || slug.includes('zdt');
                  const isPick = slug.includes('pick-3') || slug.includes('pick-4') || slug.includes('pick-5') || slug === 'pick 3' || slug === 'pick 4' || slug === 'pick 5';
                  const isState = slug.includes('state');
                  const isPicPick = slug.includes('pic-pick') || slug.includes('picpick');

                  const shouldShowTime = isZdt || isPick || (!isState && !isPicPick && selectedReceipt.time);

                  if (!shouldShowTime) return null;

                  return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          background: 'rgba(255, 255, 255, 0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#94A3B8',
                          flexShrink: 0,
                        }}
                      >
                        <Clock size={18} />
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: '#94A3B8', display: 'block' }}>
                          {t('myReceipts.receiptTime', 'Receipt Time')}
                        </span>
                        <strong style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
                          {formatReceiptTime(
                            selectedReceipt.time,
                            selectedReceipt.played_at || selectedReceipt.created_at,
                          )}
                        </strong>
                      </div>
                    </div>
                  );
                })()}

                {/* 2. Zip Code (Show for ZDT - Screenshot 4) */}
                {(function() {
                  const slug = String(selectedReceipt?.game_slug || selectedReceipt?.slug || selectedReceipt?.type || selectedReceipt?.game?.slug || '').toLowerCase();
                  const isZdt = slug === 'zdt' || slug.includes('zdt');

                  if (!isZdt && !selectedReceipt.zip_code) return null;

                  const zipVal = selectedReceipt.zip_code || selectedReceipt.zip || selectedReceipt.vendor_zip || '10001';

                  return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          background: 'rgba(255, 255, 255, 0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#94A3B8',
                          flexShrink: 0,
                        }}
                      >
                        <MapPin size={18} />
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: '#94A3B8', display: 'block' }}>
                          {t('myReceipts.zipCode', 'Zip Code')}
                        </span>
                        <strong style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
                          {zipVal}
                        </strong>
                      </div>
                    </div>
                  );
                })()}

                {/* 3. State (Show for State Game - Screenshot 2) */}
                {(function() {
                  const slug = String(selectedReceipt?.game_slug || selectedReceipt?.slug || selectedReceipt?.type || selectedReceipt?.game?.slug || '').toLowerCase();
                  const isState = slug.includes('state');

                  if (!isState && !selectedReceipt.state) return null;

                  const stateVal = selectedReceipt.state || selectedReceipt.state_name || selectedReceipt.state_code || 'CO';

                  return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          background: 'rgba(255, 255, 255, 0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#94A3B8',
                          flexShrink: 0,
                        }}
                      >
                        <MapPin size={18} />
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: '#94A3B8', display: 'block' }}>
                          {t('myReceipts.state', 'State')}
                        </span>
                        <strong style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
                          {stateVal}
                        </strong>
                      </div>
                    </div>
                  );
                })()}

                {/* 4. Date Submitted (Show on ALL games - Screenshots 2, 3, 4, 5) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#94A3B8',
                      flexShrink: 0,
                    }}
                  >
                    <Calendar size={18} />
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#94A3B8', display: 'block' }}>
                      {t('myReceipts.dateSubmitted', 'Date Submitted')}
                    </span>
                    <strong style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
                      {formatReceiptDate(
                        selectedReceipt.date ||
                          selectedReceipt.played_at ||
                          selectedReceipt.created_at,
                      )}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
};

export default MyReceipts;
