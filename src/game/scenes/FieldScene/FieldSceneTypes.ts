import Phaser from 'phaser';

export type FieldScene = Phaser.Scene & {
  grid: { x: number; y: number }[][];
  playerMarker?: Phaser.GameObjects.Sprite;
  lastDirection: string;
  miniMapActive: boolean;
  toggleMiniMap: () => void
  mapSize: number;
  cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  canMove: boolean;
  playerGridX: number;
  playerGridY: number;
  movementSpeed: number;
  mapData: number[][];
  spaceKey?: Phaser.Input.Keyboard.Key;
  currentMessage?: Phaser.GameObjects.Text;
  bgm?: Phaser.Sound.BaseSound;
  nextMoveDirection: string | null;
  chunkSize: number;
  activeChunks: Map<string, Map<string, Phaser.GameObjects.GameObject[]>>;
  isMoving: boolean;
  loadDistance: number;
  lastPlayerChunkX: number;
  lastPlayerChunkY: number;
  editMode: boolean;
  selectedTileType: string;
  paletteUI?: Phaser.GameObjects.Container;
  dragPreview?: Phaser.GameObjects.Image;
  helpText?: Phaser.GameObjects.Text;
  positionText?: Phaser.GameObjects.Text;
  speedText?: Phaser.GameObjects.Text;
};