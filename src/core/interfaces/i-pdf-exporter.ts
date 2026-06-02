export interface IPdfExporter {
  exportToPdf(rootContainer: unknown, width: number, height: number): Uint8Array;
}
