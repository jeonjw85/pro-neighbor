"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, MessageCircle, User } from "lucide-react";

const navItems = [
    { href: "/dashboard", icon: Home, label: "홈" },
    { href: "/requests", icon: Search, label: "요청" },
    { href: "/chat", icon: MessageCircle, label: "채팅" },
    { href: "/profile", icon: User, label: "내 정보" },
];

export default function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
            <div className="max-w-lg mx-auto flex justify-around items-center h-14">
                {navItems.map((item) => {
                    const active = pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center gap-0.5 text-xs ${
                                active
                                    ? "text-blue-500"
                                    : "text-gray-400 hover:text-gray-600"
                            }`}
                        >
                            <item.icon className="w-5 h-5" />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
