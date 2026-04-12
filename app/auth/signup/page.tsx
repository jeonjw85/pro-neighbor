"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/components/toast";
import type { UserRole } from "@/types/database";

export default function SignupPage() {
    const router = useRouter();
    const supabase = createClient();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [role, setRole] = useState<UserRole>("NEIGHBOR");
    const [loading, setLoading] = useState(false);

    async function handleSignup(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: fullName, role },
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) {
            toast(error.message, "error");
            setLoading(false);
            return;
        }

        if (data.user) {
            await supabase.from("profiles").upsert({
                id: data.user.id,
                full_name: fullName,
                role,
            });
        }

        toast("가입 완료!", "success");
        router.push("/dashboard");
        router.refresh();
    }

    return (
        <main className="min-h-screen flex items-center justify-center px-4">
            <div className="max-w-sm w-full space-y-6">
                <div className="text-center">
                    <h1 className="text-2xl font-bold">회원가입</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        프로이웃과 함께 시작해요
                    </p>
                </div>

                <form onSubmit={handleSignup} className="space-y-3">
                    <input
                        type="text"
                        placeholder="이름"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
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
                        placeholder="비밀번호 (6자 이상)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => setRole("NEIGHBOR")}
                            className={`py-3 rounded-xl text-sm font-medium border transition-colors ${
                                role === "NEIGHBOR"
                                    ? "bg-blue-500 text-white border-blue-500"
                                    : "bg-white text-gray-600 border-gray-200"
                            }`}
                        >
                            이웃
                        </button>
                        <button
                            type="button"
                            onClick={() => setRole("PRO")}
                            className={`py-3 rounded-xl text-sm font-medium border transition-colors ${
                                role === "PRO"
                                    ? "bg-blue-500 text-white border-blue-500"
                                    : "bg-white text-gray-600 border-gray-200"
                            }`}
                        >
                            프로
                        </button>
                    </div>
                    <p className="text-xs text-gray-400 text-center">
                        {role === "NEIGHBOR"
                            ? "도움이 필요할 때 요청을 올려요"
                            : "동네 이웃의 요청을 받아 도와줘요"}
                    </p>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-500 text-white py-3 rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
                    >
                        {loading ? "가입 중..." : "가입하기"}
                    </button>
                </form>

                <p className="text-center text-xs text-gray-400">
                    이미 계정이 있나요?{" "}
                    <Link
                        href="/auth/login"
                        className="text-blue-500 font-medium"
                    >
                        로그인
                    </Link>
                </p>
            </div>
        </main>
    );
}
