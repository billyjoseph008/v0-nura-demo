// src/hooks/use-toast.ts
export type ToastPayload = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success" | "info";
  durationMs?: number; // default 3000
};

const EVT = "nura:toast:add";

export function useToast() {
  function toast(payload: ToastPayload) {
    const event = new CustomEvent(EVT, { detail: payload });
    window.dispatchEvent(event);
  }
  return { toast };
}

// Exponemos el nombre del evento para que el Toaster pueda escucharlo
export const TOAST_EVENT = EVT;
