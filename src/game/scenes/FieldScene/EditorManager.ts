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
  forest1: 1,
  rock: 21,
  sea1: 22,
  wall1: 23, wall2: 24, wall3: 25, wall4: 26, wall5: 27, wall6: 28, wall7: 29, wall8: 30, wall9: 31,
  wall10: 32, wall11: 33, wall12: 34, wall13: 35, wall14: 36, wall15: 37, wall16: 38, wall17: 39, wall18: 40, wall19: 41,
  floorStone1: 100, floorStone2: 101, floorStone3: 102,
  floorWood1: 110, floorWood2: 111,
  carpet1: 120, carpet2: 121, carpet3: 122, carpet4: 123, carpet5: 124, carpet6: 125, carpet7: 126,
  counter1: 130, counter2: 131, counter3: 132, counter4: 133, counter5: 134, counter6: 135, counter7: 136, counter8: 137,
  dish1: 200, dish2: 201, dish3: 202, dish4: 203, dish5: 204, dish6: 205, dish7: 206,
  barrel1: 210, barrel2: 211,
  pot1: 220, pot2: 221,
  fireplace1: 230, fireplace2: 231, fireplace3: 232, fireplace4: 233, fireplace5: 234, fireplace6: 235, fireplace7: 236, fireplace8: 237, fireplace9: 238,
  fireplace10: 239, fireplace11: 240, fireplace12: 241, fireplace13: 242,
  shelf1: 243, shelf2: 244,
  chair1: 250,
  piano1: 260, piano2: 261, piano3: 262,
};

// オブジェクトレイヤー用（重ねて表示可能なもの）
const objectTileNames = [
  'forest1',
  'rock',
  'dish1', 'dish2', 'dish3', 'dish4', 'dish5', 'dish6', 'dish7',
  'barrel1', 'barrel2',
  'pot1', 'pot2',
  'fireplace1', 'fireplace2', 'fireplace3', 'fireplace4', 'fireplace5', 'fireplace6', 'fireplace7', 'fireplace8', 'fireplace9', 'fireplace10', 'fireplace11', 'fireplace12', 'fireplace13',
  'shelf1', 'shelf2',
  'chair1',
  'piano1', 'piano2', 'piano3'
];

// タイル設置関数（配列参照の共有バグを修正）
function setTile(scene: FieldScene, x: number, y: number, tileType: string) {
  if (!scene.mapData[0]) scene.mapData[0] = {};
  if (!scene.mapData[1]) scene.mapData[1] = {};
  const key = `${x},${y}`;

  if (objectTileNames.includes(tileType)) {
    // 1マス1タイルのみ許可（毎回新しい配列で上書き）
    scene.mapData[1][key] = [tileNameToId[tileType]];
    return;
  }

  // 地面タイル
  if (tileNameToId[tileType] !== undefined && !objectTileNames.includes(tileType)) {
    scene.mapData[0][key] = tileNameToId[tileType];
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

// 保存ボタン生成
function createSaveButton(scene: FieldScene) {
  let saveBtn = document.getElementById('save-map-btn');
  if (saveBtn) saveBtn.remove();

  saveBtn = document.createElement('button');
  saveBtn.id = 'save-map-btn';
  saveBtn.textContent = 'マップ保存';
  saveBtn.style.position = 'absolute';
  saveBtn.style.top = '10px';
  saveBtn.style.right = '10px';
  saveBtn.style.zIndex = '2000';
  saveBtn.onclick = () => {
    saveMap(scene);
    alert('マップを保存しました');
  };
  document.body.appendChild(saveBtn);
}

// ハイライト用矩形をグローバルで管理
let highlightRect: Phaser.GameObjects.Rectangle | null = null;

export function createEditorUI(scene: FieldScene) {
  createPaletteUI();
  createSaveButton(scene);

  // ハイライト用の矩形を作成（1度だけ）
  if (!highlightRect) {
    highlightRect = scene.add.rectangle(0, 0, TILE_SIZE, TILE_SIZE, 0xffff00, 0.3)
      .setOrigin(0)
      .setDepth(1000)
      .setVisible(false);
  }

  // ★ 全チャンクを強制ロード
  const chunkCount = Math.ceil(scene.mapSize / scene.chunkSize);
  for (let cy = 0; cy < chunkCount; cy++) {
    for (let cx = 0; cx < chunkCount; cx++) {
      const chunkKey = `${cx},${cy}`;
      if (!scene.activeChunks.has(chunkKey)) {
        loadChunk(scene, chunkKey);
      }
    }
  }

  // ポインタ移動時にハイライト位置を更新
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

    if (!scene.mapData[0]) scene.mapData[0] = {};
    if (!scene.mapData[1]) scene.mapData[1] = {};

    if (tileId === -1) {
      const key = `${worldX},${worldY}`;
      if (scene.mapData[1][key] !== undefined) {
        delete scene.mapData[1][key];
      } else if (scene.mapData[0][key] !== undefined) {
        delete scene.mapData[0][key];
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

export function saveMap(scene: FieldScene) {
  // オブジェクト型なのでfillEmpty不要
  localStorage.setItem('customMapData', JSON.stringify(scene.mapData));
  // バックアップも推奨
  localStorage.setItem('customMapData_backup', JSON.stringify(scene.mapData));
}