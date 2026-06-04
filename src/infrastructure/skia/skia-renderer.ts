import type { IVectorRenderer } from '@/core/interfaces/i-vector-renderer';
import * as PIXI from 'pixi.js-legacy';

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

type RenderHandler = (skCanvas: Canvas, node: any) => void;

interface IRenderMapping {
  klass: new (...args: any[]) => PIXI.DisplayObject;
  handler: RenderHandler;
}

interface IShapeStrategy {
  canDraw(shape: unknown): boolean;
  draw(skCanvas: Canvas, shape: unknown, paint: Paint, canvasKit: CanvasKit): void;
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
        klass: PIXI.Graphics,
        handler: (skCanvas, node) => this.drawPixiGraphics(skCanvas, node)
      },
      {
        klass: PIXI.Container,
        handler: (skCanvas, node) => this.renderChildren(skCanvas, node)
      }
    ];

    this.shapeStrategies = [
      {
        canDraw: (shape) => shape instanceof PIXI.Rectangle,
        draw: (skCanvas, shape: PIXI.Rectangle, paint, ck) => {
          skCanvas.drawRect(ck.LTRBRect(shape.x, shape.y, shape.x + shape.width, shape.y + shape.height), paint);
        }
      },
      {
        canDraw: (shape) => shape instanceof PIXI.Circle,
        draw: (skCanvas, shape: PIXI.Circle, paint) => {
          skCanvas.drawCircle(shape.x, shape.y, shape.radius, paint);
        }
      },
      {
        canDraw: (shape) => typeof shape === 'object' && shape !== null && 'points' in shape,
        draw: (skCanvas, shape: { points: number[]; closeStroke?: boolean }, paint) => {
          this.drawComplexPath(skCanvas, shape.points, shape.closeStroke, paint);
        }
      }
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
    if (!this.skiaSurface) return;

    const canvas = this.skiaSurface.getCanvas();
    canvas.clear(this.DEFAULT_BACKGROUND_COLOR);
    this.skiaSurface.flush();
  }

  public render(rootContainer: unknown): void {
    if (!this.skiaSurface) return;

    const canvas = this.skiaSurface.getCanvas();
    canvas.clear(this.DEFAULT_BACKGROUND_COLOR);

    const pixiContainer = rootContainer as PIXI.Container;
    if (typeof pixiContainer.updateTransform === 'function') {
      pixiContainer.updateTransform();
    }

    this.renderNode(canvas, pixiContainer);
    this.skiaSurface.flush();
  }

  private renderNode(skCanvas: Canvas, node: PIXI.DisplayObject): void {
    if (!node.visible || node.alpha <= 0) return;

    skCanvas.save();
    skCanvas.concat(this.extractSkMatrix(node.transform.localTransform));

    const mapping = this.renderMappings.find(m => node instanceof m.klass);

    if (mapping) {
      mapping.handler(skCanvas, node);
    }

    skCanvas.restore();
  }

  private renderChildren(skCanvas: Canvas, container: PIXI.Container): void {
    if (container.children && container.children.length > 0) {
      for (const child of container.children) {
        this.renderNode(skCanvas, child);
      }
    }
  }

  private drawPixiGraphics(skCanvas: Canvas, pixiGraphics: PIXI.Graphics): void {
    const geometry = pixiGraphics.geometry;
    if (!geometry || !geometry.graphicsData) return;

    const graphicsDataList = geometry.graphicsData as IPixiGraphicsData[];
    for (const graphicsData of graphicsDataList) {
      this.renderFill(skCanvas, pixiGraphics, graphicsData);
      this.renderStroke(skCanvas, pixiGraphics, graphicsData);
    }

    this.renderChildren(skCanvas, pixiGraphics);
  }

  private renderFill(skCanvas: Canvas, graphics: PIXI.Graphics, data: IPixiGraphicsData): void {
    if (!data.fillStyle || !data.fillStyle.visible) return;

    const paint = new this.canvasKit.Paint();
    paint.setAntiAlias(true);
    paint.setStyle(this.canvasKit.PaintStyle.Fill);
    paint.setColor(this.hexToSkColor(data.fillStyle.color, data.fillStyle.alpha * graphics.alpha));

    this.drawShape(skCanvas, data.shape, paint);
    paint.delete();
  }

  private renderStroke(skCanvas: Canvas, graphics: PIXI.Graphics, data: IPixiGraphicsData): void {
    if (!data.lineStyle || !data.lineStyle.visible || data.lineStyle.width <= 0) return;

    const paint = new this.canvasKit.Paint();
    paint.setAntiAlias(true);
    paint.setStyle(this.canvasKit.PaintStyle.Stroke);
    paint.setStrokeWidth(data.lineStyle.width);
    paint.setColor(this.hexToSkColor(data.lineStyle.color, data.lineStyle.alpha * graphics.alpha));
    paint.setStrokeCap(this.canvasKit.StrokeCap.Round);
    paint.setStrokeJoin(this.canvasKit.StrokeJoin.Round);

    this.drawShape(skCanvas, data.shape, paint);
    paint.delete();
  }

  private drawShape(skCanvas: Canvas, shape: unknown, paint: Paint): void {
    const strategy = this.shapeStrategies.find(s => s.canDraw(shape));

    if (strategy) {
      strategy.draw(skCanvas, shape, paint, this.canvasKit);
    }
  }

  private drawComplexPath(skCanvas: Canvas, points: number[], closeStroke: boolean | undefined, paint: Paint): void {
    if (!points || points.length < 4) return;

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
      console.error('[SkiaRenderer] Нативная ошибка заполнения Path:', pathError);
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

  private extractSkMatrix(transform: PIXI.Matrix): number[] {
    return [
      transform.a, transform.c, transform.tx,
      transform.b, transform.d, transform.ty,
      0,           0,           1
    ];
  }

  private hexToSkColor(hexColor: number, alpha: number): Float32Array {
    const r = ((hexColor >> 16) & 0xFF) / 255;
    const g = ((hexColor >> 8) & 0xFF) / 255;
    const b = (hexColor & 0xFF) / 255;
    return this.canvasKit.Color4f(r, g, b, alpha);
  }
}
