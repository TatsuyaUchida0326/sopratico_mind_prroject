import Phaser from 'phaser';
import { FieldScene } from '../scenes/FieldScene';

/**
 * Phaserゲーム設定を生成する関数
 * @param parent マウントするHTML要素
 * @returns Phaser.Types.Core.GameConfig
 */
const createGameConfig = (parent: HTMLElement): Phaser.Types.Core.GameConfig => {
  return {
    type: Phaser.CANVAS,
    width: 1024, // 数値で指定
    height: 768, // 数値で指定
    parent,
    backgroundColor: '#000000',
    scene: [FieldScene], // BattleSceneを削除
    render: {
      pixelArt: true,
      antialias: false,
      roundPixels: true, // ピクセルのぼやけを防止
      transparent: false,
      clearBeforeRender: true,
      powerPreference: 'high-performance' // GPUパフォーマンス優先
    },
    scale: {
      mode: Phaser.Scale.RESIZE, // RESIZEではなくFIT推奨
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