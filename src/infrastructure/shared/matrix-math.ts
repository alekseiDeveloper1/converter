interface PixiMatrixLike {
  a: number;
  b: number;
  c: number;
  d: number;
  tx: number;
  ty: number;
}

export function convertPixiMatrixToSkia(pixiMatrix: PixiMatrixLike): number[] {
  return [
    pixiMatrix.a,  pixiMatrix.c,  pixiMatrix.tx,
    pixiMatrix.b,  pixiMatrix.d,  pixiMatrix.ty,
    0,             0,             1
  ];
}
