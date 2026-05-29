import './style.css';

class Application {
  private canvasKit: any = null;
  private skiaSurface: any = null;

  constructor() {
    if (document.readyState === 'loading') {
      window.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  private async init(): Promise<void> {
    try {
      console.log('[App] Запуск инициализации...');

      await this.initSkia();

      this.drawTestScreen();

      this.setupUIEvents();

      console.log('[App] Приложение готово к работе!');
    } catch (error) {
      console.error('[App] Ошибка при старте:', error);
    }
  }

  private async initSkia(): Promise<void> {
    if (!CanvasKitInit) {
      throw new Error('Глобальная функция CanvasKitInit не найдена.');
    }

    this.canvasKit = await CanvasKitInit({
      locateFile: (file: string) => `/${file}`,
    });

    if (!this.canvasKit) {
      throw new Error('Не удалось инициализировать объект CanvasKit.');
    }

    const viewport = document.getElementById('skia-viewport');
    if (!viewport) throw new Error('Не найден контейнер #skia-viewport');

    const canvasElement = document.createElement('canvas');
    canvasElement.width = 500;
    canvasElement.height = 500;
    viewport.appendChild(canvasElement);

    this.skiaSurface = this.canvasKit.MakeWebGLCanvasSurface(canvasElement);
    if (!this.skiaSurface) {
      throw new Error('Не удалось создать WebGL-поверхность Skia.');
    }
  }

  private drawTestScreen(): void {
    const canvas = this.skiaSurface.getCanvas();
    canvas.clear(this.canvasKit.Color(240, 240, 240, 1.0));

    const paint = new this.canvasKit.Paint();
    paint.setColor(this.canvasKit.Color(0, 102, 204, 1.0));
    paint.setStyle(this.canvasKit.PaintStyle.Fill);
    paint.setAntiAlias(true);

    canvas.drawRect(this.canvasKit.LTRBRect(150, 150, 350, 350), paint);

    this.skiaSurface.flush();
    paint.delete();
  }

  private setupUIEvents(): void {
    const exportBtn = document.getElementById('btn-export');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.handlePdfExport());
    }

    document.getElementById('btn-generate')?.addEventListener('click', () => {
      console.log('Кнопка генерации фигуры сработает после интеграции Pixi.js');
    });
    document.getElementById('btn-switch')?.addEventListener('click', () => {
      console.log('Кнопка переключения сцен сработает после интеграции Pixi.js');
    });
  }

  private handlePdfExport(): void {
    console.log('[Export] Начинаем экспорт...');

    if (!this.canvasKit.GeneratePDFBase64) {
      alert('Ошибка: Метод GeneratePDFBase64 не найден.');
      return;
    }

    try {
      const base64Str = this.canvasKit.GeneratePDFBase64(500, 500, (pdfCanvas: any) => {
        pdfCanvas.clear(this.canvasKit.Color(240, 240, 240, 1.0));

        const paint = new this.canvasKit.Paint();
        paint.setColor(this.canvasKit.Color(0, 102, 204, 1.0));
        paint.setStyle(this.canvasKit.PaintStyle.Fill);
        paint.setAntiAlias(true);

        pdfCanvas.drawRect(this.canvasKit.LTRBRect(150, 150, 350, 350), paint);

        paint.delete();
      });

      if (!base64Str || base64Str.startsWith("ERROR_")) {
        alert(`Ошибка нативной сборки Skia: ${base64Str}`);
        return;
      }

      const binaryString = window.atob(base64Str);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'scene.pdf';
      link.click();

      URL.revokeObjectURL(url);
      console.log('[Export] Настоящий векторный PDF успешно скачан!');
    } catch (err) {
      console.error('[Export] Критическая ошибка:', err);
    }
  }
}

new Application();
