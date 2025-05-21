import { useState, useRef, useEffect } from 'react';
import openingVideo from './assets/opening.mp4';
import openingBg from './assets/opening-bg.jpg';
import openingBgm from './assets/opening-bgm.mp3';
import { AUDIO_VOLUME, RETRY_INTERVAL, MAX_RETRY_COUNT } from './audioSettings';

interface OpeningProps {
  onFinish: () => void;
}

function Opening({ onFinish }: OpeningProps) {
  const [isStarted, setIsStarted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const [isBgmPlaying, setIsBgmPlaying] = useState(false);

  useEffect(() => {
    const initBgm = async () => {
      try {
        const audio = new Audio(openingBgm);
        audio.loop = true;
        audio.volume = AUDIO_VOLUME;
        await audio.load();
        bgmRef.current = audio;
        setIsBgmPlaying(true);
      } catch (error) {
        console.error('Opening BGMの初期化に失敗しました:', error);
      }
    };

    if (!isStarted) {
      initBgm();
    }

    return () => {
      if (bgmRef.current) {
        bgmRef.current.pause();
        bgmRef.current = null;
      }
    };
  }, [isStarted]);

  useEffect(() => {
    if (!bgmRef.current || !isBgmPlaying) return;

    let retryCount = 0;
    let isUnmounted = false;

    const attemptPlay = async () => {
      if (isUnmounted || !bgmRef.current) return;

      try {
        await bgmRef.current.play();
        console.log('Opening BGM再生開始');
      } catch (error) {
        if (!isUnmounted && retryCount < MAX_RETRY_COUNT) {
          console.warn(`Opening BGM再生の試行に失敗しました。再試行 ${retryCount + 1}/${MAX_RETRY_COUNT}`);
          retryCount++;
          setTimeout(attemptPlay, RETRY_INTERVAL);
        }
      }
    };

    attemptPlay();

    return () => {
      isUnmounted = true;
      if (bgmRef.current) {
        bgmRef.current.pause();
      }
    };
  }, [isBgmPlaying]);

  const handleStart = () => {
    if (bgmRef.current) {
      bgmRef.current.pause();
    }
    setIsStarted(true);
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.volume = AUDIO_VOLUME;
        videoRef.current.play();
      }
    }, 100);
  };

  const handleFinish = () => {
    if (bgmRef.current) {
      bgmRef.current.pause();
    }
    onFinish();
  };

  return (
    <div className="video-fullscreen">
      {isStarted ? (
        <div
          style={{
            width: '100vw',
            height: '100vh',
            backgroundColor: '#000',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <video
            ref={videoRef}
            src={openingVideo}
            controls={false}
            onEnded={handleFinish}
            style={{
              width: '100vw',
              height: '100vh',
              objectFit: 'cover',
              backgroundColor: '#000',
              position: 'fixed',
              top: 0,
              left: 0,
              zIndex: 1000,
            }}
          />
        </div>
      ) : (
        <div
          style={{
            width: '100vw',
            height: '100vh',
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: '#000',
          }}
        >
          <div
            className="opening-background"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundImage: `url(${openingBg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          />

          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7))',
              zIndex: 1,
            }}
          />

          <div
            style={{
              position: 'relative',
              zIndex: 2,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <div className="title-shine-container">
              <h1
                className="title-text"
                style={{
                  fontFamily: 'Cinzel, serif',
                  fontSize: '5rem',
                  marginBottom: '3rem',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  position: 'relative',
                }}
              >
                MIND SEEKER
              </h1>
            </div>

            <button
              className="start-button"
              onClick={handleStart}
              style={{
                padding: '15px 30px',
                fontSize: '1.4rem',
                backgroundColor: '#4a148c',
                color: '#fff',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
              }}
            >
              ▶️ Start Adventure
            </button>
          </div>
        </div>
      )}
      {isStarted && (
        <button
          className="rpg-skip-button"
          onClick={handleFinish}
        >
          <span style={{ fontSize: '1.2em' }}>⏭</span>
          <span>スキップしてMapへ</span>
        </button>
      )}
    </div>
  );
}

export default Opening;
