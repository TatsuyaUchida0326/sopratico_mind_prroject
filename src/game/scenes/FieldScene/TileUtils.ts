export function getTileTypeName(tileType: number): string {
  switch (tileType) {
    case 0: return '草原';
    case 1: return '森';
    case 2: return 'お城';
    case 3: return '岩山';
    case 4: return '床レンガ';
    case 5: return 'バリケード';
    default: return '不明';
  }
}