import { loadChunk } from './MapManager';
import { tiles as tileImages } from '../../assets/index';

// index.tsのFieldScene型に合わせて定義
type FieldScene = {
  grid: { x: number; y: number }[][];
  mapSize: number;
  mapData: any;
  playerGridX: number;
  playerGridY: number;
  chunkSize: number;
  lastPlayerChunkX: number;
  lastPlayerChunkY: number;
  loadDistance: number;
  activeChunks: Map<string, Map<string, Phaser.GameObjects.GameObject[]>>;
  add: Phaser.Scene['add'];
  input: Phaser.Input.InputPlugin;
  playerMarker?: Phaser.GameObjects.GameObject;
  paletteUI?: Phaser.GameObjects.GameObject;
  dragPreview?: Phaser.GameObjects.GameObject;
  helpText?: Phaser.GameObjects.GameObject;
};

const TILE_SIZE = 32;

// 画像名→IDのマッピング（assets/index.tsのtilesと完全一致させる）
const tileNameToId: Record<string, number> = {
  grass: 0,
  forest: 1,
  rock: 2,
  sea1: 3,
  wall1: 4, wall2: 5, wall3: 6, wall4: 7, wall5: 8, wall6: 9, wall7: 10, wall8: 11, wall9: 12,
  wall10: 13, wall11: 14, wall12: 15, wall13: 16, wall14: 17, wall15: 18, wall16: 19, wall17: 20, wall18: 21, wall19: 22,
  floorStone1: 100, floorStone2: 101, floorStone3: 102,
  floorWood1: 110, floorWood2: 111,
  carpet1: 120, carpet2: 121, carpet3: 122, carpet4: 123, carpet5: 124, carpet6: 125, carpet7: 126,
  counter1: 130, counter2: 131, counter3: 132, counter4: 133, counter5: 134, counter6: 135, counter7: 136, counter8: 137,
  dish1: 200, dish2: 201, dish3: 202, dish4: 203, dish5: 204, dish6: 205, dish7: 206,
  barrel1: 210, barrel2: 211,
  pot1: 220, pot2: 221,
  fireplace1: 230, fireplace2: 231, fireplace3: 232, fireplace4: 233, fireplace5: 234, fireplace6: 235, fireplace7: 236, fireplace8: 237, fireplace9: 238,
  fireplace10: 239, fireplace11: 240, fireplace12: 241, fireplace13: 242,
  shelf1: 240, shelf2: 241,
  chair1: 250,
  piano1: 260, piano2: 261, piano3: 262,
};

// オブジェクトレイヤー用（重ねて表示可能なもの）
// assets/index.tsのtilesのうち、重ねて表示したいものを全て列挙
const objectTileNames = [
  'forest', 'rock',
  'dish1', 'dish2', 'dish3', 'dish4', 'dish5', 'dish6', 'dish7',
  'barrel1', 'barrel2',
  'pot1', 'pot2',
  'fireplace1', 'fireplace2', 'fireplace3', 'fireplace4', 'fireplace5', 'fireplace6', 'fireplace7', 'fireplace8', 'fireplace9', 'fireplace10', 'fireplace11', 'fireplace12', 'fireplace13',
  'shelf1', 'shelf2',
  'chair1',
  'piano1', 'piano2', 'piano3'
];

// タイル設置関数
function setTile(scene: FieldScene, x: number, y: number, tileType: string) {
  if (!scene.mapData[0][y]) scene.mapData[0][y] = [];
  if (!scene.mapData[1][y]) scene.mapData[1][y] = [];

  // オブジェクトレイヤー（重ねて表示可能なもの）
  if (objectTileNames.includes(tileType)) {
    let cell: number[];
    const raw = scene.mapData[1][y][x];
    if (Array.isArray(raw)) {
      cell = raw;
    } else if (typeof raw === 'number') {
      cell = [raw];
    } else {
      cell = [];
    }
    cell.push(tileNameToId[tileType]);
    scene.mapData[1][y][x] = cell;
    return;
  }

  // 地面タイル
  if (tileNameToId[tileType] !== undefined) {
    scene.mapData[0][y][x] = tileNameToId[tileType];
    return;
  }
}

// パレットUI生成
function createPaletteUI() {
  const oldPalette = document.getElementById('tile-palette');
  if (oldPalette) oldPalette.remove();

  const palette = document.createElement('div');
  palette.id = 'tile-palette';
  palette.style.position = 'absolute';
  palette.style.top = '50%';
  palette.style.right = '10px';
  palette.style.left = 'auto';
  palette.style.transform = 'translateY(-50%)';
  palette.style.background = 'rgba(255,255,255,0.7)';
  palette.style.padding = '8px';
  palette.style.border = '1px solid #888';
  palette.style.zIndex = '1000';
  palette.style.display = 'grid';
  palette.style.gridTemplateColumns = 'repeat(4, 1fr)';
  palette.style.gap = '4px';
  palette.style.cursor = 'move';

  // --- ドラッグ移動用イベント追加 ---
  let isDragging = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  palette.addEventListener('mousedown', (e) => {
    isDragging = true;
    // @ts-ignore
    dragOffsetX = e.clientX - palette.getBoundingClientRect().left;
    // @ts-ignore
    dragOffsetY = e.clientY - palette.getBoundingClientRect().top;
    palette.style.transform = '';
    palette.style.right = 'auto';
  });

  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      palette.style.left = `${e.clientX - dragOffsetX}px`;
      palette.style.top = `${e.clientY - dragOffsetY}px`;
    }
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
  });
  // --- ここまで追加 ---

  // 画像タイルを全てパレットに追加
  Object.entries(tileImages).forEach(([key, src]) => {
    const btn = document.createElement('button');
    btn.style.margin = '2px';
    btn.style.width = '36px';
    btn.style.height = '36px';
    btn.style.padding = '0';
    btn.style.background = '#fff';
    btn.style.border = '1px solid #aaa';
    btn.style.display = 'flex';
    btn.style.alignItems = 'center';
    btn.style.justifyContent = 'center';
    btn.title = key;

    const img = document.createElement('img');
    img.src = src;
    img.style.width = '32px';
    img.style.height = '32px';
    btn.appendChild(img);

    btn.onclick = () => {
      (window as any).selectedTileId = key;
      (window as any).selectedTileType = key;
    };
    palette.appendChild(btn);
  });

  // 削除ボタンも追加
  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = '削除';
  deleteBtn.style.margin = '2px';
  deleteBtn.onclick = () => {
    (window as any).selectedTileId = -1;
    (window as any).selectedTileType = 'delete';
  };
  palette.appendChild(deleteBtn);

  // 最背面・最前面ボタン追加
  const depthOptions = [
    { key: 'back', label: '最背面', value: -10 },
    { key: 'front', label: '最前面', value: 1000 }
  ];
  (window as any).selectedTileDepth = -10;

  depthOptions.forEach(opt => {
    const btn = document.createElement('button');
    btn.textContent = opt.label;
    btn.style.margin = '2px';
    btn.onclick = () => {
      (window as any).selectedTileDepth = opt.value;
    };
    palette.appendChild(btn);
  });

  document.body.appendChild(palette);
  (window as any).selectedTileId = 0;
  (window as any).selectedTileType = 'grass';
}

// ハイライト用矩形をグローバルで管理
let highlightRect: Phaser.GameObjects.Rectangle | null = null;

export function createEditorUI(scene: FieldScene) {
  createPaletteUI();

  // ハイライト用の矩形を作成（1度だけ）
  if (!highlightRect) {
    highlightRect = scene.add.rectangle(0, 0, TILE_SIZE, TILE_SIZE, 0xffff00, 0.3)
      .setOrigin(0)
      .setDepth(1000)
      .setVisible(false);
  }

  // ポインタ移動時にハイライト位置を更新
  scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
    const worldX = Math.floor(pointer.worldX / TILE_SIZE);
    const worldY = Math.floor(pointer.worldY / TILE_SIZE);

    const isDeleteMode = (window as any).selectedTileId === -1;

    if (
      isDeleteMode &&
      worldX >= 0 && worldX < scene.mapSize &&
      worldY >= 0 && worldY < scene.mapSize &&
      Array.isArray(scene.mapData[worldY][worldX]) &&
      scene.mapData[worldY][worldX].length > 0
    ) {
      highlightRect?.setPosition(worldX * TILE_SIZE, worldY * TILE_SIZE);
      highlightRect?.setVisible(true);
    } else {
      highlightRect?.setVisible(false);
    }
  });

  // pointerdownもレイヤー構造に対応
  scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
    const worldX = Math.floor(pointer.worldX / TILE_SIZE);
    const worldY = Math.floor(pointer.worldY / TILE_SIZE);

    const tileId = (window as any).selectedTileId ?? 0;
    const tileType = (window as any).selectedTileType ?? 'grass';

    if (
      worldX < 0 || worldX >= scene.mapSize ||
      worldY < 0 || worldY >= scene.mapSize
    ) {
      return;
    }

    if (!scene.mapData[0]) scene.mapData[0] = [];
    if (!scene.mapData[1]) scene.mapData[1] = [];
    if (!scene.mapData[0][worldY]) scene.mapData[0][worldY] = [];
    if (!scene.mapData[1][worldY]) scene.mapData[1][worldY] = [];

    if (tileId === -1) {
      if (scene.mapData[1][worldY][worldX] !== undefined) {
        delete scene.mapData[1][worldY][worldX];
      } else if (scene.mapData[0][worldY][worldX] !== undefined) {
        delete scene.mapData[0][worldY][worldX];
      }
    } else {
      setTile(scene, worldX, worldY, tileType);
    }

    // チャンク再読み込み
    const chunkX = Math.floor(worldX / scene.chunkSize);
    const chunkY = Math.floor(worldY / scene.chunkSize);
    const chunkKey = `${chunkX},${chunkY}`;
    if (scene.activeChunks.has(chunkKey)) {
      scene.activeChunks.get(chunkKey)?.forEach((objs: Phaser.GameObjects.GameObject[]) =>
        objs.forEach((obj: Phaser.GameObjects.GameObject) => obj.destroy())
      );
      scene.activeChunks.delete(chunkKey);
    }
    // 再描画
    loadChunk(scene, chunkKey);
  });
}

// エディタUIの破棄
export function destroyEditorUI(scene: FieldScene) {
  scene.input.removeAllListeners('pointerdown');
  scene.input.removeAllListeners('pointermove');
  const palette = document.getElementById('tile-palette');
  if (palette) palette.remove();
  if (highlightRect) highlightRect.setVisible(false);
  document.body.style.cursor = 'default';
}

// ドラッグイベント設定（空実装）
export function setupDragEvents(_scene: FieldScene) {
  // 必要ならここに新しいドラッグイベント処理を追加してください
}

// マップ保存
export function saveMap(scene: FieldScene) {
  localStorage.setItem('customMapData', JSON.stringify(scene.mapData));
  // 必要ならメッセージ表示など
}