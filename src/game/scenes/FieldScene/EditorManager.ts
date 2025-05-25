import { FieldScene } from './index';

// エディタUIの作成
export function createEditorUI(scene: FieldScene) {
  // パレットUIの作成
  scene.paletteUI = scene.add.container(10, 100);
  scene.paletteUI.setScrollFactor(0);
  scene.paletteUI.setDepth(5000);

  const bg = scene.add.rectangle(0, 0, 100, 360, 0x333333, 0.8);
  bg.setOrigin(0, 0);
  scene.paletteUI.add(bg);

  // パレットアイテム
  const items = [
    { type: 'grass', label: '草原', y: 40, scale: 1.0 },
  ];

  items.forEach(item => {
    const icon = scene.add.image(60, item.y, item.type);
    icon.setScale(item.scale);
    icon.setScrollFactor(0);
    icon.setDepth(5500);

    icon.setInteractive({
      useHandCursor: true,
      pixelPerfect: false,
      draggable: true
    });

    scene.input.setDraggable(icon);

    icon.setData('type', item.type);
    icon.setData('scale', item.scale);
    icon.setData('isPaletteItem', true);

    icon.on('pointerover', () => {
      icon.setTint(0xffff00);
      document.body.style.cursor = 'grab';
    });

    icon.on('pointerout', () => {
      icon.clearTint();
      document.body.style.cursor = 'default';
    });

    icon.on('pointerdown', () => {
      icon.setTint(0xff0000);
      scene.selectedTileType = item.type;
      document.body.style.cursor = 'grabbing';
    });

    // ラベル
    const text = scene.add.text(60, item.y + 25, item.label, {
      font: '14px Arial',
      color: '#ffffff'
    });
    text.setOrigin(0.5);
    text.setScrollFactor(0);
    text.setDepth(5500);

    scene.paletteUI?.add(icon);
    scene.paletteUI?.add(text);
  });

  // 保存ボタン
  const saveButton = scene.add.rectangle(50, 320, 80, 30, 0x0066cc);
  saveButton.setOrigin(0.5);
  saveButton.setInteractive({ useHandCursor: true });

  const saveText = scene.add.text(50, 320, '保存', {
    font: '16px Arial',
    color: '#ffffff'
  });
  saveText.setOrigin(0.5);

  scene.paletteUI.add(saveButton);
  scene.paletteUI.add(saveText);

  saveButton.on('pointerdown', () => {
    saveMap(scene);
  });

  // ドラッグ設定
  setupDragEvents(scene);

  // 現在のタイルタイプ表示
  const statusText = scene.add.text(
    10,
    scene.cameras.main.height - 40,
    `選択中: ${getItemLabelByType(scene.selectedTileType)}`,
    { font: '16px Arial', color: '#ffffff', backgroundColor: '#000000' }
  );
  statusText.setScrollFactor(0);
  statusText.setDepth(5500);
  scene.paletteUI.add(statusText);
}

// エディタUIの破棄
export function destroyEditorUI(scene: FieldScene) {
  if (scene.paletteUI) {
    scene.paletteUI.destroy(true);
    scene.paletteUI = undefined;
  }
  document.body.style.cursor = 'default';
}

// ドラッグイベント設定
export function setupDragEvents(scene: FieldScene) {
  scene.input.on('dragstart', (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
    if (gameObject.getData('isPaletteItem')) {
      scene.dragPreview = scene.add.image(pointer.x, pointer.y, gameObject.getData('type'));
      scene.dragPreview.setScale(gameObject.getData('scale'));
      scene.dragPreview.setAlpha(0.7);
      scene.dragPreview.setDepth(6000);
    }
  });

  scene.input.on('drag', (pointer: Phaser.Input.Pointer) => {
    if (scene.dragPreview) {
      scene.dragPreview.x = pointer.x;
      scene.dragPreview.y = pointer.y;
    }
  });

  scene.input.on('dragend', (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
    if (scene.dragPreview) {
      const worldPoint = pointer.positionToCamera(scene.cameras.main) as Phaser.Math.Vector2;
      const gridX = Math.floor(worldPoint.x / 64);
      const gridY = Math.floor(worldPoint.y / 64);

      if (
        gridX >= 0 && gridX < scene.mapSize &&
        gridY >= 0 && gridY < scene.mapSize
      ) {
        scene.mapData[gridY][gridX] = getTileTypeByKey(gameObject.getData('type'));
        // ここでマップ再描画やチャンク再読み込みが必要なら呼び出す
      }

      scene.dragPreview.destroy();
      scene.dragPreview = undefined;
      document.body.style.cursor = 'default';
    }
  });
}

// マップ保存
export function saveMap(scene: FieldScene) {
  localStorage.setItem('customMapData', JSON.stringify(scene.mapData));
  // 必要ならメッセージ表示など
}

// タイルタイプ取得
function getTileTypeByKey(type: string): number {
  switch (type) {
    case 'grass': return 0;
    case 'tree': return 1;
    case 'castle': return 2;
    case 'rock': return 3;
    default: return 0;
  }
}

// タイルタイプに対応するラベル取得
function getItemLabelByType(tileType: string): string {
  switch (tileType) {
    case 'grass': return '草原';
    case 'tree': return '森';
    case 'castle': return 'お城';
    case 'rock': return '岩山';
    default: return '不明';
  }
}