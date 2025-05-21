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
}

// プレイヤー移動入力・処理
export function updatePlayerMovement(scene: FieldScene, showMessage: (scene: FieldScene, text: string) => void, getTileTypeName: (tileType: number) => string) {
  if (scene.editMode) return;

  let direction: string | null = null;

  if (scene.cursors?.left.isDown) {
    direction = 'left';
  } else if (scene.cursors?.right.isDown) {
    direction = 'right';
  } else if (scene.cursors?.up.isDown) {
    direction = 'up';
  } else if (scene.cursors?.down.isDown) {
    direction = 'down';
  }

  if (scene.canMove && direction) {
    moveInDirection(scene, direction);
  } else if (direction) {
    scene.nextMoveDirection = direction;
  } else {
    scene.nextMoveDirection = null;
  }

  if (Phaser.Input.Keyboard.JustDown(scene.spaceKey as Phaser.Input.Keyboard.Key)) {
    showMessage(
      scene,
      `現在地: (${scene.playerGridX}, ${scene.playerGridY})\nタイル: ${getTileTypeName(scene.mapData[scene.playerGridY][scene.playerGridX])}`
    );
  }
}

// プレイヤーの方向移動
export function moveInDirection(scene: FieldScene, direction: string) {
  if (!scene.canMove) return;
  let newPlayerX = scene.playerGridX;
  let newPlayerY = scene.playerGridY;

  switch (direction) {
    case 'left':
      newPlayerX = Math.max(0, scene.playerGridX - 1);
      break;
    case 'right':
      newPlayerX = Math.min(scene.mapSize - 1, scene.playerGridX + 1);
      break;
    case 'up':
      newPlayerY = Math.max(0, scene.playerGridY - 1);
      break;
    case 'down':
      newPlayerY = Math.min(scene.mapSize - 1, scene.playerGridY + 1);
      break;
  }

  const tileType = scene.mapData[newPlayerY][newPlayerX];
  if (tileType === 1 || tileType === 3) {
    return;
  }

  scene.lastDirection = direction;

  if (newPlayerX !== scene.playerGridX || newPlayerY !== scene.playerGridY) {
    scene.canMove = false;

    scene.playerGridX = newPlayerX;
    scene.playerGridY = newPlayerY;

    if (scene.playerMarker) {
      scene.playerMarker.anims.play(`player_${direction}`, true);
    }

    movePlayerToGrid(scene);
    updatePositionText(scene);
  }
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
    duration: 160 / scene.movementSpeed,
    ease: 'Linear',
    onUpdate: () => {
      if (scene.cameras.main && scene.playerMarker) {
        scene.cameras.main.centerOn(scene.playerMarker.x, scene.playerMarker.y);
      }
    },
    onComplete: () => {
      scene.canMove = true;
      if (scene.nextMoveDirection) {
        const nextDir = scene.nextMoveDirection;
        scene.nextMoveDirection = null;
        scene.time.addEvent({
          delay: 0,
          callback: () => moveInDirection(scene, nextDir)
        });
      }
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