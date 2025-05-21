// src/components/MapComponent/MapComponent.tsx
import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import './Map.css';

// ゲーム設定のインポート
import createGameConfig from '../../game/config/gameConfig';

interface MapProps {
  onReturn?: () => void;
}

// グローバルでPhaser.Gameインスタンスを保持
let phaserGame: Phaser.Game | null = null;

const MapComponent: React.FC<MapProps> = ({ onReturn }) => {
  const gameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (gameRef.current && !phaserGame) {
      const config = createGameConfig(gameRef.current);
      phaserGame = new Phaser.Game(config);
    }
    // クリーンアップでdestroyしない（再生成を防ぐ）
    return () => {};
  }, []);

  return (
    <div className="battle-field-container">
      <button className="return-button" onClick={onReturn}>← 戻る</button>
      <div className="game-field-wrapper">
        <div ref={gameRef} className="phaser-container" />
      </div>
    </div>
  );
};

export default MapComponent;