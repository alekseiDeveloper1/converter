import * as PIXI from 'pixi.js-legacy';

export class PixiService {
  private readonly CANVAS_SIZE = 500;
  private app: PIXI.Application | null = null;
  private currentContainer: PIXI.Container | null = null;

  public async initialize(containerId: string): Promise<void> {
    const viewport = document.getElementById(containerId);
    if (!viewport) {
      throw new Error(`Не найден контейнер #${containerId}`);
    }

    this.app = new PIXI.Application({
      width: this.CANVAS_SIZE,
      height: this.CANVAS_SIZE,
      backgroundColor: 0xffffff,
      forceCanvas: true
    });

    viewport.appendChild(this.app.view as HTMLCanvasElement);

    this.currentContainer = new PIXI.Container();
    this.app.stage.addChild(this.currentContainer);

    this.createTransformedGroup();
    this.createPathGraphics();
    this.createBasicShapes();

    await this.createAndAddSprite();
  }

  public getRootContainer(): PIXI.Container {
    if (!this.currentContainer) {
      throw new Error('PixiService не инициализирован');
    }
    return this.currentContainer;
  }

  private createTransformedGroup(): void {
    const transformGroup = new PIXI.Container();
    transformGroup.position.set(250, 250);
    transformGroup.rotation = 30 * (Math.PI / 180);
    transformGroup.scale.set(1.2, 0.8);

    const innerRect = new PIXI.Graphics();
    innerRect.beginFill(0x9933ff);
    innerRect.drawRect(-75, -75, 150, 150);
    innerRect.endFill();

    transformGroup.addChild(innerRect);
    this.currentContainer!.addChild(transformGroup);
  }

  private createPathGraphics(): void {
    const pathGraphics = new PIXI.Graphics();

    pathGraphics.lineStyle(6, 0x00cc99, 1);
    pathGraphics.beginFill(0x333333, 0.8);
    pathGraphics.drawRect(30, 30, 120, 80);
    pathGraphics.endFill();

    pathGraphics.lineStyle(4, 0xff9900, 1);
    pathGraphics.beginFill(0xffcc00, 1);
    pathGraphics.moveTo(50, 400);
    pathGraphics.lineTo(150, 300);
    pathGraphics.lineTo(250, 400);
    pathGraphics.closePath();
    pathGraphics.endFill();

    this.currentContainer!.addChild(pathGraphics);
  }

  private createAndAddSprite(): void {
    const vectorSprite = new PIXI.Graphics();

    vectorSprite.position.set(400, 100);
    vectorSprite.scale.set(1.5, 1.5);
    vectorSprite.rotation = Math.PI / 4;
    vectorSprite.alpha = 0.85;

    vectorSprite.beginFill(0x0066cc, 1);
    vectorSprite.drawCircle(0, 0, 14);
    vectorSprite.endFill();

    vectorSprite.beginFill(0xffffff, 1);
    vectorSprite.drawCircle(-5, -3, 2);
    vectorSprite.drawCircle(5, -3, 2);
    vectorSprite.endFill();

    vectorSprite.lineStyle(2, 0xffffff, 1);

    const radius = 7;
    const startAngle = 0.3;
    const endAngle = Math.PI - 0.3;
    const segments = 12;

    const startX = radius * Math.cos(startAngle);
    const startY = radius * Math.sin(startAngle);
    vectorSprite.moveTo(startX, startY);

    for (let i = 1; i <= segments; i++) {
      const pct = i / segments;
      const angle = startAngle + (endAngle - startAngle) * pct;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      vectorSprite.lineTo(x, y);
    }

    vectorSprite.lineStyle(0);

    if (vectorSprite.geometry) {
      const geometryRecord = vectorSprite.geometry as unknown as Record<string, unknown>;
      if (typeof geometryRecord.updateBatches === 'function') {
        (geometryRecord.updateBatches as () => void)();
      }
    }

    this.currentContainer!.addChild(vectorSprite);
  }

  private createBasicShapes(): void {
    const rect = new PIXI.Graphics();
    rect.beginFill(0x0066cc, 1);
    rect.drawRect(120, 120, 160, 160);
    rect.endFill();

    const circle = new PIXI.Graphics();
    circle.beginFill(0xff3333, 0.5);
    circle.drawCircle(220, 220, 70);
    circle.endFill();

    this.currentContainer!.addChild(rect);
    this.currentContainer!.addChild(circle);
  }
}
