import { PixiService } from '@/infrastructure/pixi/pixi-service';

export interface CanvasViewCallbacks {
  onSkiaMouseDown: (coords: { x: number; y: number }) => void;
  onSkiaMouseUp: (coords: { x: number; y: number }) => void;
}

export class CanvasView {
  private skiaCanvas: HTMLCanvasElement | null = null;

  private pixiService: PixiService;
  private callbacks: CanvasViewCallbacks;

  constructor(pixiService: PixiService, callbacks: CanvasViewCallbacks) {
    this.pixiService = pixiService;
    this.callbacks = callbacks;

    this.setupSkiaEventBridge();
  }

  private setupSkiaEventBridge(): void {
    this.skiaCanvas = document.querySelector(
      '#skia-viewport canvas',
    ) as HTMLCanvasElement | null;

    if (!this.skiaCanvas) {
      console.error('[CanvasView] Ошибка: Холст Skia не найден в DOM.');
      return;
    }

    this.skiaCanvas.addEventListener('mousemove', (domEvent: MouseEvent) => {
      try {
        const coords = this.getCanvasCoordinates(domEvent);
        const rootContainer = this.pixiService.getRootContainer();
        const hitTarget = this.pixiService.findHitTarget(
          rootContainer,
          coords.x,
          coords.y,
        );

        if (this.skiaCanvas) {
          this.skiaCanvas.style.cursor = hitTarget ? 'pointer' : 'default';
        }
      } catch (err) {
        console.error('[CanvasView] Ошибка при обработке курсора:', err);
      }
    });

    this.skiaCanvas.addEventListener('mousedown', (e) => {
      const coords = this.getCanvasCoordinates(e);
      this.callbacks.onSkiaMouseDown(coords);
    });

    this.skiaCanvas.addEventListener('mouseup', (e) => {
      const coords = this.getCanvasCoordinates(e);
      this.callbacks.onSkiaMouseUp(coords);
    });
  }

  private getCanvasCoordinates(domEvent: MouseEvent): { x: number; y: number } {
    if (!this.skiaCanvas) {
      return { x: 0, y: 0 };
    }

    const rect = this.skiaCanvas.getBoundingClientRect();
    const clientXOnCanvas = domEvent.clientX - rect.left;
    const clientYOnCanvas = domEvent.clientY - rect.top;

    const scaleX = this.skiaCanvas.width / rect.width;
    const scaleY = this.skiaCanvas.height / rect.height;

    return {
      x: clientXOnCanvas * scaleX,
      y: clientYOnCanvas * scaleY,
    };
  }
}
