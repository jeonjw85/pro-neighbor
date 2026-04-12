"use client";

import { useEffect, useState } from "react";

interface Toast {
    id: number;
    message: string;
    type: "success" | "error" | "info";
}

let addToastFn: ((message: string, type?: Toast["type"]) => void) | null = null;

export function toast(message: string, type: Toast["type"] = "info") {
    addToastFn?.(message, type);
}

export default function ToastProvider() {
    const [toasts, setToasts] = useState<Toast[]>([]);

    useEffect(() => {
        addToastFn = (message, type = "info") => {
            const id = Date.now();
            setToasts((prev) => [...prev, { id, message, type }]);
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
            }, 3000);
        };
        return () => {
            addToastFn = null;
        };
    }, []);

    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 space-y-2">
            {toasts.map((t) => (
                <div
                    key={t.id}
                    className={`px-4 py-2 rounded-lg text-sm font-medium shadow-lg animate-slide-down ${
                        t.type === "success"
                            ? "bg-green-500 text-white"
                            : t.type === "error"
                              ? "bg-red-500 text-white"
                              : "bg-gray-800 text-white"
                    }`}
                >
                    {t.message}
                </div>
            ))}
        </div>
    );
}
