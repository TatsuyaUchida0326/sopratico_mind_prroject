export function getTileTypeName(tileType: number): string {
  switch (tileType) {
    case 0: return '草';
    case 1: return '森';
    case 2: return '岩';
    case 3: return '海';
    case 4: return '外壁';
    default: return '不明';
  }
}
