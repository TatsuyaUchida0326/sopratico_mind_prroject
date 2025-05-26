// タイル
import grassTile from '../../assets/grass.png';
import forestTile from '../../assets/forest.png';
import brickTile from '../../assets/brick.png';
import woodBarrierTile from '../../assets/wood_barrier.png';
import woodBarrierVerticalTile from '../../assets/wood_barrier_vertical.png';

// 主人公用の画像
import characterDown1 from '../../assets/character_down_1.png';
import characterDown2 from '../../assets/character_down_2.png';
import characterRight1 from '../../assets/character_right_1.png';
import characterRight2 from '../../assets/character_right_2.png';
import characterUp1 from '../../assets/character_up_1.png';
import characterUp2 from '../../assets/character_up_2.png';
import characterLeft1 from '../../assets/character_left_1.png';
import characterLeft2 from '../../assets/character_left_2.png';

// 仲間1用の画像
import character1Down1 from '../../assets/character1_down_1.png';
import character1Down2 from '../../assets/character1_down_2.png';
import character1Right1 from '../../assets/character1_right_1.png';
import character1Right2 from '../../assets/character1_right_2.png';
import character1Up1 from '../../assets/character1_up_1.png';
import character1Up2 from '../../assets/character1_up_2.png';
import character1Left1 from '../../assets/character1_left_1.png';
import character1Left2 from '../../assets/character1_left_2.png';

// 仲間2用の画像
import character2Down1 from '../../assets/character2_down_1.png';
import character2Down2 from '../../assets/character2_down_2.png';
import character2Right1 from '../../assets/character2_right_1.png';
import character2Right2 from '../../assets/character2_right_2.png';
import character2Up1 from '../../assets/character2_up_1.png';
import character2Up2 from '../../assets/character2_up_2.png';
import character2Left1 from '../../assets/character2_left_1.png';
import character2Left2 from '../../assets/character2_left_2.png';

// 仲間3用の画像
import character3Down1 from '../../assets/character3_down_1.png';
import character3Down2 from '../../assets/character3_down_2.png';
import character3Right1 from '../../assets/character3_right_1.png';
import character3Right2 from '../../assets/character3_right_2.png';
import character3Up1 from '../../assets/character3_up_1.png';
import character3Up2 from '../../assets/character3_up_2.png';
import character3Left1 from '../../assets/character3_left_1.png';
import character3Left2 from '../../assets/character3_left_2.png';

// BGM
import fieldBgm from '../../assets/field_bgm.mp3';

// エクスポート
export const tiles = {
  grass: grassTile,
  forest: forestTile,
  brick: brickTile,
  wood_barrier: woodBarrierTile,
  wood_barrier_vertical: woodBarrierVerticalTile,
};

export const characters = {
  player: {
    down: [characterDown1, characterDown2],
    up: [characterUp1, characterUp2],
    left: [characterLeft1, characterLeft2],
    right: [characterRight1, characterRight2]
  },
  follower1: {
    down: [character1Down1, character1Down2],
    up: [character1Up1, character1Up2],
    left: [character1Left1, character1Left2],
    right: [character1Right1, character1Right2]
  },
  follower2: {
    down: [character2Down1, character2Down2],
    up: [character2Up1, character2Up2],
    left: [character2Left1, character2Left2],
    right: [character2Right1, character2Right2]
  },
  follower3: {
    down: [character3Down1, character3Down2],
    up: [character3Up1, character3Up2],
    left: [character3Left1, character3Left2],
    right: [character3Right1, character3Right2]
  }
};

export const audio = {
  fieldBgm
};

// 元のコードとの互換性のために個別にエクスポート（必要な場合）
export {
  grassTile,
  characterDown1,
  characterDown2,
  characterRight1,
  characterRight2,
  characterUp1,
  characterUp2,
  characterLeft1,
  characterLeft2,
  fieldBgm
};