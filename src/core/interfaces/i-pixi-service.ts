export interface IPixiService {
  initialize(containerId: string, onStateChange: () => void): Promise<void>;
  getRootContainer(): unknown;
  makeObjectInteractive(node: unknown): void;
  dispatchSkiaEvent(
    coords: { x: number; y: number },
    pixiEventType: 'pointerdown' | 'pointerup',
  ): void;
  findHitTarget(node: unknown, x: number, y: number): unknown;
}
