import './style.css';
import { PixiService } from './infrastructure/pixi/pixi-service';
import { SkiaRenderer } from './infrastructure/skia/skia-renderer';
import { GenerateShapeUseCase } from './core/use-cases/generate-shape.use-case';
import {
  Container,
  type DisplayObject,
  FederatedPointerEvent,
  Graphics,
} from 'pixi.js-legacy';

class Application {
  private canvasKit: CanvasKit | null = null;
  private pixiService!: PixiService;
  private skiaRenderer!: SkiaRenderer;
  private generateShapeUseCase!: GenerateShapeUseCase;

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    try {
      this.canvasKit = await CanvasKitInit({
        locateFile: (file: string) => `/${file}`,
      });

      if (!this.canvasKit) {
        throw new Error('Не удалось загрузить бинарный файл CanvasKit WASM.');
      }

      this.pixiService = new PixiService();
      await this.pixiService.initialize('pixi-viewport');

      this.skiaRenderer = new SkiaRenderer(this.canvasKit);
      await this.skiaRenderer.initialize('skia-viewport');

      this.generateShapeUseCase = new GenerateShapeUseCase();

      const root = this.pixiService.getRootContainer();
      const activateInteractivity = (node: DisplayObject): void => {
        this.makeObjectInteractive(node);
        if (node instanceof Container && node.children.length > 0) {
          node.children.forEach(activateInteractivity);
        }
      };
      root.children.forEach(activateInteractivity);

      this.syncScreens();

      this.setupUIEvents();
      this.setupSkiaEventBridge();
    } catch (error) {
      console.error('[App] Ошибка при старте:', error);
    }
  }

  private syncScreens(): void {
    const pixiRoot = this.pixiService.getRootContainer();
    this.skiaRenderer.render(pixiRoot);
  }

  private setupUIEvents(): void {
    document.getElementById('btn-generate')?.addEventListener('click', () => {
      const pixiRoot = this.pixiService.getRootContainer();

      this.generateShapeUseCase.execute(pixiRoot);

      const lastAddedChild = pixiRoot.children[pixiRoot.children.length - 1];

      this.makeObjectInteractive(lastAddedChild);
      this.syncScreens();
    });

    document.getElementById('btn-export')?.addEventListener('click', () => {
      this.handlePdfExport();
    });
  }

  public makeObjectInteractive(node: DisplayObject): void {
    node.eventMode = 'static';
    node.cursor = 'pointer';

    node.on('pointerdown', (event) => {
      node.alpha = 0.5;

      if (event && typeof event.stopPropagation === 'function') {
        event.stopPropagation();
      }

      this.syncScreens();
    });

    node.on('pointerup', () => {
      node.alpha = 1.0;
      this.syncScreens();
    });

    node.on('pointerupoutside', () => {
      node.alpha = 1.0;
      this.syncScreens();
    });
  }

  private setupSkiaEventBridge(): void {
    const skiaCanvas = document.querySelector(
      '#skia-viewport canvas',
    ) as HTMLCanvasElement | null;
    if (!skiaCanvas || !this.pixiService) {
      console.error('[Debug-Bridge] Ошибка: Холст Skia не найден в DOM.');
      return;
    }

    const pixiApp = this.pixiService.getApp();
    if (!pixiApp) {
      return;
    }

    let clickedTarget: DisplayObject | null = null;

    const getCanvasCoordinates = (
      domEvent: MouseEvent,
    ): { x: number; y: number } => {
      const rect = skiaCanvas.getBoundingClientRect();

      const clientXOnCanvas = domEvent.clientX - rect.left;
      const clientYOnCanvas = domEvent.clientY - rect.top;

      const scaleX = skiaCanvas.width / rect.width;
      const scaleY = skiaCanvas.height / rect.height;

      return {
        x: clientXOnCanvas * scaleX,
        y: clientYOnCanvas * scaleY,
      };
    };

    const findHitTarget = (
      node: DisplayObject,
      x: number,
      y: number,
    ): DisplayObject | null => {
      if (!node.visible || node.alpha <= 0) {
        return null;
      }

      const localMatrix = node.transform.localTransform;
      const invertedMatrix = localMatrix.clone().invert();
      const localPoint = invertedMatrix.apply({ x, y });

      if (node instanceof Container && node.children.length > 0) {
        for (let i = node.children.length - 1; i >= 0; i--) {
          const hit = findHitTarget(
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
    };

    skiaCanvas.addEventListener('mousemove', (domEvent: MouseEvent) => {
      try {
        const coords = getCanvasCoordinates(domEvent);

        const rootContainer = this.pixiService.getRootContainer();
        const hitTarget = findHitTarget(rootContainer, coords.x, coords.y);

        if (hitTarget) {
          skiaCanvas.style.cursor = 'pointer';
        } else {
          skiaCanvas.style.cursor = 'default';
        }
      } catch (err) {
        console.error('[Debug-Bridge] Ошибка при обработке курсора:', err);
      }
    });

    const dispatchToPixi = (
      domEvent: MouseEvent,
      pixiEventType: 'pointerdown' | 'pointerup',
    ): void => {
      try {
        const coords = getCanvasCoordinates(domEvent);

        const rootContainer = this.pixiService.getRootContainer();
        const hitTarget = findHitTarget(rootContainer, coords.x, coords.y);

        if (pixiEventType === 'pointerdown') {
          if (hitTarget) {
            clickedTarget = hitTarget;
            const federatedEvent = new FederatedPointerEvent(
              pixiApp.renderer.events.rootBoundary,
            );
            federatedEvent.type = 'pointerdown';
            federatedEvent.target = hitTarget;

            hitTarget.dispatchEvent(federatedEvent);
          }
        } else if (pixiEventType === 'pointerup') {
          if (clickedTarget) {
            const federatedEvent = new FederatedPointerEvent(
              pixiApp.renderer.events.rootBoundary,
            );
            federatedEvent.type = 'pointerup';
            federatedEvent.target = clickedTarget;

            clickedTarget.dispatchEvent(federatedEvent);

            clickedTarget = null;
          }
        }
      } catch (catchError) {
        console.error(
          '[Debug-Bridge] Ошибка внутри обработчика клика:',
          catchError,
        );
      }
    };

    skiaCanvas.addEventListener('mousedown', (e) =>
      dispatchToPixi(e, 'pointerdown'),
    );
    skiaCanvas.addEventListener('mouseup', (e) =>
      dispatchToPixi(e, 'pointerup'),
    );
  }

  private handlePdfExport(): void {
    console.warn('[Export] Нативный векторный экспорт сцены...');
    const pixiRoot = this.pixiService.getRootContainer();

    const base64Str = this.canvasKit?.GeneratePDFBase64?.(
      500,
      500,
      (pdfCanvas: Canvas) => {
        this.skiaRenderer['renderNode'](pdfCanvas, pixiRoot);
      },
    );

    if (!base64Str) {
      console.warn(
        '[Export] CanvasKit или метод GeneratePDFBase64 недоступен.',
      );
      return;
    }

    this.downloadBase64File(base64Str, 'vector_scene.pdf', 'application/pdf');
  }

  private downloadBase64File(
    base64Str: string,
    fileName: string,
    mimeType: string,
  ): void {
    const binaryString = window.atob(base64Str);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);

    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const blob = new Blob([bytes], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = fileName;
    link.click();

    URL.revokeObjectURL(url);
  }
}

new Application();
