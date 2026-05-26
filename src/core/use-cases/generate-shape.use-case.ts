import type { IVectorRenderer } from '../interfaces/i-vector-renderer';

export class GenerateShapeUseCase {
  private renderer: IVectorRenderer;

  constructor(renderer: IVectorRenderer) {
    this.renderer = renderer;
  }

  public execute(): void {
    this.renderer.addGraphics();
  }
}
