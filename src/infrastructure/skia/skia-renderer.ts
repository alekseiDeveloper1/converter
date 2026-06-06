import type { IVectorRenderer } from '@/core/interfaces/i-vector-renderer';
import {
  Circle,
  Container,
  type DisplayObject,
  Graphics,
  type Matrix,
  Rectangle,
} from 'pixi.js-legacy';

interface IPixiFillStyle {
  visible: boolean;
  color: number;
  alpha: number;
}

interface IPixiLineStyle {
  visible: boolean;
  width: number;
  color: number;
  alpha: number;
}

interface IPixiGraphicsData {
  shape: unknown;
  fillStyle: IPixiFillStyle;
  lineStyle: IPixiLineStyle;
}

type RenderHandler = (
  skCanvas: Canvas,
  node: DisplayObject,
  accumulatedAlpha: number,
) => void;

interface IRenderMapping {
  klass: new (
    ...args: ConstructorParameters<typeof DisplayObject>
  ) => DisplayObject;
  handler: RenderHandler;
}

interface IShapeStrategy {
  canDraw(shape: unknown): boolean;
  draw(
    skCanvas: Canvas,
    shape: unknown,
    paint: Paint,
    canvasKit: CanvasKit,
  ): void;
}

export class SkiaRenderer implements IVectorRenderer {
  private readonly DEFAULT_BACKGROUND_COLOR: Float32Array;
  private readonly CANVAS_SIZE = 500;
  private skiaSurface: Surface | null = null;
  private readonly canvasKit: CanvasKit;
  private readonly renderMappings: IRenderMapping[];
  private readonly shapeStrategies: IShapeStrategy[];

  constructor(canvasKit: CanvasKit) {
    this.canvasKit = canvasKit;
    this.DEFAULT_BACKGROUND_COLOR = this.canvasKit.Color(240, 240, 240, 1.0);

    this.renderMappings = [
      {
        klass: Graphics,
        handler: (skCanvas, node, accumulatedAlpha): void =>
          this.drawPixiGraphics(skCanvas, node as Graphics, accumulatedAlpha),
      },
      {
        klass: Container,
        handler: (skCanvas, node, accumulatedAlpha): void =>
          this.renderChildren(skCanvas, node as Container, accumulatedAlpha),
      },
    ];

    this.shapeStrategies = [
      {
        canDraw: (shape): boolean => shape instanceof Rectangle,
        draw: (skCanvas, shape: Rectangle, paint, ck): void => {
          skCanvas.drawRect(
            ck.LTRBRect(
              shape.x,
              shape.y,
              shape.x + shape.width,
              shape.y + shape.height,
            ),
            paint,
          );
        },
      },
      {
        canDraw: (shape): boolean => shape instanceof Circle,
        draw: (skCanvas, shape: Circle, paint): void => {
          skCanvas.drawCircle(shape.x, shape.y, shape.radius, paint);
        },
      },
      {
        canDraw: (shape): boolean =>
          typeof shape === 'object' && shape !== null && 'points' in shape,
        draw: (
          skCanvas,
          shape: { points: number[]; closeStroke?: boolean },
          paint,
        ): void => {
          this.drawComplexPath(
            skCanvas,
            shape.points,
            shape.closeStroke,
            paint,
          );
        },
      },
    ];
  }

  public async initialize(canvasContainerId: string): Promise<void> {
    const viewport = document.getElementById(canvasContainerId);
    if (!viewport) {
      throw new Error(`Не найден контейнер #${canvasContainerId}`);
    }

    const canvasElement = this.createCanvasElement();
    viewport.appendChild(canvasElement);

    this.skiaSurface = this.canvasKit.MakeWebGLCanvasSurface(canvasElement);
    if (!this.skiaSurface) {
      throw new Error('Не удалось создать WebGL-поверхность Skia.');
    }
  }

  public clear(): void {
    if (!this.skiaSurface) {
      return;
    }

    const canvas = this.skiaSurface.getCanvas();
    canvas.clear(this.DEFAULT_BACKGROUND_COLOR);
    this.skiaSurface.flush();
  }

  public render(rootContainer: unknown): void {
    if (!this.skiaSurface) {
      return;
    }

    const canvas = this.skiaSurface.getCanvas();
    canvas.clear(this.DEFAULT_BACKGROUND_COLOR);

    const pixiContainer = rootContainer as Container;
    if (typeof pixiContainer.updateTransform === 'function') {
      pixiContainer.updateTransform();
    }

    this.renderNode(canvas, pixiContainer, 1.0);
    this.skiaSurface.flush();
  }

  private renderNode(
    skCanvas: Canvas,
    node: DisplayObject,
    accumulatedAlpha = 1.0,
  ): void {
    if (!node.visible || node.alpha <= 0) {
      return;
    }

    skCanvas.save();
    skCanvas.concat(this.extractSkMatrix(node.transform.localTransform));

    const currentAlpha = accumulatedAlpha * node.alpha;

    const mapping = this.renderMappings.find((m) => node instanceof m.klass);

    if (mapping) {
      mapping.handler(skCanvas, node, currentAlpha);
    }

    skCanvas.restore();
  }

  private renderChildren(
    skCanvas: Canvas,
    container: Container,
    accumulatedAlpha: number,
  ): void {
    if (container.children && container.children.length > 0) {
      for (const child of container.children) {
        this.renderNode(skCanvas, child, accumulatedAlpha);
      }
    }
  }

  private drawPixiGraphics(
    skCanvas: Canvas,
    pixiGraphics: Graphics,
    accumulatedAlpha: number,
  ): void {
    const geometry = pixiGraphics.geometry;
    if (!geometry || !geometry.graphicsData) {
      return;
    }

    const graphicsDataList = geometry.graphicsData as IPixiGraphicsData[];
    for (const graphicsData of graphicsDataList) {
      this.renderFill(skCanvas, graphicsData, accumulatedAlpha);
      this.renderStroke(skCanvas, graphicsData, accumulatedAlpha);
    }

    this.renderChildren(skCanvas, pixiGraphics, accumulatedAlpha);
  }

  private renderFill(
    skCanvas: Canvas,
    data: IPixiGraphicsData,
    accumulatedAlpha: number,
  ): void {
    if (!data.fillStyle || !data.fillStyle.visible) {
      return;
    }

    const paint = new this.canvasKit.Paint();
    paint.setAntiAlias(true);
    paint.setStyle(this.canvasKit.PaintStyle.Fill);
    paint.setColor(
      this.hexToSkColor(
        data.fillStyle.color,
        data.fillStyle.alpha * accumulatedAlpha,
      ),
    );

    this.drawShape(skCanvas, data.shape, paint);
    paint.delete();
  }

  private renderStroke(
    skCanvas: Canvas,
    data: IPixiGraphicsData,
    accumulatedAlpha: number,
  ): void {
    if (
      !data.lineStyle ||
      !data.lineStyle.visible ||
      data.lineStyle.width <= 0
    ) {
      return;
    }

    const paint = new this.canvasKit.Paint();
    paint.setAntiAlias(true);
    paint.setStyle(this.canvasKit.PaintStyle.Stroke);
    paint.setStrokeWidth(data.lineStyle.width);
    paint.setColor(
      this.hexToSkColor(
        data.lineStyle.color,
        data.lineStyle.alpha * accumulatedAlpha,
      ),
    );
    paint.setStrokeCap(this.canvasKit.StrokeCap.Round);
    paint.setStrokeJoin(this.canvasKit.StrokeJoin.Round);

    this.drawShape(skCanvas, data.shape, paint);
    paint.delete();
  }

  private drawShape(skCanvas: Canvas, shape: unknown, paint: Paint): void {
    const strategy = this.shapeStrategies.find((s) => s.canDraw(shape));

    if (strategy) {
      strategy.draw(skCanvas, shape, paint, this.canvasKit);
    }
  }

  private drawComplexPath(
    skCanvas: Canvas,
    points: number[],
    closeStroke: boolean | undefined,
    paint: Paint,
  ): void {
    if (!points || points.length < 4) {
      return;
    }

    const path = new this.canvasKit.Path();

    try {
      path.moveTo(points[0], points[1]);

      for (let i = 2; i < points.length; i += 2) {
        path.lineTo(points[i], points[i + 1]);
      }

      if (closeStroke) {
        path.close();
      }

      skCanvas.drawPath(path, paint);
    } catch (pathError) {
      console.error(
        '[SkiaRenderer] Нативная ошибка заполнения Path:',
        pathError,
      );
    } finally {
      path.delete();
    }
  }

  private createCanvasElement(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = this.CANVAS_SIZE;
    canvas.height = this.CANVAS_SIZE;
    return canvas;
  }

  private extractSkMatrix(transform: Matrix): number[] {
    return [
      transform.a,
      transform.c,
      transform.tx,
      transform.b,
      transform.d,
      transform.ty,
      0,
      0,
      1,
    ];
  }

  private hexToSkColor(hexColor: number, alpha: number): Float32Array {
    const r = ((hexColor >> 16) & 0xff) / 255;
    const g = ((hexColor >> 8) & 0xff) / 255;
    const b = (hexColor & 0xff) / 255;
    return this.canvasKit.Color4f(r, g, b, alpha);
  }
}
