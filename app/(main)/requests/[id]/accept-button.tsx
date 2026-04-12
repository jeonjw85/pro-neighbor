"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/components/toast";
import { Send } from "lucide-react";

export default function AcceptButton({
    requestId,
    clientId,
}: {
    requestId: string;
    clientId: string;
}) {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [price, setPrice] = useState("");
    const [showForm, setShowForm] = useState(false);

    async function handlePropose() {
        if (!price.trim()) {
            toast("예상 금액을 입력해주세요", "error");
            return;
        }
        setLoading(true);
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data: updated, error: updateError } = await supabase
            .from("requests")
            .update({
                status: "PENDING",
                matched_pro_id: user.id,
                proposed_price: price.trim(),
            })
            .eq("id", requestId)
            .eq("status", "OPEN")
            .select("id")
            .maybeSingle();

        if (updateError || !updated) {
            toast(
                updateError
                    ? "제안에 실패했어요"
                    : "이미 다른 프로가 제안한 요청이에요",
                "error",
            );
            setLoading(false);
            router.refresh();
            return;
        }

        toast("제안을 보냈어요! 이웃의 수락을 기다려주세요", "success");
        router.refresh();
    }

    if (!showForm) {
        return (
            <button
                onClick={() => setShowForm(true)}
                className="w-full bg-blue-500 text-white py-3 rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors"
            >
                이 요청에 제안하기
            </button>
        );
    }

    return (
        <div className="bg-blue-50 rounded-xl p-4 space-y-3">
            <p className="text-sm font-medium text-blue-800">
                예상 금액을 알려주세요
            </p>
            <input
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="예: 30,000원"
                className="w-full border border-blue-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
            />
            <div className="flex gap-2">
                <button
                    onClick={() => setShowForm(false)}
                    disabled={loading}
                    className="flex-1 py-2.5 rounded-lg text-sm text-gray-500 border border-gray-200 bg-white hover:bg-gray-50"
                >
                    취소
                </button>
                <button
                    onClick={handlePropose}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-blue-500 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                    <Send className="w-3.5 h-3.5" />
                    {loading ? "보내는 중..." : "제안 보내기"}
                </button>
            </div>
        </div>
    );
}
