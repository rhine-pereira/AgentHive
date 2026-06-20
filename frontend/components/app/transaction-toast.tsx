"use client";

import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type TxStatus = "pending" | "confirmed" | "error";

export interface ToastTx {
  id: string;
  hash?: string;
  label: string;
  status: TxStatus;
  error?: string;
}

interface ToastContextValue {
  toasts: ToastTx[];
  addToast: (toast: Omit<ToastTx, "id">) => string;
  updateToast: (id: string, updates: Partial<ToastTx>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function TransactionToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastTx[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<ToastTx, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);

    if (toast.status === "confirmed" || toast.status === "error") {
      setTimeout(() => removeToast(id), 8000);
    }
    return id;
  }, [removeToast]);

  const updateToast = useCallback((id: string, updates: Partial<ToastTx>) => {
    setToasts((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const newToast = { ...t, ...updates };
          if (newToast.status === "confirmed" || newToast.status === "error") {
            setTimeout(() => removeToast(id), 8000);
          }
          return newToast;
        }
        return t;
      })
    );
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, updateToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <TransactionToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useTransactionToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useTransactionToast must be used within TransactionToastProvider");
  return context;
}

function TransactionToastItem({ toast, onDismiss }: { toast: ToastTx; onDismiss: () => void }) {
  const truncateHash = (hash: string) => `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  const explorerUrl = "https://testnet.monadexplorer.com";

  return (
    <div className="flex w-80 items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-xl animate-in slide-in-from-bottom-5">
      <div className="mt-0.5">
        {toast.status === "pending" && <Loader2 className="size-5 animate-spin text-primary" />}
        {toast.status === "confirmed" && <CheckCircle2 className="size-5 text-green-500" />}
        {toast.status === "error" && <AlertCircle className="size-5 text-red-500" />}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">
          {toast.status === "pending" && "Transaction submitted"}
          {toast.status === "confirmed" && "Transaction confirmed"}
          {toast.status === "error" && "Transaction failed"}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{toast.label}</p>
        
        {toast.hash && (
          <a
            href={`${explorerUrl}/tx/${toast.hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center text-xs font-medium text-primary hover:underline"
          >
            {truncateHash(toast.hash)} ↗
          </a>
        )}
        
        {toast.error && (
          <p className="mt-2 text-xs text-red-400 break-words">{toast.error}</p>
        )}
      </div>

      <button onClick={onDismiss} className="text-muted-foreground hover:text-foreground">
        <X className="size-4" />
      </button>
    </div>
  );
}
