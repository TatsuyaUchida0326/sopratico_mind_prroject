import type { FieldScene } from './index';

// UIの作成
export function createUI(scene: FieldScene) {
  scene.positionText = scene.add.text(10, 10, `X: ${scene.playerGridX}, Y: ${scene.playerGridY}`, {
    font: '16px Arial',
    color: '#ffffff',
    backgroundColor: '#000000'
  });
  scene.positionText.setScrollFactor(0);
  scene.positionText.setDepth(2000);

  scene.speedText = scene.add.text(10, 40, `Speed: ${scene.movementSpeed}`, {
    font: '16px Arial',
    color: '#ffffff',
    backgroundColor: '#000000'
  });
  scene.speedText.setScrollFactor(0);
  scene.speedText.setDepth(2000);

  scene.helpText = scene.add.text(
    scene.cameras.main.width - 10,
    10,
    '← → ↑ ↓: 移動\nE: エディターモード\n+/-: 移動速度\nM: ミニマップ',
    {
      font: '16px Arial',
      color: '#ffffff',
      backgroundColor: '#000000',
      align: 'right'
    }
  ) as Phaser.GameObjects.Text;
  (scene.helpText as Phaser.GameObjects.Text).setOrigin(1, 0);
  (scene.helpText as Phaser.GameObjects.Text).setScrollFactor(0);
  (scene.helpText as Phaser.GameObjects.Text).setDepth(2000);

  scene.input.keyboard?.on('keydown-M', scene.toggleMiniMap, scene);

  scene.input.keyboard?.on('keydown-PLUS', () => {
    scene.movementSpeed = Math.min(3, +(scene.movementSpeed + 0.1).toFixed(1));
    updateSpeedText(scene);
  });

  scene.input.keyboard?.on('keydown-MINUS', () => {
    scene.movementSpeed = Math.max(0.1, +(scene.movementSpeed - 0.1).toFixed(1));
    updateSpeedText(scene);
  });
}

// 座標表示の更新
export function updatePositionText(scene: FieldScene) {
  if (scene.positionText) {
    const tileId = scene.mapData[0][scene.playerGridY][scene.playerGridX]; // ← レイヤー0を明示
    scene.positionText.setText(`X: ${scene.playerGridX}, Y: ${scene.playerGridY} - ${
      tileId === 0 ? '草原' :
      tileId === 1 ? '森' :
      tileId === 2 ? 'お城' : '岩山'
    }`);
  }
}

// スピード表示の更新
export function updateSpeedText(scene: FieldScene) {
  if (scene.speedText) {
    scene.speedText.setText(`Speed: ${scene.movementSpeed.toFixed(1)}`);
  }
}

// メッセージ表示
export function showMessage(scene: FieldScene, text: string) {
  if (scene.currentMessage) {
    scene.currentMessage.destroy();
  }

  scene.currentMessage = scene.add.text(
    scene.cameras.main.centerX,
    scene.cameras.main.height - 100,
    text,
    {
      font: '18px Arial',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 20, y: 10 }
    }
  );
  scene.currentMessage.setOrigin(0.5, 0.5);
  scene.currentMessage.setScrollFactor(0);
  scene.currentMessage.setDepth(1000);

  scene.time.delayedCall(3000, () => {
    if (scene.currentMessage) {
      scene.currentMessage.destroy();
      scene.currentMessage = undefined;
    }
  });
}