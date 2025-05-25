import type { FieldScene } from './FieldSceneTypes';
import { updatePositionText } from './UIManager';

// プレイヤー配置
export function placePlayer(scene: FieldScene) {
  const x = scene.grid[scene.playerGridY][scene.playerGridX].x;
  const y = scene.grid[scene.playerGridY][scene.playerGridX].y;
  scene.playerMarker = scene.add.sprite(x + 32, y + 32, 'character_down_1');
  scene.playerMarker.setOrigin(0.5, 0.6);
  scene.playerMarker.setScale(1.7);
  scene.playerMarker.setDepth(1000);
  scene.cameras.main.startFollow(scene.playerMarker, true, 0.1, 0.1);   // ここでカメラ追尾を有効化
}

// シームレスなリアルタイム移動（上下左右のみ、斜め禁止）
export function updatePlayerMovement(
  scene: FieldScene,
  showMessage: (scene: FieldScene, text: string) => void,
  getTileTypeName: (tileType: number) => string
) {
  if (scene.editMode) return;
  if (!scene.playerMarker) return;

  let vx = 0, vy = 0;
  const speed = 3; // 1フレームあたりの移動ピクセル数（調整可）

  // 上下左右のうち、同時押しの場合は優先順位で1方向のみ
  if (scene.cursors?.left.isDown) {
    vx = -speed;
  } else if (scene.cursors?.right.isDown) {
    vx = speed;
  } else if (scene.cursors?.up.isDown) {
    vy = -speed;
  } else if (scene.cursors?.down.isDown) {
    vy = speed;
  }

  // 斜め移動禁止（vxとvyが同時に非ゼロにならない）
  // 上記のif-elseで既に実現

  // 次に進むグリッド座標を計算
  const nextX = scene.playerMarker.x + vx;
  const nextY = scene.playerMarker.y + vy;
  const gridX = Math.floor(nextX / 64);
  const gridY = Math.floor(nextY / 64);

  // 範囲外・移動不可タイルなら止める
  if (
    gridX < 0 || gridX >= scene.mapSize ||
    gridY < 0 || gridY >= scene.mapSize ||
    scene.mapData[gridY][gridX] === 1 || scene.mapData[gridY][gridX] === 3
  ) {
    return;
  }

  // 実際に移動
  scene.playerMarker.x += vx;
  scene.playerMarker.y += vy;

  // カメラ追尾
  scene.cameras.main.centerOn(scene.playerMarker.x, scene.playerMarker.y);

  // グリッド座標の更新
  scene.playerGridX = gridX;
  scene.playerGridY = gridY;

  // アニメーション制御
  if (vx !== 0 || vy !== 0) {
    let direction = scene.lastDirection;
    if (vx < 0) direction = 'left';
    else if (vx > 0) direction = 'right';
    else if (vy < 0) direction = 'up';
    else if (vy > 0) direction = 'down';
    if (scene.playerMarker.anims) {
      scene.playerMarker.anims.play(`player_${direction}`, true);
    }
    scene.lastDirection = direction;
  } else {
    if (scene.playerMarker.anims && scene.playerMarker.anims.isPlaying) {
      scene.playerMarker.anims.stop();
      scene.playerMarker.setTexture(`character_${scene.lastDirection}_1`);
    }
  }

  // スペースキーで情報表示（任意）
  if (Phaser.Input.Keyboard.JustDown(scene.spaceKey as Phaser.Input.Keyboard.Key)) {
    showMessage(
      scene,
      `現在地: (${scene.playerGridX}, ${scene.playerGridY})\nタイル: ${getTileTypeName(scene.mapData[scene.playerGridY][scene.playerGridX])}`
    );
  }
}

// プレイヤーの方向移動
export function moveInDirection(scene: FieldScene, direction: string) {
  if (scene.isMoving) return; // ← 追加

  let newPlayerX = scene.playerGridX;
  let newPlayerY = scene.playerGridY;

  switch (direction) {
    case 'left':  newPlayerX--; break;
    case 'right': newPlayerX++; break;
    case 'up':    newPlayerY--; break;
    case 'down':  newPlayerY++; break;
  }

  // 範囲外なら移動しない
  if (
    newPlayerX < 0 ||
    newPlayerX >= scene.mapSize ||
    newPlayerY < 0 ||
    newPlayerY >= scene.mapSize
  ) {
    return;
  }

  const tileType = scene.mapData[newPlayerY][newPlayerX];
  if (tileType === 1 || tileType === 3) {
    return;
  }

  scene.lastDirection = direction;
  scene.isMoving = true; // ← 追加

  scene.playerGridX = newPlayerX;
  scene.playerGridY = newPlayerY;

  if (scene.playerMarker) {
    scene.playerMarker.anims.play(`player_${direction}`, true);
  }

  movePlayerToGrid(scene);
  updatePositionText(scene);
}

// プレイヤーのグリッド移動アニメーション
export function movePlayerToGrid(scene: FieldScene) {
  if (!scene.playerMarker) return;

  const x = scene.grid[scene.playerGridY][scene.playerGridX].x;
  const y = scene.grid[scene.playerGridY][scene.playerGridX].y;

  scene.tweens.killTweensOf(scene.playerMarker);

  scene.tweens.add({
    targets: scene.playerMarker,
    x: x + 32,
    y: y + 32,
    duration: 120, // ← 速さは調整
    ease: 'Linear',
    onUpdate: () => {
      if (scene.cameras.main && scene.playerMarker) {
        scene.cameras.main.centerOn(scene.playerMarker.x, scene.playerMarker.y);
      }
    },
    onComplete: () => {
      scene.isMoving = false; // ← 追加
    }
  });
}

// プレイヤーアニメーション制御
export function animatePlayer(scene: FieldScene) {
  if (!scene.playerMarker) return;

  if (scene.canMove) {
    const moving = !!(
      scene.cursors?.left.isDown ||
      scene.cursors?.right.isDown ||
      scene.cursors?.up.isDown ||
      scene.cursors?.down.isDown
    );

    if (!moving && scene.playerMarker.anims.isPlaying) {
      scene.playerMarker.anims.stop();
      scene.playerMarker.setTexture(`character_${scene.lastDirection}_1`);
    }
  }
}