import { useRef, useEffect } from 'react';
import { AUDIO_VOLUME } from './audioSettings';

interface StageVideoProps {
  videoSrc: string;
  onFinish: () => void;
}

function StageVideo({ videoSrc, onFinish }: StageVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = AUDIO_VOLUME;
      videoRef.current.play();
    }
  }, []);

  return (
    <div className="video-fullscreen">
      <video
        ref={videoRef}
        src={videoSrc}
        controls={false}
        onEnded={onFinish}
        style={{
          width: '100vw',
          height: '100vh',
          objectFit: 'cover',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 1000,
        }}
      />
      <button 
        className="rpg-skip-button"
        onClick={onFinish}
      >
        <span style={{ fontSize: '1.2em' }}>⏭</span>
        <span>スキップしてMapへ</span>
      </button>
    </div>
  );
}

export default StageVideo;