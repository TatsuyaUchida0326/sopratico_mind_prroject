import Phaser from 'phaser';
import { FieldScene } from './index';

// グリッド作成
export function createGrid(scene: FieldScene) {
  scene.grid = [];
  const tileSize = 64;
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
        scene.mapData[y][x] = 0;
        if (x === 0 || y === 0 || x === scene.mapSize - 1 || y === scene.mapSize - 1) {
          scene.mapData[y][x] = 3;
        }
        if (x !== scene.playerGridX && y !== scene.playerGridY && Math.random() < 0.15) {
          scene.mapData[y][x] = 1;
        }
        if (x !== scene.playerGridX && y !== scene.playerGridY && Math.random() < 0.01) {
          scene.mapData[y][x] = 2;
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
  for (let y = playerChunkY - loadDistance; y <= playerChunkY + loadDistance; y++) {
    for (let x = playerChunkX - loadDistance; x <= playerChunkX + loadDistance; x++) {
      if (x < 0 || y < 0 || x >= scene.mapSize / scene.chunkSize || y >= scene.mapSize / scene.chunkSize) {
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

// チャンクの読み込み
export function loadChunk(scene: FieldScene, chunkKey: string) {
  const [chunkX, chunkY] = chunkKey.split(',').map(Number);

  const chunkMap = new Map<string, Phaser.GameObjects.GameObject[]>();
  scene.activeChunks.set(chunkKey, chunkMap);

  const startX = chunkX * scene.chunkSize;
  const startY = chunkY * scene.chunkSize;
  const endX = Math.min(startX + scene.chunkSize, 256);
  const endY = Math.min(startY + scene.chunkSize, 256);

  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const tileType = scene.mapData[y][x];
      const tileX = scene.grid[y][x].x;
      const tileY = scene.grid[y][x].y;

      let sprite: Phaser.GameObjects.Image;
      let scaleValue = 1.0;

      switch (tileType) {
        case 0:
          sprite = scene.add.image(tileX, tileY, 'grass');
          break;
        case 1:
          sprite = scene.add.image(tileX, tileY, 'tree');
          scaleValue = 0.05;
          break;
        case 2:
          sprite = scene.add.image(tileX, tileY, 'castle');
          scaleValue = 0.1;
          break;
        case 3:
          sprite = scene.add.image(tileX, tileY, 'rock');
          scaleValue = 0.05;
          break;
        default:
          sprite = scene.add.image(tileX, tileY, 'grass');
          break;
      }

      sprite.setOrigin(0, 0);
      sprite.setScale(scaleValue);
      sprite.setDepth(y);

      const tileKey = `${x},${y}`;
      chunkMap.set(tileKey, [sprite]);
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