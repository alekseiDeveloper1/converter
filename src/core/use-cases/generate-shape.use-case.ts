import * as PIXI from 'pixi.js-legacy';

export class GenerateShapeUseCase {
  public execute(targetContainer: PIXI.Container): void {
    const randomX = Math.random() * 300;
    const randomY = Math.random() * 300;
    const randomSize = 50 + Math.random() * 100;
    const randomColor = Math.floor(Math.random() * 16777215);

    const randomGraphics = new PIXI.Graphics();
    randomGraphics.beginFill(randomColor);
    randomGraphics.drawRect(randomX, randomY, randomSize, randomSize);
    randomGraphics.endFill();

    randomGraphics.name = 'graphics_rect';

    targetContainer.addChild(randomGraphics);
  }
}
