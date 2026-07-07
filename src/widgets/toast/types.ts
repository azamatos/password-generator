export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  /** Secondary line — rendered in mono, good for passwords/values. */
  description?: string;
  /** Auto-dismiss after N ms. 0 = persist until manually dismissed. */
  duration: number;
  /** Set to true during exit animation before removal. */
  exiting?: boolean;
  /** Timestamp when the toast was shown — used to resume the progress bar after navigation. */
  startedAt: number;
}
