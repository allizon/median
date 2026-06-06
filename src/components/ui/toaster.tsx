"use client";

import { Toast } from "@base-ui/react/toast";
import { toastManager } from "@/lib/toast";

export { toastManager };

export function Toaster() {
  return (
    <Toast.Provider toastManager={toastManager}>
      <ToastViewport />
    </Toast.Provider>
  );
}

function ToastViewport() {
  const { toasts } = Toast.useToastManager();

  return (
    <Toast.Viewport
      className="fixed top-4 right-4 z-[200] flex flex-col gap-2 w-80 outline-none"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <Toast.Root
          key={toast.id}
          toast={toast}
          className="flex items-start justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-lg text-sm
            data-[starting-style]:opacity-0 data-[starting-style]:translate-x-4
            data-[ending-style]:opacity-0 data-[ending-style]:translate-x-4
            transition-all duration-200"
        >
          <Toast.Content className="flex-1 min-w-0">
            {toast.title && (
              <Toast.Title className="font-medium">{toast.title}</Toast.Title>
            )}
            {toast.description && (
              <Toast.Description className="text-muted-foreground mt-0.5">
                {toast.description}
              </Toast.Description>
            )}
          </Toast.Content>
          <div className="flex items-center gap-1 shrink-0">
            {toast.actionProps && (
              <button
                type="button"
                {...toast.actionProps}
                className="rounded px-2 py-1 text-xs font-medium text-primary hover:bg-muted transition-colors"
              />
            )}
            <Toast.Close
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Dismiss"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </Toast.Close>
          </div>
        </Toast.Root>
      ))}
    </Toast.Viewport>
  );
}
