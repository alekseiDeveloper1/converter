import { convertPixiMatrixToSkia } from '@/infrastructure/shared/matrix-math';

describe('MatrixMath Adapter (TDD)', () => {
  it('должен корректно конвертировать матрицу Pixi в плоский массив для Skia', () => {
    const mockPixiMatrix = {
      a: 2,
      b: 0,
      c: 0,
      d: 2,
      tx: 10,
      ty: 20
    };

    const result = convertPixiMatrixToSkia(mockPixiMatrix);

    expect(result).toEqual([
      2, 0, 10,
      0, 2, 20,
      0, 0, 1
    ]);
  });
});
