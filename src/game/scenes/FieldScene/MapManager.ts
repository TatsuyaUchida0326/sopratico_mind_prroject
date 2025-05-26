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
        // バリケードやレンガなど既存の条件を維持
        if (x === 0 && y >= 0 && y <= 18) {
          scene.mapData[y][x] = 5; // 縦バリケード
          continue;
        }
        if (x === 19 && y >= 0 && y <= 19) {
          scene.mapData[y][x] = 5; // 縦バリケード
          continue;
        }
        if (x === 0 && y === 19) {
          scene.mapData[y][x] = 5; // 木のバリケード
          continue;
        }
        if (y === 19 && x >= 1 && x <= 11) {
          scene.mapData[y][x] = 5; // 木のバリケード
          continue;
        }
        if (y === 19 && x >= 12 && x <= 19) {
          scene.mapData[y][x] = 5; // 木のバリケード
          continue;
        }
        if (y === 0 && x >= 0 && x <= 19) {
          scene.mapData[y][x] = 5; // バリケード
          continue;
        }
        // x=0 の場合はレンガを設置しない
        if (x === 0) {
          continue;
        }
        // x=19, y=0～19 のレンガをカット（設置しない）
        if (x === 19 && y >= 0 && y <= 19) {
          continue;
        }
        // x=0以外のx=0～19, y=0 に床レンガ
        if (y === 0 && x >= 1 && x <= 19) {
          scene.mapData[y][x] = 4; // レンガ
          continue;
        }
        // x=19, y=1～19 に床レンガ
        if (x === 19 && y >= 1 && y <= 19) {
          scene.mapData[y][x] = 4; // レンガ
          continue;
        }
        // --- 既存の条件 ---
        if (y === 19 && x >= 12 && x <= 18) {
          if (x === 12 || x === 18) {
          } else {
            scene.mapData[y][x] = 4; // レンガ
            continue;
          }
        }
        if (y === 19 && x >= 12 && x <= 18) {
          if (x === 12 || x === 18) {
          } else {
            scene.mapData[y][x] = 4; // レンガ
            continue;
          }
        }
        if (y === 12 && x >= 13 && x <= 17) {
          scene.mapData[y][x] = 4;
          continue;
        }
        if (x === 1 && y >= 12 && y <= 18) {
          scene.mapData[y][x] = 4;
          continue;
        }
        if (y === 13 && x >= 13 && x <= 18) {
          scene.mapData[y][x] = 4;
          continue;
        }
        if (x === 18 && y >= 12 && y <= 19) {
          scene.mapData[y][x] = 4;
          continue;
        }
        if (y === 11 || x === 12) {
          scene.mapData[y][x] = 4;
          continue;
        }
        if (
  ((y === 9 || y === 10) && x >= 1 && x <= 11)
) {
  scene.mapData[y][x] = 1; // 森（重ね描画用）
} else {
  scene.mapData[y][x] = 0; // 草原
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
  const endX = Math.min(startX + scene.chunkSize, scene.mapSize);
  const endY = Math.min(startY + scene.chunkSize, scene.mapSize);

  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      if (x < 0 || y < 0 || x >= scene.mapSize || y >= scene.mapSize) continue;

      const tileType = scene.mapData[y][x];
      const tileX = scene.grid[y][x].x;
      const tileY = scene.grid[y][x].y;

      let sprite: Phaser.GameObjects.Image | undefined;

      switch (tileType) {
        case 0:
          sprite = scene.add.image(tileX, tileY, 'grass');
          sprite.setOrigin(0, 0);
          sprite.setDepth(y);
          break;
        case 1: {
          // 中（下）
          const forestMiddle = scene.add.image(tileX, tileY, 'forest');
          forestMiddle.setOrigin(0, 0);
          forestMiddle.setDisplaySize(64, 64);
          forestMiddle.setAlpha(0.85);
          forestMiddle.setDepth(y + 0.01);

          // 奥（上）
          const forestBack = scene.add.image(tileX, tileY - 33, 'forest');
          forestBack.setOrigin(0, 0);
          forestBack.setDisplaySize(64, 64);
          forestBack.setAlpha(1.0);
          forestBack.setDepth(y);

          chunkMap.set(`${x},${y}`, [forestMiddle, forestBack]);
          break;
        }
        case 2:
          sprite = scene.add.image(tileX, tileY, 'castle');
          sprite.setOrigin(0, 0);
          sprite.setDepth(y);
          break;
        case 3:
          sprite = scene.add.image(tileX, tileY, 'rock');
          sprite.setOrigin(0, 0);
          sprite.setDepth(y);
          break;
        case 4:
          console.log(`brick: x=${x}, y=${y}, tileX=${tileX}, tileY=${tileY}`);
          const grassBrick = scene.add.image(tileX, tileY, 'grass');
          grassBrick.setOrigin(0, 0);
          grassBrick.setDepth(y);

          sprite = scene.add.image(tileX, tileY, 'brick');
          sprite.setOrigin(0, 0);
          sprite.setDisplaySize(64, 64); // ←追加
          sprite.setDepth(y + 0.1);
          break;
        case 5: {
          // 草
          const grass = scene.add.image(tileX, tileY, 'grass');
          grass.setOrigin(0, 0);
          grass.setDepth(y);
        
          let brick: Phaser.GameObjects.Image | undefined = undefined;
          // x=0, y=0～18 または x=19, y=0～18 の場合はレンガを描画しない
          if (!((x === 0 && y >= 0 && y <= 18) || (x === 19 && y >= 0 && y <= 18))) {
            brick = scene.add.image(tileX, tileY, 'brick');
            brick.setOrigin(0, 0);
            brick.setDisplaySize(64, 64);
            brick.setDepth(y + 0.1);
          }
        
          let barrier;
          // x=0, y=0～18 または x=19, y=0～18 の場合は縦バリケード
          if ((x === 0 && y >= 0 && y <= 18) || (x === 19 && y >= 0 && y <= 18)) {
            barrier = scene.add.image(tileX + 32, tileY, 'wood_barrier_vertical');
            barrier.setOrigin(0.5, 0);
            barrier.setDisplaySize(130, 130);
            barrier.setDepth(1000 + y);
        
            // x=0, y=0 のときだけ通常バリケードも後ろに追加
            if (x === 0 && y === 0) {
              const normalBarrier = scene.add.image(tileX + 32, tileY, 'wood_barrier');
              normalBarrier.setOrigin(0.5, 0);
              normalBarrier.setDisplaySize(68, 65);
              normalBarrier.setDepth(999 + y); // 縦バリケードより後ろ
              chunkMap.set(`${x},${y}`, [grass, normalBarrier, barrier]);
              continue;
            }
            // ★ x=19, y=0 のときも通常バリケードを背面に追加
            if (x === 19 && y === 0) {
              const normalBarrier = scene.add.image(tileX + 32, tileY, 'wood_barrier');
              normalBarrier.setOrigin(0.5, 0);
              normalBarrier.setDisplaySize(68, 65);
              normalBarrier.setDepth(999 + y); // 縦バリケードより後ろ
              chunkMap.set(`${x},${y}`, [grass, normalBarrier, barrier]);
              continue;
            }
          }
          // ★ x=19, y=19 の場合は通常バリケードのみ
          else if (x === 19 && y === 19) {
            barrier = scene.add.image(tileX + 32, tileY, 'wood_barrier');
            barrier.setOrigin(0.5, 0);
            barrier.setDisplaySize(68, 65);
            barrier.setDepth(1000 + y);
            chunkMap.set(`${x},${y}`, [grass, barrier]);
            continue;
          } else {
            barrier = scene.add.image(tileX + 32, tileY, 'wood_barrier');
            barrier.setOrigin(0.5, 0);
            barrier.setDisplaySize(68, 65);
            barrier.setDepth(1000 + y);
          }
        
          const tileKey = `${x},${y}`;
          if (brick) {
            chunkMap.set(tileKey, [grass, brick, barrier]);
          } else {
            chunkMap.set(tileKey, [grass, barrier]);
          }
          continue;
        }
        default:
          // 既にchunkMapに何かセットされていれば草を追加しない
          if (!chunkMap.has(`${x},${y}`)) {
            sprite = scene.add.image(tileX, tileY, 'grass');
            sprite.setOrigin(0, 0);
            sprite.setDepth(y);
            chunkMap.set(`${x},${y}`, [sprite]);
          }
          break;
      }

      const tileKey = `${x},${y}`;
      if (sprite) {
        chunkMap.set(tileKey, [sprite]);
      }
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