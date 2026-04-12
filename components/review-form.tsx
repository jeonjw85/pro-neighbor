"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/components/toast";

export default function ReviewForm({
    requestId,
    revieweeId,
}: {
    requestId: string;
    revieweeId: string;
}) {
    const router = useRouter();
    const supabase = createClient();
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (rating === 0) {
            toast("별점을 선택해주세요", "error");
            return;
        }

        setLoading(true);

        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase.from("reviews").insert({
            request_id: requestId,
            reviewer_id: user.id,
            reviewee_id: revieweeId,
            rating,
            comment: comment.trim() || null,
        });

        if (error) {
            toast("리뷰 작성에 실패했어요", "error");
        } else {
            toast("리뷰가 등록되었어요!", "success");
            router.refresh();
        }

        setLoading(false);
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-3"
        >
            <p className="text-sm font-medium">프로에게 리뷰를 남겨주세요</p>

            <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                    <button
                        key={i}
                        type="button"
                        onClick={() => setRating(i + 1)}
                        onMouseEnter={() => setHoverRating(i + 1)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-0.5"
                    >
                        <Star
                            className={`w-7 h-7 transition-colors ${
                                i < (hoverRating || rating)
                                    ? "text-yellow-400 fill-yellow-400"
                                    : "text-gray-200"
                            }`}
                        />
                    </button>
                ))}
            </div>

            <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="어떤 점이 좋았나요? (선택)"
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />

            <button
                type="submit"
                disabled={loading || rating === 0}
                className="w-full bg-yellow-500 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-yellow-600 transition-colors disabled:opacity-50"
            >
                {loading ? "등록 중..." : "리뷰 등록하기"}
            </button>
        </form>
    );
}
