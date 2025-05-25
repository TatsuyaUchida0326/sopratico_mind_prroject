import Phaser from 'phaser';
import { tiles, characters, audio } from '../../assets';
import { createUI, showMessage } from './UIManager';
import { createGrid, initializeMapData, updateChunks } from './MapManager';
import { createEditorUI, destroyEditorUI } from './EditorManager';
import {
  placePlayer,
  updatePlayerMovement,
  animatePlayer
} from './PlayerManager';
import { getTileTypeName } from './TileUtils';

export class FieldScene extends Phaser.Scene {
  public grid: { x: number; y: number }[][] = [];
  public playerMarker?: Phaser.GameObjects.Sprite;
  public lastDirection: string = 'down';
  public miniMapActive: boolean = false;
  public mapSize: number = 20;
  public cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  public canMove: boolean = true;
  public playerGridX: number = 10;
  public playerGridY: number = 10;
  public movementSpeed: number = 0.3;
  public mapData: number[][] = [];
  public spaceKey?: Phaser.Input.Keyboard.Key;
  public currentMessage?: Phaser.GameObjects.Text;
  public bgm?: Phaser.Sound.BaseSound;
  public nextMoveDirection: string | null = null;
  public chunkSize: number = 16;
  public activeChunks = new Map<string, Map<string, Phaser.GameObjects.GameObject[]>>();
  public isMoving: boolean = false;
  public loadDistance: number = 2;
  public lastPlayerChunkX: number = -1;
  public lastPlayerChunkY: number = -1;

  // マップエディター関連プロパティ
  public editMode: boolean = false;
  public selectedTileType: string = 'grass';
  public paletteUI?: Phaser.GameObjects.Container;
  public dragPreview?: Phaser.GameObjects.Image;
  public helpText?: Phaser.GameObjects.Text;

  // UI関連のプロパティ
  public positionText?: Phaser.GameObjects.Text;
  public speedText?: Phaser.GameObjects.Text;

  constructor() {
    super({
      key: 'FieldScene',
      physics: {
        default: 'arcade',
        arcade: {
          fps: 120
        }
      }
    });
  }

  preload() {
    this.load.image('grass', tiles.grass);

    this.load.image('character_down_1', characters.player.down[0]);
    this.load.image('character_down_2', characters.player.down[1]);
    this.load.image('character_up_1', characters.player.up[0]);
    this.load.image('character_up_2', characters.player.up[1]);
    this.load.image('character_left_1', characters.player.left[0]);
    this.load.image('character_left_2', characters.player.left[1]);
    this.load.image('character_right_1', characters.player.right[0]);
    this.load.image('character_right_2', characters.player.right[1]);

    this.load.audio('field_bgm', audio.fieldBgm);

    this.load.on('complete', () => {
      console.log('FieldScene: すべてのアセットが読み込まれました');
    });
  }

  create() {
    // アニメーション定義
    this.anims.create({
      key: 'player_down',
      frames: [{ key: 'character_down_1' }, { key: 'character_down_2' }],
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: 'player_up',
      frames: [{ key: 'character_up_1' }, { key: 'character_up_2' }],
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: 'player_left',
      frames: [{ key: 'character_left_1' }, { key: 'character_left_2' }],
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: 'player_right',
      frames: [{ key: 'character_right_1' }, { key: 'character_right_2' }],
      frameRate: 10,
      repeat: -1
    });

    createGrid(this);

    this.cursors = this.input.keyboard?.createCursorKeys();
    this.spaceKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    initializeMapData(this);

    placePlayer(this);
    createUI(this);

    this.bgm = this.sound.add('field_bgm', { loop: true, volume: 0.5 });
    this.bgm.play();

    // カメラ設定の追加
    this.cameras.main.setBounds(0, 0, this.mapSize * 64, this.mapSize * 64);
    this.cameras.main.setZoom(1.0);
    this.cameras.main.roundPixels = true;
    this.cameras.main.setBackgroundColor(0x000000);
    this.cameras.main.setLerp(0, 0);
    this.cameras.main.setDeadzone(0, 0);

    // プレイヤーをカメラが追従
    if (this.playerMarker) {
      this.cameras.main.startFollow(this.playerMarker, true, 0, 0);
    } else {
      // プレイヤーがいない場合はマップ中央にカメラを合わせる
      this.cameras.main.centerOn(this.playerGridX * 64, this.playerGridY * 64);
    }

    this.input.keyboard?.on('keydown-E', () => this.toggleEditMode(), this);

    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gameObjects: any, _deltaX: number, deltaY: number) => {
      let zoom = this.cameras.main.zoom;
      if (deltaY > 0) {
        zoom -= 0.1;
      } else {
        zoom += 0.1;
      }
      zoom = Phaser.Math.Clamp(zoom, 0.5, 2);
      this.cameras.main.setZoom(zoom);
    });

    updateChunks(this);

    console.log('FieldScene: create完了');
  }

  update(time: number, _delta: number) {
    updatePlayerMovement(this, showMessage, getTileTypeName);
    if (time % 5 === 0) {
      updateChunks(this);
    }
    animatePlayer(this);
  }

  public toggleMiniMap() {
    this.miniMapActive = !this.miniMapActive;

    if (this.miniMapActive) {
      // フィールド全体が画面に収まるズーム値を計算
      const zoomX = this.cameras.main.width / (this.mapSize * 64);
      const zoomY = this.cameras.main.height / (this.mapSize * 64);
      const zoom = Math.min(zoomX, zoomY);
      
      this.cameras.main.stopFollow();
      this.cameras.main.setZoom(zoom);
      this.cameras.main.setBounds(0, 0, this.mapSize * 64, this.mapSize * 64);
      this.cameras.main.centerOn(
        (this.mapSize * 64) / 2,
        (this.mapSize * 64) / 2
      );
    } else {
      // 通常表示に戻す
      this.cameras.main.setZoom(1.0);
      this.cameras.main.setBounds(0, 0, this.mapSize * 64, this.mapSize * 64);
      if (this.playerMarker) {
        this.cameras.main.startFollow(this.playerMarker, true, 0.1, 0.1);
      } else {
        this.cameras.main.centerOn(this.playerGridX * 64, this.playerGridY * 64);
      }
    }
  }

  private toggleEditMode() {
    this.editMode = !this.editMode;

    if (this.editMode) {
      createEditorUI(this);
    } else {
      destroyEditorUI(this);
    }

    const modeText = this.add.text(
      this.cameras.main.centerX,
      100,
      `${this.editMode ? 'エディターモード ON' : 'エディターモード OFF'}`,
      { font: '24px Arial', color: '#ffffff', backgroundColor: '#000000' }
    );
    modeText.setOrigin(0.5);
    modeText.setScrollFactor(0);
    modeText.setDepth(2000);
    this.time.delayedCall(2000, () => { modeText.destroy(); });
  }
}