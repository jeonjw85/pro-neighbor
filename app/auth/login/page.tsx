"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/components/toast";

export default function LoginPage() {
    const router = useRouter();
    const supabase = createClient();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            toast(error.message, "error");
            setLoading(false);
            return;
        }

        toast("로그인 성공!", "success");
        router.push("/dashboard");
        router.refresh();
    }

    async function handleKakaoLogin() {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "kakao",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        if (error) toast(error.message, "error");
    }

    return (
        <main className="min-h-screen flex items-center justify-center px-4">
            <div className="max-w-sm w-full space-y-6">
                <div className="text-center">
                    <h1 className="text-2xl font-bold">로그인</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        프로이웃에 다시 오신 걸 환영해요
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-3">
                    <input
                        type="email"
                        placeholder="이메일"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                        type="password"
                        placeholder="비밀번호"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-500 text-white py-3 rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
                    >
                        {loading ? "로그인 중..." : "로그인"}
                    </button>
                </form>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                        <span className="bg-gray-50 px-2 text-gray-400">
                            또는
                        </span>
                    </div>
                </div>

                <button
                    onClick={handleKakaoLogin}
                    className="w-full bg-[#FEE500] text-[#191919] py-3 rounded-xl text-sm font-medium hover:bg-[#FDD835] transition-colors"
                >
                    카카오로 시작하기
                </button>

                <p className="text-center text-xs text-gray-400">
                    아직 계정이 없나요?{" "}
                    <Link
                        href="/auth/signup"
                        className="text-blue-500 font-medium"
                    >
                        회원가입
                    </Link>
                </p>
            </div>
        </main>
    );
}
