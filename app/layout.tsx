import type { Metadata } from "next";
import ToastProvider from "@/components/toast";
import "./globals.css";

export const metadata: Metadata = {
    title: "프로이웃 | 동네 서비스 매칭",
    description: "1인 가구를 위한 초밀착 동네 서비스 매칭 플랫폼",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ko">
            <body
                className="bg-gray-50 text-gray-900 antialiased"
                suppressHydrationWarning
            >
                <ToastProvider />
                {children}
            </body>
        </html>
    );
}
