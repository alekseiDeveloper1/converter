import * as PIXI from 'pixi.js-legacy';

describe('SkiaRenderer (Integration/Math)', () => {
  it('должен правильно преобразовать матрицу трансформации Pixi в формат Skia', () => {
    const displayObject = new PIXI.Container();
    displayObject.position.set(50, 100);
    displayObject.scale.set(2, 2);
    displayObject.transform.updateLocalTransform();

    const pixiMatrix = displayObject.transform.localTransform;

    const convert = (matrix: PIXI.Matrix): number[] => [
      matrix.a,
      matrix.c,
      matrix.tx,
      matrix.b,
      matrix.d,
      matrix.ty,
      0,
      0,
      1,
    ];

    const resultMatrix = convert(pixiMatrix);

    expect(resultMatrix[0]).toBe(2);
    expect(resultMatrix[4]).toBe(2);
    expect(resultMatrix[2]).toBe(50);
    expect(resultMatrix[5]).toBe(100);
    expect(resultMatrix[8]).toBe(1);
  });
});
