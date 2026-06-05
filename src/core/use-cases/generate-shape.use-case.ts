import {type Container, Graphics} from 'pixi.js-legacy';

export const ShapeName = {
  RECT: 'graphics_rect',
  CIRCLE: 'graphics_circle',
  TRIANGLE: 'graphics_triangle',
  LINE: 'graphics_line',
} as const;

export type ShapeNameType = typeof ShapeName[keyof typeof ShapeName];

export class GenerateShapeUseCase {
  private readonly MAX_HEX_COLOR = 16777215;
  private static readonly SHAPE_TYPES: readonly ShapeNameType[] = Object.values(ShapeName);

  public execute(targetContainer: Container): void {
    const graphics = new Graphics();
    const randomColor = Math.floor(Math.random() * this.MAX_HEX_COLOR);

    const shapeIndex = Math.floor(Math.random() * GenerateShapeUseCase.SHAPE_TYPES.length);
    const chosenShape = GenerateShapeUseCase.SHAPE_TYPES[shapeIndex];

    if (chosenShape === ShapeName.LINE) {
      graphics.lineStyle(2 + Math.random() * 8, randomColor);
      this.drawRandomLine(graphics);
    } else {
      graphics.beginFill(randomColor);

      if (chosenShape === ShapeName.RECT) {
        this.drawRandomRect(graphics);
      } else if (chosenShape === ShapeName.CIRCLE) {
        this.drawRandomCircle(graphics);
      } else if (chosenShape === ShapeName.TRIANGLE) {
        this.drawRandomTriangle(graphics);
      }

      graphics.endFill();
    }

    graphics.name = chosenShape;
    targetContainer.addChild(graphics);
  }

  private drawRandomRect(g: Graphics): void {
    const x = Math.random() * 300;
    const y = Math.random() * 300;
    const size = 50 + Math.random() * 100;
    g.drawRect(x, y, size, size);
  }

  private drawRandomCircle(g: Graphics): void {
    const x = 50 + Math.random() * 250;
    const y = 50 + Math.random() * 250;
    const radius = 25 + Math.random() * 50;
    g.drawCircle(x, y, radius);
  }

  private drawRandomTriangle(g: Graphics): void {
    const startX = Math.random() * 300;
    const startY = Math.random() * 300;
    const size = 50 + Math.random() * 100;

    g.moveTo(startX, startY);
    g.lineTo(startX + size, startY);
    g.lineTo(startX + size / 2, startY - size);
    g.closePath();
  }

  private drawRandomLine(g: Graphics): void {
    const startX = Math.random() * 300;
    const startY = Math.random() * 300;
    const endX = Math.random() * 300;
    const endY = Math.random() * 300;

    g.moveTo(startX, startY);
    g.lineTo(endX, endY);
  }
}
