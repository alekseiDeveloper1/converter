import './style.css';
import { PixiService } from './infrastructure/pixi/pixi-service';
import { SkiaRenderer } from './infrastructure/skia/skia-renderer';
import { GenerateShapeUseCase } from './core/use-cases/generate-shape.use-case';

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

      this.pixiService = new PixiService();
      this.pixiService.initialize('pixi-viewport');

      this.skiaRenderer = new SkiaRenderer(this.canvasKit);
      await this.skiaRenderer.initialize('skia-viewport');

      this.generateShapeUseCase = new GenerateShapeUseCase();

      this.syncScreens();

      this.setupUIEvents();

      console.warn('[App] Модульная архитектура запущена!');
    } catch (err) {
      console.error('[App] Ошибка инициализации слоев:', err);
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

      this.syncScreens();
    });

    document.getElementById('btn-export')?.addEventListener('click', () => {
      this.handlePdfExport();
    });
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
