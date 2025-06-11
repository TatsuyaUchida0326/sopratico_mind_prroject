import Phaser from 'phaser';
import FieldScene from '../scenes/FieldScene'; // FieldSceneをdefault import

/**
 * Phaserゲーム設定を生成する関数
 * @param parent マウントするHTML要素
 * @returns Phaser.Types.Core.GameConfig
 */
const createGameConfig = (parent: HTMLElement): Phaser.Types.Core.GameConfig => {
  return {
    type: Phaser.CANVAS,
    parent,
    backgroundColor: '#000000',
    scene: [FieldScene], // FieldSceneを有効化
    render: {
      pixelArt: true,
      antialias: false,
      roundPixels: true, // ピクセルのぼやけを防止
      transparent: false,
      clearBeforeRender: true,
      powerPreference: 'high-performance' // GPUパフォーマンス優先
    },
    scale: {
      mode: Phaser.Scale.RESIZE, // ウィンドウサイズに合わせてリサイズ
      autoCenter: Phaser.Scale.CENTER_BOTH
      // width/heightはここでは指定しない
    },
    physics: {
      default: 'arcade',
      arcade: {
        debug: false,
        fps: 120 // 物理演算のFPSを上げる
      }
    },
    fps: {
      target: 60,
      min: 60,
      forceSetTimeOut: false // タイマー精度を向上
    }
  };
};

export default createGameConfig;