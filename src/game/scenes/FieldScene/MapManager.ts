import Phaser from 'phaser';
import { FieldScene } from './index';

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

// マップデータの初期化
export function initializeMapData(scene: FieldScene) {
  const savedMapData = localStorage.getItem('customMapData');
  if (savedMapData) {
    scene.mapData = JSON.parse(savedMapData);
  } else {
    scene.mapData = [];
    for (let y = 0; y < scene.mapSize; y++) {
      scene.mapData[y] = [];
      for (let x = 0; x < scene.mapSize; x++) {
        scene.mapData[y][x] = -1; // -1を「何もない」タイルとして扱う
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

  scene.activeChunks.forEach((_, key) => {
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

// チャンクの読み込み（タイル描画処理を全て削除したクリーンな状態）
export function loadChunk(scene: FieldScene, chunkKey: string) {
  const [chunkX, chunkY] = chunkKey.split(',').map(Number);

  const chunkMap = new Map<string, Phaser.GameObjects.GameObject[]>();
  scene.activeChunks.set(chunkKey, chunkMap);

  const startX = chunkX * scene.chunkSize;
  const startY = chunkY * scene.chunkSize;
  const endX = Math.min(startX + scene.chunkSize, scene.mapSize);
  const endY = Math.min(startY + scene.chunkSize, scene.mapSize);

  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      if (x < 0 || y < 0 || x >= scene.mapSize || y >= scene.mapSize) continue;

      // タイル描画処理は全て削除
      // 必要ならここに新しいタイル描画処理を追加してください
    }
  }
}

// チャンクのアンロード
export function unloadChunk(scene: FieldScene, chunkKey: string) {
  const chunkMap = scene.activeChunks.get(chunkKey);
  if (chunkMap) {
    chunkMap.forEach(gameObjects => {
      gameObjects.forEach(obj => obj.destroy());
    });
    scene.activeChunks.delete(chunkKey);
  }
}