import type { Canvas as CKCanvas, CanvasKit as CKCanvasKit, Surface as CKSurface, Paint as SKPaint, Path as SKPath } from 'canvaskit-wasm';
declare global {
  type Canvas = CKCanvas;
  type CanvasKit = CKCanvasKit;
  type Surface = CKSurface;
  type Paint = SKPaint;
  type Path = SKPath;

  interface CanvasKit extends CKCanvasKit {
    GeneratePDFBase64?(
      width: number,
      height: number,
      callback: (pdfCanvas: Canvas) => void
    ): string;
  }

  const CanvasKitInit: typeof import('canvaskit-wasm');
}

export {};