import { FieldScene } from './index';

// エディタUIの作成（タイルUI・設置UIを全て削除したクリーンな状態）
export function createEditorUI(_scene: FieldScene) {
  // 必要ならここに新しいエディタUI処理を追加してください
}

// エディタUIの破棄
export function destroyEditorUI(scene: FieldScene) {
  if (scene.paletteUI) {
    scene.paletteUI.destroy(true);
    scene.paletteUI = undefined;
  }
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