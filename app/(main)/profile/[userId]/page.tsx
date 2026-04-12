import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft, Shield, Star, Briefcase } from "lucide-react";
import Link from "next/link";

export default async function PublicProfilePage({
    params,
}: {
    params: Promise<{ userId: string }>;
}) {
    const { userId } = await params;
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/auth/login");

    if (user.id === userId) redirect("/profile");

    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

    if (!profile) notFound();

    const { data: reviews } = await supabase
        .from("reviews")
        .select("*, profiles!reviews_reviewer_id_fkey(full_name)")
        .eq("reviewee_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

    const { count: completedCount } = await supabase
        .from("requests")
        .select("id", { count: "exact", head: true })
        .eq("matched_pro_id", userId)
        .eq("status", "COMPLETED");

    const avgRating =
        reviews && reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : null;

    return (
        <main className="max-w-lg mx-auto px-4 pt-6 pb-8">
            <header className="flex items-center gap-3 mb-6">
                <Link
                    href="/requests"
                    className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center"
                >
                    <ArrowLeft className="w-4 h-4" />
                </Link>
                <h1 className="text-lg font-bold">프로필</h1>
            </header>

            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 space-y-4">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600">
                        {(profile.full_name ?? "P").charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="font-bold text-lg">
                            {profile.full_name ?? "사용자"}
                        </p>
                        <span
                            className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                                profile.role === "PRO"
                                    ? "bg-indigo-100 text-indigo-600"
                                    : "bg-blue-100 text-blue-600"
                            }`}
                        >
                            {profile.role === "PRO" ? "프로" : "이웃"}
                        </span>
                    </div>
                </div>

                {profile.bio && (
                    <div className="border-t pt-3">
                        <p className="text-xs text-gray-400 mb-1">소개</p>
                        <p className="text-sm text-gray-700">{profile.bio}</p>
                    </div>
                )}

                {profile.skills && profile.skills.length > 0 && (
                    <div>
                        <p className="text-xs text-gray-400 mb-1">전문 분야</p>
                        <div className="flex flex-wrap gap-1.5">
                            {profile.skills.map((skill: string) => (
                                <span
                                    key={skill}
                                    className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full"
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                <div className="border-t pt-3 grid grid-cols-3 gap-3 text-center">
                    <div>
                        <div className="flex items-center justify-center gap-1 text-green-600 mb-0.5">
                            <Shield className="w-4 h-4" />
                        </div>
                        <p className="text-lg font-bold">
                            {profile.trust_score ?? 50}
                        </p>
                        <p className="text-[10px] text-gray-400">신뢰도</p>
                    </div>
                    <div>
                        <div className="flex items-center justify-center gap-1 text-yellow-500 mb-0.5">
                            <Star className="w-4 h-4" />
                        </div>
                        <p className="text-lg font-bold">
                            {avgRating ? avgRating.toFixed(1) : "-"}
                        </p>
                        <p className="text-[10px] text-gray-400">평균 별점</p>
                    </div>
                    <div>
                        <div className="flex items-center justify-center gap-1 text-blue-500 mb-0.5">
                            <Briefcase className="w-4 h-4" />
                        </div>
                        <p className="text-lg font-bold">
                            {completedCount ?? 0}
                        </p>
                        <p className="text-[10px] text-gray-400">완료 건수</p>
                    </div>
                </div>
            </div>

            {reviews && reviews.length > 0 && (
                <div className="mt-4">
                    <h2 className="text-sm font-semibold text-gray-600 mb-3">
                        리뷰 ({reviews.length})
                    </h2>
                    <div className="space-y-2">
                        {reviews.map((review) => {
                            const reviewer = review.profiles as {
                                full_name: string | null;
                            } | null;
                            return (
                                <div
                                    key={review.id}
                                    className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-xs font-medium text-gray-600">
                                            {reviewer?.full_name ?? "익명"}
                                        </p>
                                        <div className="flex gap-0.5">
                                            {Array.from({ length: 5 }).map(
                                                (_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={`w-3 h-3 ${i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`}
                                                    />
                                                ),
                                            )}
                                        </div>
                                    </div>
                                    {review.comment && (
                                        <p className="text-sm text-gray-700">
                                            {review.comment}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </main>
    );
}
