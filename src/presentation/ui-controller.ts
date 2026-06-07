import { GenerateShapeUseCase } from '../core/use-cases/generate-shape.use-case';
import { ControlPanel } from './components/control-panel';
import { CanvasView } from './components/canvas-view';
import type { IVectorRenderer } from '@/core/interfaces/i-vector-renderer.ts';
import type { IPdfExporter } from '@/core/interfaces/i-pdf-exporter.ts';
import type { IPixiService } from '@/core/interfaces/i-pixi-service.ts';
import type { Container } from 'pixi.js-legacy';

export class UIController {
  private readonly pixiService: IPixiService;
  private skiaRenderer: IVectorRenderer & IPdfExporter;
  private generateShapeUseCase: GenerateShapeUseCase;

  constructor(
    pixiService: IPixiService,
    skiaRenderer: IVectorRenderer & IPdfExporter,
    generateShapeUseCase: GenerateShapeUseCase,
  ) {
    this.pixiService = pixiService;
    this.skiaRenderer = skiaRenderer;
    this.generateShapeUseCase = generateShapeUseCase;

    this.initComponents();
  }

  private initComponents(): void {
    new ControlPanel({
      onGenerate: (): void => this.handleGenerate(),
      onExport: (): void => this.handleExport(),
    });

    new CanvasView(this.pixiService, {
      onSkiaMouseDown: (coords): void =>
        this.pixiService.dispatchSkiaEvent(coords, 'pointerdown'),
      onSkiaMouseUp: (coords): void =>
        this.pixiService.dispatchSkiaEvent(coords, 'pointerup'),
    });
  }

  private handleGenerate(): void {
    const pixiRoot = this.pixiService.getRootContainer() as Container;

    this.generateShapeUseCase.execute(pixiRoot);

    const lastAddedChild = pixiRoot.children[pixiRoot.children.length - 1];
    this.pixiService.makeObjectInteractive(lastAddedChild);

    this.syncScreens();
  }

  private handleExport(): void {
    const pixiRoot = this.pixiService.getRootContainer();
    this.skiaRenderer.exportToPdf(pixiRoot);
  }

  public syncScreens(): void {
    const pixiRoot = this.pixiService.getRootContainer();
    this.skiaRenderer.render(pixiRoot);
  }
}
