import { EXIT_MS } from "./constants";
import { ToastItem } from "./types";

class ToastService extends EventTarget {
  static MAX = 5;

  items: ToastItem[] = [];

  // Both timer maps live here — survive component reconnects.
  private _timers = new Map<string, ReturnType<typeof setTimeout>>();
  private _exitTimers = new Map<string, ReturnType<typeof setTimeout>>();

  show(opts: Omit<ToastItem, "id" | "startedAt" | "exiting">): string {
    const id = crypto.randomUUID();
    const item: ToastItem = { ...opts, id, startedAt: Date.now() };

    const next = [...this.items, item];
    this.items = next.length > ToastService.MAX ? next.slice(-ToastService.MAX) : next;
    this._notify();

    if (opts.duration > 0) {
      this._timers.set(
        id,
        setTimeout(() => this.startExit(id), opts.duration),
      );
    }

    return id;
  }

  /** Trigger exit animation, then remove after EXIT_MS. */
  startExit(id: string): void {
    if (this._exitTimers.has(id)) return; // already exiting

    clearTimeout(this._timers.get(id));
    this._timers.delete(id);

    this.items = this.items.map((t) => (t.id === id ? { ...t, exiting: true } : t));
    this._notify();

    this._exitTimers.set(
      id,
      setTimeout(() => {
        this.items = this.items.filter((t) => t.id !== id);
        this._exitTimers.delete(id);
        this._notify();
      }, EXIT_MS),
    );
  }

  /** Remove immediately without animation (e.g. programmatic dismiss). */
  dismiss(id: string): void {
    clearTimeout(this._timers.get(id));
    clearTimeout(this._exitTimers.get(id));
    this._timers.delete(id);
    this._exitTimers.delete(id);
    this.items = this.items.filter((t) => t.id !== id);
    this._notify();
  }

  success(message: string, description?: string): string {
    return this.show({ type: "success", message, description, duration: 3000 });
  }

  error(message: string, description?: string): string {
    return this.show({ type: "error", message, description, duration: 5000 });
  }

  warning(message: string, description?: string): string {
    return this.show({ type: "warning", message, description, duration: 4000 });
  }

  info(message: string, description?: string): string {
    return this.show({ type: "info", message, description, duration: 3000 });
  }

  private _notify() {
    this.dispatchEvent(new CustomEvent("toast:change"));
  }
}

export const toast = new ToastService();
