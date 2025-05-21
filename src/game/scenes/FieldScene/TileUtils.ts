export function getTileTypeName(tileType: number): string {
  switch (tileType) {
    case 0: return '草原';
    case 1: return '森';
    case 2: return 'お城';
    case 3: return '岩山';
    default: return '不明';
  }
}