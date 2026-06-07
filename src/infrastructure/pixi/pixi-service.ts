import {
  Application,
  Container,
  type DisplayObject,
  FederatedPointerEvent,
  Graphics,
} from 'pixi.js-legacy';

export class PixiService {
  private readonly CANVAS_SIZE = 500;
  private app: Application | null = null;
  private currentContainer: Container | null = null;
  private onStateChangeCallback: (() => void) | null = null;
  private clickedTarget: DisplayObject | null = null;

  public async initialize(
    containerId: string,
    onStateChange: () => void,
  ): Promise<void> {
    this.onStateChangeCallback = onStateChange;

    const viewport = document.getElementById(containerId);
    if (!viewport) {
      throw new Error(`Не найден контейнер #${containerId}`);
    }

    this.app = new Application({
      width: this.CANVAS_SIZE,
      height: this.CANVAS_SIZE,
      backgroundColor: 0xffffff,
      forceCanvas: true,
    });

    viewport.appendChild(this.app.view as HTMLCanvasElement);

    this.currentContainer = new Container();
    this.app.stage.addChild(this.currentContainer);

    this.createTransformedGroup();
    this.createPathGraphics();
    this.createBasicShapes();

    this.createAndAddSprite();

    this.setupInitialInteractivity();
  }

  public setupInitialInteractivity(): void {
    if (!this.currentContainer) {
      return;
    }

    const activate = (node: DisplayObject): void => {
      this.makeObjectInteractive(node);
      if (node instanceof Container && node.children.length > 0) {
        node.children.forEach(activate);
      }
    };

    this.currentContainer.children.forEach(activate);
  }

  public makeObjectInteractive(node: DisplayObject): void {
    node.eventMode = 'static';
    node.cursor = 'pointer';

    node.on('pointerdown', (event) => {
      node.alpha = 0.5;
      if (event && typeof event.stopPropagation === 'function') {
        event.stopPropagation();
      }
      this.onStateChangeCallback?.();
    });

    node.on('pointerup', () => {
      node.alpha = 1.0;
      this.onStateChangeCallback?.();
    });

    node.on('pointerupoutside', () => {
      node.alpha = 1.0;
      this.onStateChangeCallback?.();
    });
  }

  public getRootContainer(): Container {
    if (!this.currentContainer) {
      throw new Error('ervice не инициализирован');
    }
    return this.currentContainer;
  }

  private createTransformedGroup(): void {
    const transformGroup = new Container();
    transformGroup.position.set(250, 250);
    transformGroup.rotation = 30 * (Math.PI / 180);
    transformGroup.scale.set(1.2, 0.8);

    const innerRect = new Graphics();
    innerRect.beginFill(0x9933ff);
    innerRect.drawRect(-75, -75, 150, 150);
    innerRect.endFill();

    transformGroup.addChild(innerRect);
    this.currentContainer?.addChild(transformGroup);
  }

  private createPathGraphics(): void {
    const rectGraphics = new Graphics();
    rectGraphics.name = 'gray_rect';
    rectGraphics.lineStyle(6, 0x00cc99, 1);
    rectGraphics.beginFill(0x333333, 0.8);
    rectGraphics.drawRect(30, 30, 120, 80);
    rectGraphics.endFill();
    this.currentContainer?.addChild(rectGraphics);

    const triangleGraphics = new Graphics();
    triangleGraphics.name = 'yellow_triangle';
    triangleGraphics.lineStyle(4, 0xff9900, 1);
    triangleGraphics.beginFill(0xffcc00, 1);
    triangleGraphics.moveTo(50, 400);
    triangleGraphics.lineTo(150, 300);
    triangleGraphics.lineTo(250, 400);
    triangleGraphics.closePath();
    triangleGraphics.endFill();
    this.currentContainer?.addChild(triangleGraphics);
  }

  private createAndAddSprite(): void {
    const vectorSprite = new Graphics();

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
      const geometryRecord = vectorSprite.geometry as unknown as Record<
        string,
        unknown
      >;
      if (typeof geometryRecord.updateBatches === 'function') {
        (geometryRecord.updateBatches as () => void)();
      }
    }

    this.currentContainer?.addChild(vectorSprite);
  }

  private createBasicShapes(): void {
    const rect = new Graphics();
    rect.beginFill(0x0066cc, 1);
    rect.drawRect(120, 120, 160, 160);
    rect.endFill();

    const circle = new Graphics();
    circle.beginFill(0xff3333, 0.5);
    circle.drawCircle(220, 220, 70);
    circle.endFill();

    this.currentContainer?.addChild(rect);
    this.currentContainer?.addChild(circle);
  }

  public findHitTarget(
    node: DisplayObject,
    x: number,
    y: number,
  ): DisplayObject | null {
    if (!node.visible || node.alpha <= 0) {
      return null;
    }

    const localMatrix = node.transform.localTransform;
    const invertedMatrix = localMatrix.clone().invert();
    const localPoint = invertedMatrix.apply({ x, y });

    if (node instanceof Container && node.children.length > 0) {
      for (let i = node.children.length - 1; i >= 0; i--) {
        const hit = this.findHitTarget(
          node.children[i],
          localPoint.x,
          localPoint.y,
        );
        if (hit) {
          return hit;
        }
      }
    }

    if (node instanceof Graphics) {
      const bounds = node.getLocalBounds();
      if (
        localPoint.x >= bounds.x &&
        localPoint.x <= bounds.x + bounds.width &&
        localPoint.y >= bounds.y &&
        localPoint.y <= bounds.y + bounds.height
      ) {
        return node;
      }
    }

    return null;
  }

  public dispatchSkiaEvent(
    coords: { x: number; y: number },
    pixiEventType: 'pointerdown' | 'pointerup',
  ): void {
    if (!this.app || !this.currentContainer) {
      return;
    }

    const hitTarget = this.findHitTarget(
      this.currentContainer,
      coords.x,
      coords.y,
    );

    if (pixiEventType === 'pointerdown') {
      if (hitTarget) {
        this.clickedTarget = hitTarget;

        const federatedEvent = new FederatedPointerEvent(
          this.app.renderer.events.rootBoundary,
        );
        federatedEvent.type = 'pointerdown';
        federatedEvent.target = hitTarget;

        hitTarget.dispatchEvent(federatedEvent);
      }
    } else if (pixiEventType === 'pointerup') {
      if (this.clickedTarget) {
        const federatedEvent = new FederatedPointerEvent(
          this.app.renderer.events.rootBoundary,
        );
        federatedEvent.type = 'pointerup';
        federatedEvent.target = this.clickedTarget;

        this.clickedTarget.dispatchEvent(federatedEvent);
        this.clickedTarget = null;
      }
    }
  }

  public getApp(): Application {
    if (!this.app) {
      throw new Error('PixiService не инициализирован');
    }
    return this.app;
  }
}
