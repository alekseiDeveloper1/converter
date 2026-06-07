export interface ControlPanelCallbacks {
  onGenerate: () => void;
  onExport: () => void;
}

export class ControlPanel {
  private callbacks: ControlPanelCallbacks;

  constructor(callbacks: ControlPanelCallbacks) {
    this.callbacks = callbacks;

    this.initEvents();
  }

  private initEvents(): void {
    document.getElementById('btn-generate')?.addEventListener('click', () => {
      this.callbacks.onGenerate();
    });

    document.getElementById('btn-export')?.addEventListener('click', () => {
      this.callbacks.onExport();
    });
  }
}
