import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Play,
  Maximize,
  Volume2,
  VolumeX,
  Sparkles,
  Receipt,
  Trophy,
  Gift,
  CheckCircle2,
} from 'lucide-react';
import { Container } from '../../components';
import images from '../../constants/images';
import { cashGamesVideos } from '../../config';

export const AboutUs: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);

  // Intro video URL
  const videoUrl =
    cashGamesVideos.find((v) => v.id === 2)?.videoUrl ||
    'https://receipts-to-riches.koderspedia.live/images/game-guide/video-folder/CASH%20GAMES%20%E2%80%94%20DAILY%20DRAW%20/Pick%203%20Game.mov';

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const total = videoRef.current.duration || 1;
    setProgress((current / total) * 100);
  };

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  return (
    <Container maxWidth="1160px" style={{ gap: '28px', paddingBottom: '60px' }}>
      {/* Top Header Bar */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          paddingTop: '6px',
        }}
      >
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
            {t('aboutUs.title', 'About Us')}
          </h1>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Learn about Receipts To Riches and how to win real rewards
          </span>
        </div>
      </div>

      {/* Main 2-Column Web Hero Section */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '32px',
          alignItems: 'center',
          width: '100%',
          background: 'var(--bg-card)',
          borderRadius: '24px',
          padding: '36px',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-md)',
          boxSizing: 'border-box',
        }}
      >
        {/* Left Column: Rich Typography & Text */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '999px',
              background: 'rgba(0, 230, 118, 0.12)',
              border: '1px solid rgba(0, 230, 118, 0.3)',
              color: '#00C853',
              fontSize: '12px',
              fontWeight: 700,
              width: 'fit-content',
            }}
          >
            <Sparkles size={14} />
            <span>Turn Receipts into Real Fortune</span>
          </div>

          {/* Emerald Green Main Title */}
          <h2
            style={{
              fontSize: '32px',
              fontWeight: 800,
              color: '#00E676',
              lineHeight: 1.25,
              margin: 0,
              textShadow: '0 2px 16px rgba(0, 230, 118, 0.25)',
              letterSpacing: '-0.02em',
            }}
          >
            {t('aboutUs.uniqueLine1', 'Receipts To Riches™')}<br />
            {t('aboutUs.uniqueLine2', 'is truly unique !')}
          </h2>

          {/* Red Subtitle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '18px',
                fontWeight: 800,
                color: '#FF3B30',
                letterSpacing: '-0.01em',
              }}
            >
              {t('aboutUs.watchVideo', 'Watch Our Video')}
            </span>
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#FF3B30',
                boxShadow: '0 0 8px #FF3B30',
              }}
            />
          </div>

          {/* Paragraph with Green Highlights */}
          <p
            style={{
              fontSize: '15px',
              color: 'var(--text-main)',
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            {t('aboutUs.middlePart1', 'You use your daily, everyday receipts to')}{' '}
            <strong style={{ color: '#00E676', fontWeight: 800 }}>
              {t('aboutUs.middleBold1', 'win up to 10 Million Dollars...')}
            </strong>{' '}
            {t('aboutUs.middlePart2', "and it's")}{' '}
            <strong style={{ color: '#00E676', fontWeight: 800 }}>
              {t('aboutUs.middleBold2', 'Free to play!')}
            </strong>{' '}
            {t('aboutUs.middlePart3', 'Simply save your receipts, create your account and Play our Games!')}
          </p>

          {/* Red Outlined Callout Box matching Screenshot */}
          <div
            style={{
              borderRadius: '18px',
              border: '2px solid #FF3B30',
              background: 'rgba(255, 59, 48, 0.05)',
              padding: '16px 22px',
              boxSizing: 'border-box',
            }}
          >
            <p
              style={{
                fontSize: '16px',
                fontWeight: 800,
                color: '#FF3B30',
                lineHeight: 1.5,
                margin: 0,
                letterSpacing: '-0.01em',
              }}
            >
              {t('aboutUs.orangeLine1', 'Play everyday and')}{' '}
              {t('aboutUs.orangeLine2', 'increase your')}{' '}
              {t('aboutUs.orangeLine3', 'chances to win!')}
            </p>
          </div>

          {/* Unlimited Entries Highlights */}
          <p
            style={{
              fontSize: '15px',
              color: 'var(--text-main)',
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            {t('aboutUs.bottomPart1', 'Receipts can be entered in')}{' '}
            <strong style={{ color: '#00E676', fontWeight: 800 }}>
              {t('aboutUs.bottomBold1', 'Multiple Games')}
            </strong>{' '}
            {t('aboutUs.bottomPart2', 'and the')}{' '}
            <strong style={{ color: '#00E676', fontWeight: 800 }}>
              {t('aboutUs.bottomBold2', 'Entries are Unlimited!')}
            </strong>
          </p>
        </div>

        {/* Right Column: Web Video Card */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            borderRadius: '22px',
            overflow: 'hidden',
            background: '#0B0F19',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
            aspectRatio: '16/9',
            cursor: 'pointer',
          }}
          onClick={togglePlay}
        >
          <video
            ref={videoRef}
            src={videoUrl}
            poster={images.aboutus}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setIsPlaying(false)}
            playsInline
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />

          {/* Logo Watermark Top-Left */}
          <div
            style={{
              position: 'absolute',
              top: '14px',
              left: '16px',
              zIndex: 3,
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
            }}
          >
            <img
              src={images.SplashLogo}
              alt="Logo"
              style={{ width: '40px', height: '40px', objectFit: 'contain' }}
            />
          </div>

          {/* Center Play Button Overlay */}
          {!isPlaying && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.95)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                zIndex: 3,
                transition: 'transform 0.2s ease',
              }}
            >
              <Play size={30} color="#000000" fill="#000000" style={{ marginLeft: '4px' }} />
            </div>
          )}

          {/* Bottom Video Controls Bar */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '12px 16px',
              background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.88) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '14px',
              zIndex: 3,
            }}
          >
            {/* Progress track */}
            <div
              style={{
                flex: 1,
                height: '5px',
                borderRadius: '3px',
                background: 'rgba(255,255,255,0.3)',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  background: '#00E676',
                  transition: 'width 0.15s linear',
                }}
              />
            </div>

            {/* Mute Button */}
            <button
              type="button"
              onClick={toggleMute}
              style={{
                background: 'none',
                border: 'none',
                color: '#FFFFFF',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '4px',
              }}
            >
              {isMuted ? <VolumeX size={19} /> : <Volume2 size={19} />}
            </button>

            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              style={{
                background: 'none',
                border: 'none',
                color: '#FFFFFF',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '4px',
              }}
            >
              <Maximize size={19} />
            </button>
          </div>
        </div>
      </div>

      {/* Web Feature Steps Cards (Expansive Desktop Web Feel) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
          width: '100%',
        }}
      >
        <div
          className="card"
          style={{
            padding: '24px',
            borderRadius: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(0, 230, 118, 0.12)',
              color: '#00C853',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Receipt size={24} />
          </div>
          <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            1. Save & Scan Receipts
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
            Every receipt from grocery stores, gas stations, shopping malls, and restaurants qualifies for game entries.
          </p>
        </div>

        <div
          className="card"
          style={{
            padding: '24px',
            borderRadius: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(255, 178, 36, 0.15)',
              color: '#F59E0B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Trophy size={24} />
          </div>
          <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            2. Enter Cash & Instant Games
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
            Play Pick 3, Pick 4, Pick 5, ZDT, Pic Pick, and State Games. Entries are 100% free and unlimited!
          </p>
        </div>

        <div
          className="card"
          style={{
            padding: '24px',
            borderRadius: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(59, 130, 246, 0.12)',
              color: '#3B82F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Gift size={24} />
          </div>
          <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            3. Win Cash & Vouchers
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
            Redeem rewards for PayPal cash, gift cards at Starbucks, McDonald's, Walmart, or multiplier passes!
          </p>
        </div>
      </div>
    </Container>
  );
};

export default AboutUs;
