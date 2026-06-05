import {type Container, Graphics} from 'pixi.js-legacy';

export class GenerateShapeUseCase {
  private readonly MAX_HEX_COLOR = 16777215;

  public execute(targetContainer: Container): void {
    const graphics = new Graphics();
    const randomColor = Math.floor(Math.random() * this.MAX_HEX_COLOR);

    const shapeType = Math.floor(Math.random() * 4);

    if (shapeType === 3) {
      graphics.lineStyle(2 + Math.random() * 8, randomColor);
      this.drawRandomLine(graphics);
      graphics.name = 'graphics_line';
    } else {
      graphics.beginFill(randomColor);

      if (shapeType === 0) {
        this.drawRandomRect(graphics);
        graphics.name = 'graphics_rect';
      } else if (shapeType === 1) {
        this.drawRandomCircle(graphics);
        graphics.name = 'graphics_circle';
      } else {
        this.drawRandomTriangle(graphics);
        graphics.name = 'graphics_triangle';
      }

      graphics.endFill();
    }

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
