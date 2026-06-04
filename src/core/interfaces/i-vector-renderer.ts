export interface IVectorRenderer {
  initialize(canvasContainerId: string): Promise<void>;
  render(rootContainer: unknown): void;
  clear(): void;
}
