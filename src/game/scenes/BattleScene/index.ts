console.log('BattleSceneファイルが読み込まれた');
import Phaser from 'phaser';

export class BattleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BattleScene' });
  }

  preload() {
    this.load.image('enemy_slime_top', '/assets/enemy_slime_top.png');     // 上半身
    this.load.image('enemy_slime_bottom', '/assets/enemy_slime_bottom.png'); // 下半身
    this.load.audio('battle_bgm', '/assets/battle_bgm.mp3');
    this.load.audio('attack_se', '/assets/attack.mp3');
    this.load.audio('damage_se', '/assets/damage.mp3');
  }

  create() {
    // フィールドBGMなどを停止
    this.sound.stopAll();

    // 背景色
    this.cameras.main.setBackgroundColor(0x222244);

    // フレーム
    const frameMargin = 10;
    const frameWidth = this.cameras.main.width - frameMargin * 2;
    const frameHeight = this.cameras.main.height - frameMargin * 2;
    const frame = this.add.graphics();
    frame.lineStyle(6, 0xffffff, 1);
    frame.strokeRect(frameMargin, frameMargin, frameWidth, frameHeight);

    // --- 敵キャラ画像（下半身→上半身の順で重ねる） ---
    const enemyX = this.cameras.main.centerX;
    const enemyY = this.cameras.main.centerY + 20;
    const scale = 0.5;

    // 位置調整用オフセット
    const bottomOffset = 248; // 下半身を下にずらす
    const topOffset = -8.5;   // 上半身を上にずらす

    // 上半身（背面にしたいので先に追加）
    const enemyTop = this.add.image(
      enemyX,
      enemyY + topOffset,
      'enemy_slime_top'
    ).setOrigin(0.5, 0.5).setScale(scale);

    // 下半身（前面にしたいので後に追加）
    const enemyBottom = this.add.image(
      enemyX,
      enemyY + bottomOffset,
      'enemy_slime_bottom'
    ).setOrigin(0.5, 0.5).setScale(scale);

    // 上半身だけ呼吸アニメーション（動作小さめ）
    this.tweens.add({
      targets: enemyTop,
      scaleY: 0.51,
      scaleX: 0.5,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // --- 高級感・渋みのある黄金プレート ---
    const plateWidth = 250;
    const plateHeight = 30;
    const plateX = this.cameras.main.centerX - plateWidth / 2;
    const plateY = 20;

    const plate = this.add.graphics();
    plate.fillStyle(0xB8860B, 1); // ダークゴールド（下地）
    plate.fillRoundedRect(plateX, plateY, plateWidth, plateHeight, 20);

    plate.fillStyle(0xFFD700, 0.7); // 明るいゴールド（上部に重ねてグラデ感）
    plate.fillRoundedRect(plateX, plateY, plateWidth, plateHeight / 2, { tl: 20, tr: 20, bl: 0, br: 0 });

    plate.lineStyle(5, 0x8B7500, 1);
    plate.strokeRoundedRect(plateX, plateY, plateWidth, plateHeight, 20);

    plate.fillStyle(0xffffff, 0.13);
    plate.fillRoundedRect(plateX + 12, plateY + 10, plateWidth - 24, 14, 8);

    // --- 名前テキスト ---
    this.add.text(
      this.cameras.main.centerX,
      plateY + plateHeight / 2,
      'ボスキャラ',
      {
        fontSize: '20px',
        fontFamily: '"Cinzel Decorative", "Orbitron", Arial',
        color: '#fff8dc',
        fontStyle: 'bold',
        stroke: '#8B7500',
        strokeThickness: 6,
        shadow: {
          offsetX: 0,
          offsetY: 2,
          color: '#fffacd',
          blur: 8,
          stroke: true,
          fill: true
        }
      }
    ).setOrigin(0.5);

    // --- コマンドボタン配置（領域展開でサブコマンド展開） ---
    const commands = ['人格主義の波動', '領域展開'];
    const subCommands = ['第１領域', '第２領域', '第３領域', '第４領域'];
    const buttonHeight = 38;
    const buttonMargin = 16;
    const paddingX = 24;
    const startY = this.cameras.main.centerY - ((buttonHeight + buttonMargin) * (commands.length + subCommands.length)) / 2 + 20;
    const buttonX = this.cameras.main.centerX + 300;

    const subBtnElements: { btn: Phaser.GameObjects.Graphics, btnText: Phaser.GameObjects.Text, zone: Phaser.GameObjects.Zone }[] = [];
    let subCommandsVisible = false;
    let domainBtnCenterX = 0;
    let domainBtnCenterY = 0;

    commands.forEach((label, i) => {
      const tempText = this.add.text(0, 0, label, {
        fontSize: '20px',
        fontFamily: '"Orbitron", Arial',
        fontStyle: 'bold',
      }).setVisible(false);

      const textWidth = tempText.width;
      const buttonWidth = textWidth + paddingX * 2;
      const btnY = startY + i * (buttonHeight + buttonMargin);
      const btnCenterX = buttonX + buttonWidth / 2;
      const btnCenterY = btnY + buttonHeight / 2;

      if (label === '領域展開') {
        domainBtnCenterX = btnCenterX;
        domainBtnCenterY = btnCenterY;
      }

      const btn = this.add.graphics();
      btn.setPosition(btnCenterX, btnCenterY);
      btn.fillStyle(0x222222, 0.85);
      btn.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 10);
      btn.lineStyle(2, 0xFFD700, 1);
      btn.strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 10);

      const zone = this.add.zone(
        btnCenterX, btnCenterY, buttonWidth, buttonHeight
      ).setOrigin(0.5).setInteractive({ useHandCursor: true });

      const btnText = this.add.text(
        btnCenterX,
        btnCenterY,
        label,
        {
          fontSize: '20px',
          fontFamily: '"Orbitron", Arial',
          color: '#fff8dc',
          fontStyle: 'bold',
          stroke: '#8B7500',
          strokeThickness: 3,
        }
      ).setOrigin(0.5);

      zone.on('pointerover', () => {
        btn.setScale(1.08);
        btnText.setScale(1.08);
      });
      zone.on('pointerout', () => {
        btn.setScale(1);
        btnText.setScale(1);
      });

      if (label === '人格主義の波動') {
        zone.on('pointerdown', () => {
          this.sound.play('attack_se'); // 音はすぐ鳴らす
          this.time.delayedCall(1000, () => { // 点滅だけ遅らせる
            this.tweens.add({
              targets: [enemyTop, enemyBottom],
              alpha: 0,
              duration: 120,
              yoyo: true,
              repeat: 4
            });
          });
        });
      }

      if (label === '領域展開') {
        zone.on('pointerdown', () => {
          subCommandsVisible = !subCommandsVisible;
          subBtnElements.forEach(e => {
            e.btn.setVisible(subCommandsVisible);
            e.btnText.setVisible(subCommandsVisible);
            e.zone.setVisible(subCommandsVisible);
          });
        });
      }

      tempText.destroy();
    });

    const subIndent = 40;
    subCommands.forEach((label, i) => {
      const tempText = this.add.text(0, 0, label, {
        fontSize: '20px',
        fontFamily: '"Orbitron", Arial',
        fontStyle: 'bold',
      }).setVisible(false);

      const textWidth = tempText.width;
      const buttonWidth = textWidth + paddingX * 2;
      const btnY = domainBtnCenterY + (buttonHeight + buttonMargin) * (i + 1);
      const btnCenterX = domainBtnCenterX + subIndent;
      const btnCenterY = btnY;

      const btn = this.add.graphics();
      btn.setPosition(btnCenterX, btnCenterY);
      btn.fillStyle(0x222222, 0.85);
      btn.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 10);
      btn.lineStyle(2, 0xFFD700, 1);
      btn.strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 10);

      const zone = this.add.zone(
        btnCenterX, btnCenterY, buttonWidth, buttonHeight
      ).setOrigin(0.5).setInteractive({ useHandCursor: true });

      const btnText = this.add.text(
        btnCenterX,
        btnCenterY,
        label,
        {
          fontSize: '20px',
          fontFamily: '"Orbitron", Arial',
          color: '#fff8dc',
          fontStyle: 'bold',
          stroke: '#8B7500',
          strokeThickness: 3,
        }
      ).setOrigin(0.5);

      zone.on('pointerover', () => {
        btn.setScale(1.08);
        btnText.setScale(1.08);
      });
      zone.on('pointerout', () => {
        btn.setScale(1);
        btnText.setScale(1);
      });

      if (label === '第１領域' || label === '第２領域') {
        zone.on('pointerdown', () => {
          this.sound.play('attack_se'); // 音はすぐ鳴らす
          this.time.delayedCall(1000, () => { // 点滅だけ遅らせる
            this.tweens.add({
              targets: [enemyTop, enemyBottom],
              alpha: 0,
              duration: 120,
              yoyo: true,
              repeat: 4
            });
          });
        });
      }

      if (label === '第３領域' || label === '第４領域') {
        zone.on('pointerdown', () => {
          this.cameras.main.shake(250, 0.012);
          this.sound.play('damage_se');
        });
      }

      btn.setVisible(false);
      btnText.setVisible(false);
      zone.setVisible(false);

      subBtnElements.push({ btn, btnText, zone });

      tempText.destroy();
    });

    const battleBgm = this.sound.add('battle_bgm', { loop: true, volume: 0.7 });
    battleBgm.play();
  }
}