import Phaser from 'phaser';
import { createEditorUI, destroyEditorUI } from './EditorManager';
import { characters, tiles } from '../../assets/index';
import { createGrid, initializeMapData, updateChunks, loadChunk, unloadChunk } from './MapManager';

// --- FieldSceneクラス定義 ---
class FieldScene extends Phaser.Scene {
  grid!: { x: number; y: number }[][];
  mapSize = 32; // 一般的な村サイズ
  mapData: any;
  playerGridX = 0;
  playerGridY = 0;
  chunkSize = 8;
  lastPlayerChunkX = -1;
  lastPlayerChunkY = -1;
  loadDistance = 1;
  editMode: boolean = false;
  spaceKey?: Phaser.Input.Keyboard.Key;
  isMoving?: boolean;
  canMove: boolean = true;
  movementSpeed: number = 1;
  activeChunks = new Map<string, Map<string, Phaser.GameObjects.GameObject[]>>();
  playerMarker?: Phaser.GameObjects.Sprite;
  dragPreview?: Phaser.GameObjects.GameObject;
  helpText?: Phaser.GameObjects.Text;
  positionText?: Phaser.GameObjects.Text;
  speedText?: Phaser.GameObjects.Text;
  currentMessage?: Phaser.GameObjects.Text;

  // キャラクター・座標表示用
  player?: Phaser.GameObjects.Sprite;
  cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  coordText?: Phaser.GameObjects.Text;
  lastDirection: 'down' | 'up' | 'left' | 'right' = 'down';

  // ミニマップ切り替え用
  miniMapVisible: boolean = false;

  constructor() {
    super('FieldScene');
  }

  preload() {
    // キャラクター画像のプリロード
    this.load.image('playerDown1', characters.player.down[0]);
    this.load.image('playerDown2', characters.player.down[1]);
    this.load.image('playerUp1', characters.player.up[0]);
    this.load.image('playerUp2', characters.player.up[1]);
    this.load.image('playerLeft1', characters.player.left[0]);
    this.load.image('playerLeft2', characters.player.left[1]);
    this.load.image('playerRight1', characters.player.right[0]);
    this.load.image('playerRight2', characters.player.right[1]);
    Object.entries(tiles).forEach(([key, src]) => {
      this.load.image(key, src);
    });
  }

  create() {
    createGrid(this);
    initializeMapData(this);

    this.input.keyboard?.on('keydown-E', () => {
      this.editMode = !this.editMode;
      if (this.editMode) {
        createEditorUI(this);
      } else {
        destroyEditorUI(this);
      }
    });

    // プレイヤーキャラ生成
    this.player = this.add.sprite(100, 100, 'playerDown1');
    this.cursors = this.input.keyboard?.createCursorKeys();
    this.coordText = this.add.text(
      this.cameras.main.width / 2,
      10,
      '',
      { fontSize: '16px', color: '#fff' }
    );
    this.coordText.setOrigin(0.5, 0);
    this.coordText.setScrollFactor(0);
    this.coordText.setDepth(2000);

    // --- アニメーション定義 ---
    this.anims.create({
      key: 'player-down',
      frames: [
        { key: 'playerDown1' },
        { key: 'playerDown2' }
      ],
      frameRate: 8,
      repeat: -1
    });
    this.anims.create({
      key: 'player-up',
      frames: [
        { key: 'playerUp1' },
        { key: 'playerUp2' }
      ],
      frameRate: 8,
      repeat: -1
    });
    this.anims.create({
      key: 'player-left',
      frames: [
        { key: 'playerLeft1' },
        { key: 'playerLeft2' }
      ],
      frameRate: 8,
      repeat: -1
    });
    this.anims.create({
      key: 'player-right',
      frames: [
        { key: 'playerRight1' },
        { key: 'playerRight2' }
      ],
      frameRate: 8,
      repeat: -1
    });

    // カメラ追尾とマップ範囲設定
    if (this.player) {
      this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
      this.cameras.main.setBounds(0, 0, this.mapSize * 32, this.mapSize * 32);
    }
  }

  // ミニマップの表示/非表示切り替え
  toggleMiniMap(): void {
    this.miniMapVisible = !this.miniMapVisible;
    // 必要に応じてミニマップの表示・非表示処理をここに追加
  }

  update() {
    if (this.player && this.cursors) {
      let nextX = this.player.x;
      let nextY = this.player.y;

      if (this.cursors.left?.isDown) {
        nextX -= 2;
        this.player.anims.play('player-left', true);
        this.lastDirection = 'left';
      } else if (this.cursors.right?.isDown) {
        nextX += 2;
        this.player.anims.play('player-right', true);
        this.lastDirection = 'right';
      } else if (this.cursors.up?.isDown) {
        nextY -= 2;
        this.player.anims.play('player-up', true);
        this.lastDirection = 'up';
      } else if (this.cursors.down?.isDown) {
        nextY += 2;
        this.player.anims.play('player-down', true);
        this.lastDirection = 'down';
      } else {
        // 停止時は最後の向きの1枚目画像に戻す
        this.player.anims.stop();
        switch (this.lastDirection) {
          case 'left':
            this.player.setTexture('playerLeft1');
            break;
          case 'right':
            this.player.setTexture('playerRight1');
            break;
          case 'up':
            this.player.setTexture('playerUp1');
            break;
          case 'down':
          default:
            this.player.setTexture('playerDown1');
            break;
        }
      }

      // --- 範囲チェック ---
      const min = 0;
      const max = this.mapSize * 32 - 1;
      this.player.x = Phaser.Math.Clamp(nextX, min, max);
      this.player.y = Phaser.Math.Clamp(nextY, min, max);
    }

    // 座標表示（タイル座標で表示）
    if (this.player && this.coordText) {
      const tileX = Math.floor(this.player.x / 32);
      const tileY = Math.floor(this.player.y / 32);
      this.coordText.setText(`X: ${tileX}, Y: ${tileY}`);
    }

    updateChunks(this);
  }

  shutdown() {
    destroyEditorUI(this);
  }
}

export { createGrid, initializeMapData, updateChunks, loadChunk, unloadChunk };
export { FieldScene };
export default FieldScene;