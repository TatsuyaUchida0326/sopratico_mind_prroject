import Phaser from 'phaser';
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
  playerMarker?: Phaser.GameObjects.GameObject;
  paletteUI?: Phaser.GameObjects.GameObject;
  dragPreview?: Phaser.GameObjects.GameObject;
  helpText?: Phaser.GameObjects.GameObject;
  input?: Phaser.Input.InputPlugin;
};

// ID→画像名のマッピング（assets/index.tsのtilesと完全一致させる）
const tileIdToName: Record<number, string> = {
  0: 'grass',
  1: 'forest',
  2: 'rock',
  3: 'sea1',
  4: 'wall1', 5: 'wall2', 6: 'wall3', 7: 'wall4', 8: 'wall5', 9: 'wall6', 10: 'wall7', 11: 'wall8', 12: 'wall9',
  13: 'wall10', 14: 'wall11', 15: 'wall12', 16: 'wall13', 17: 'wall14', 18: 'wall15', 19: 'wall16', 20: 'wall17', 21: 'wall18', 22: 'wall19',
  100: 'floorStone1', 101: 'floorStone2', 102: 'floorStone3',
  110: 'floorWood1', 111: 'floorWood2',
  120: 'carpet1', 121: 'carpet2', 122: 'carpet3', 123: 'carpet4', 124: 'carpet5', 125: 'carpet6', 126: 'carpet7',
  130: 'counter1', 131: 'counter2', 132: 'counter3', 133: 'counter4', 134: 'counter5', 135: 'counter6', 136: 'counter7', 137: 'counter8',
  200: 'dish1', 201: 'dish2', 202: 'dish3', 203: 'dish4', 204: 'dish5', 205: 'dish6', 206: 'dish7',
  210: 'barrel1', 211: 'barrel2',
  220: 'pot1', 221: 'pot2',
  230: 'fireplace1', 231: 'fireplace2', 232: 'fireplace3', 233: 'fireplace4', 234: 'fireplace5', 235: 'fireplace6', 236: 'fireplace7', 237: 'fireplace8', 238: 'fireplace9',
  239: 'fireplace10', 240: 'fireplace11', 241: 'fireplace12', 242: 'fireplace13',
  243: 'shelf1', 244: 'shelf2',
  250: 'chair1',
  260: 'piano1', 261: 'piano2', 262: 'piano3'
};

// グリッド作成
export function createGrid(scene: FieldScene) {
  scene.grid = [];
  const tileSize = 32;
  for (let y = 0; y < scene.mapSize; y++) {
    scene.grid[y] = [];
    for (let x = 0; x < scene.mapSize; x++) {
      scene.grid[y][x] = {
        x: x * tileSize,
        y: y * tileSize
      };
    }
  }
}

// マップデータの初期化（レイヤー構造：配列で初期化）
export function initializeMapData(scene: FieldScene) {
  const savedMapData = localStorage.getItem('customMapData');
  if (savedMapData) {
    scene.mapData = JSON.parse(savedMapData);
  } else {
    scene.mapData = [[], []];
    for (let layer = 0; layer < 2; layer++) {
      for (let y = 0; y < scene.mapSize; y++) {
        if (!scene.mapData[layer][y]) scene.mapData[layer][y] = [];
        for (let x = 0; x < scene.mapSize; x++) {
          if (layer === 0) {
            scene.mapData[layer][y][x] = -1; // 地面はnumber
          } else {
            scene.mapData[layer][y][x] = []; // オブジェクトは配列
          }
        }
      }
    }
  }
}

// チャンク管理更新
export function updateChunks(scene: FieldScene) {
  const playerChunkX = Math.floor(scene.playerGridX / scene.chunkSize);
  const playerChunkY = Math.floor(scene.playerGridY / scene.chunkSize);

  if (playerChunkX === scene.lastPlayerChunkX && playerChunkY === scene.lastPlayerChunkY) {
    return;
  }

  scene.lastPlayerChunkX = playerChunkX;
  scene.lastPlayerChunkY = playerChunkY;

  const loadDistance = scene.loadDistance;
  const chunkCount = Math.ceil(scene.mapSize / scene.chunkSize);

  for (let y = playerChunkY - loadDistance; y <= playerChunkY + loadDistance; y++) {
    for (let x = playerChunkX - loadDistance; x <= playerChunkX + loadDistance; x++) {
      if (x < 0 || y < 0 || x >= chunkCount || y >= chunkCount) {
        continue;
      }
      const chunkKey = `${x},${y}`;
      if (!scene.activeChunks.has(chunkKey)) {
        loadChunk(scene, chunkKey);
      }
    }
  }

  scene.activeChunks.forEach((_: Map<string, Phaser.GameObjects.GameObject[]>, key: string) => {
    const [chunkX, chunkY] = key.split(',').map(Number);
    const distance = Math.max(
      Math.abs(chunkX - playerChunkX),
      Math.abs(chunkY - playerChunkY)
    );
    if (distance > loadDistance) {
      unloadChunk(scene, key);
    }
  });
}

// レイヤー対応のチャンクロード
export function loadChunk(scene: FieldScene, chunkKey: string) {
  const [chunkX, chunkY] = chunkKey.split(',').map(Number);

  const chunkMap = new Map<string, Phaser.GameObjects.GameObject[]>();
  scene.activeChunks.set(chunkKey, chunkMap);

  const startX = chunkX * scene.chunkSize;
  const startY = chunkY * scene.chunkSize;
  const endX = Math.min(startX + scene.chunkSize, scene.mapSize);
  const endY = Math.min(startY + scene.chunkSize, scene.mapSize);

  // リサイズしないタイル一覧
  const noResizeTiles = [
    'wall10', 'wall11', 'wall12', 'wall13', 'wall14', 'wall17', 'wall18', 'wall19',
    'dish1', 'dish2', 'dish3', 'dish4', 'dish5', 'dish6', 'dish7',
    'barrel1', 'barrel2',
    'pot1', 'pot2',
    'fireplace1', 'fireplace2', 'fireplace3', 'fireplace4', 'fireplace5', 'fireplace6', 'fireplace7', 'fireplace8', 'fireplace9', 'fireplace10', 'fireplace11', 'fireplace12', 'fireplace13',
    'shelf1', 'shelf2',
    'chair1',
    'piano1', 'piano2', 'piano3'
  ];

  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      if (x < 0 || y < 0 || x >= scene.mapSize || y >= scene.mapSize) continue;

      // 3次元配列から各レイヤーのタイルIDを取得
      for (let layer = 0; layer < 2; layer++) {
        const cell = scene.mapData[layer]?.[y]?.[x];
        if (layer === 0) {
          // 地面レイヤー
          const tileId = cell;
          if (tileId === undefined || tileId === -1) continue;
          const textureKey = tileIdToName[tileId];
          if (textureKey && tileImages[textureKey]) {
            const tileDepth = (window as any).selectedTileDepth ?? -10;
            // --- 個別配置・リサイズ処理 ---
            let tile = scene.add.image(x * 32, y * 32, textureKey);

            // デフォルト
            tile.setOrigin(0);

            // 個別調整
            switch (textureKey) {
              case 'wall10':
              case 'wall11':
                tile.setOrigin(0, 0.5);
                tile.x = x * 32;
                tile.y = y * 32 + 16;
                break;
              case 'wall12':
              case 'wall13':
              case 'wall14':
                tile.setOrigin(1, 0.5);
                tile.x = (x + 1) * 32;
                tile.y = y * 32 + 16;
                break;
              case 'wall17':
                tile.setOrigin(1, 0);
                tile.x = (x + 1) * 32;
                tile.y = y * 32;
                break;
              case 'wall18':
                tile.setOrigin(0.5, 0);
                tile.x = x * 32 + 16;
                tile.y = y * 32;
                break;
              case 'wall19':
                tile.setOrigin(0, 0);
                tile.x = x * 32;
                tile.y = y * 32;
                break;
              case 'dish1': case 'dish2': case 'dish3': case 'dish4': case 'dish5': case 'dish6': case 'dish7':
              case 'barrel1': case 'barrel2':
              case 'pot1': case 'pot2':
              case 'fireplace1': case 'fireplace2': case 'fireplace3': case 'fireplace4': case 'fireplace5': case 'fireplace6': case 'fireplace7': case 'fireplace8': case 'fireplace9':
              case 'fireplace10': case 'fireplace11': case 'fireplace12': case 'fireplace13':
              case 'shelf1': case 'shelf2':
              case 'chair1':
              case 'piano1': case 'piano2': case 'piano3':
                tile.setOrigin(0.5, 0.5);
                tile.x = x * 32 + 16;
                tile.y = y * 32 + 16;
                break;
              // wall1～9,15,16はデフォルト（中央・リサイズ）でOK
              default:
                break;
            }

            // --- リサイズ分岐 ---
            if (noResizeTiles.includes(textureKey)) {
              tile.setDisplaySize(tile.width, tile.height);
            } else {
              tile.setDisplaySize(32, 32);
            }

            tile.setDepth(tileDepth + layer);
            const key = `${x},${y}`;
            if (!chunkMap.has(key)) chunkMap.set(key, []);
            chunkMap.get(key)!.push(tile);
          }
        } else {
          // オブジェクトレイヤーは1マス1タイルのみ許可
          if (!Array.isArray(cell) || cell.length === 0) continue;
          const tileId = cell[0]; // 先頭のみ
          const textureKey = tileIdToName[tileId];
          if (textureKey && tileImages[textureKey]) {
            const tileDepth = (window as any).selectedTileDepth ?? -10;
            let tile = scene.add.image(x * 32, y * 32, textureKey).setOrigin(0);

            // --- リサイズ分岐 ---
            if (noResizeTiles.includes(textureKey)) {
              tile.setDisplaySize(tile.width, tile.height);
            } else {
              tile.setDisplaySize(32, 32);
            }

            tile.setDepth(tileDepth + layer + 1);
            const key = `${x},${y}`;
            if (!chunkMap.has(key)) chunkMap.set(key, []);
            chunkMap.get(key)!.push(tile);
          }
        }
      }
    }
  }
}

// チャンクのアンロード
export function unloadChunk(scene: FieldScene, chunkKey: string) {
  const chunkMap = scene.activeChunks.get(chunkKey);
  if (chunkMap) {
    chunkMap.forEach((gameObjects: Phaser.GameObjects.GameObject[]) => {
      gameObjects.forEach((obj: Phaser.GameObjects.GameObject) => {
        // プレイヤーや仲間キャラ、UIなどはdestroyしない
        if (
          obj !== scene.playerMarker &&
          obj !== scene.paletteUI &&
          obj !== scene.dragPreview &&
          obj !== scene.helpText
        ) {
          obj.destroy();
        }
      });
    });
    scene.activeChunks.delete(chunkKey);
  }
}