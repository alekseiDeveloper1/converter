import './style.css';
import { PixiService } from './infrastructure/pixi/pixi-service';
import { SkiaRenderer } from './infrastructure/skia/skia-renderer';
import { GenerateShapeUseCase } from './core/use-cases/generate-shape.use-case';
import { UIController } from '@/presentation/ui-controller.ts';

class Application {
  private pixiService!: PixiService;
  private skiaRenderer!: SkiaRenderer;
  private generateShapeUseCase!: GenerateShapeUseCase;

  constructor() {
    this.init().catch((error: unknown) => {
      console.error(
        '[App] Критический сбой при инициализации точки сборки:',
        error,
      );
    });
  }

  private async init(): Promise<void> {
    try {
      this.pixiService = new PixiService();
      await this.pixiService.initialize('pixi-viewport', () =>
        this.syncScreens(),
      );

      this.skiaRenderer = new SkiaRenderer();
      await this.skiaRenderer.initialize('skia-viewport');

      this.generateShapeUseCase = new GenerateShapeUseCase();

      new UIController(
        this.pixiService,
        this.skiaRenderer,
        this.generateShapeUseCase,
      );
      this.syncScreens();
    } catch (error) {
      console.error('[App] Ошибка при старте:', error);
    }
  }

  private syncScreens(): void {
    const pixiRoot = this.pixiService.getRootContainer();
    this.skiaRenderer.render(pixiRoot);
  }
}

new Application();
