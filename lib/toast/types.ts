export type ToastKind = "success" | "error" | "warning" | "info";

export type Toast = {
  id: string;
  kind: ToastKind;
  message: string;
};

export type ToastContextValue = {
  toasts: Toast[];
  toast: (kind: ToastKind, message: string) => string;
  success: (message: string) => string;
  error: (message: string) => string;
  warning: (message: string) => string;
  info: (message: string) => string;
  remove: (id: string) => void;
};
