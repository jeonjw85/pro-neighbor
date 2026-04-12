import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import {
    ArrowLeft,
    MessageCircle,
    Clock,
    Wallet,
    AlertTriangle,
    User2,
    Banknote,
} from "lucide-react";
import Link from "next/link";
import StatusBadge from "@/components/status-badge";
import AcceptButton from "./accept-button";
import ReviewForm from "@/components/review-form";
import {
    formatTimeAgo,
    getDistanceKm,
    MAX_DISTANCE_KM,
    formatDistance,
} from "@/lib/utils";

export default async function RequestDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/auth/login");

    const { data: request } = await supabase
        .from("requests")
        .select("*")
        .eq("id", id)
        .single();

    if (!request) notFound();

    const { data: profile } = await supabase
        .from("profiles")
        .select("role, lat, lng, is_verified")
        .eq("id", user.id)
        .single();

    const { data: clientProfile } = await supabase
        .from("profiles")
        .select("full_name, trust_score")
        .eq("id", request.client_id)
        .single();

    const { data: proProfile } = request.matched_pro_id
        ? await supabase
              .from("profiles")
              .select("full_name, trust_score, skills, bio, is_verified")
              .eq("id", request.matched_pro_id)
              .single()
        : { data: null };

    const { data: existingReview } = await supabase
        .from("reviews")
        .select("*")
        .eq("request_id", id)
        .maybeSingle();

    const isPro = profile?.role === "PRO";
    const isOwner = user.id === request.client_id;

    let canAccept = false;
    let distToRequest: number | null = null;
    if (isPro && request.status === "OPEN" && profile?.is_verified) {
        if (
            profile?.lat != null &&
            profile?.lng != null &&
            request.lat != null &&
            request.lng != null
        ) {
            distToRequest = getDistanceKm(
                profile.lat,
                profile.lng,
                request.lat,
                request.lng,
            );
            canAccept = distToRequest <= MAX_DISTANCE_KM;
        }
    }

    const canReview =
        isOwner &&
        request.status === "COMPLETED" &&
        request.matched_pro_id &&
        !existingReview;

    const urgencyLabel =
        request.urgency === "URGENT"
            ? "급함"
            : request.urgency === "LOW"
              ? "여유있음"
              : "보통";
    const urgencyColor =
        request.urgency === "URGENT"
            ? "text-red-600 bg-red-50"
            : request.urgency === "LOW"
              ? "text-green-600 bg-green-50"
              : "text-gray-600 bg-gray-50";

    return (
        <main className="max-w-lg mx-auto px-4 pt-6 pb-8">
            <header className="flex items-center gap-3 mb-6">
                <Link
                    href="/requests"
                    className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center"
                >
                    <ArrowLeft className="w-4 h-4" />
                </Link>
                <h1 className="text-lg font-bold flex-1 truncate">
                    {request.title}
                </h1>
                <StatusBadge status={request.status} />
            </header>

            {request.photo_urls && request.photo_urls.length > 0 && (
                <div className="flex gap-2 overflow-x-auto mb-4 pb-1">
                    {request.photo_urls.map((url: string, i: number) => (
                        <img
                            key={i}
                            src={url}
                            alt={`사진 ${i + 1}`}
                            className="w-40 h-32 rounded-xl object-cover border border-gray-200 shrink-0"
                        />
                    ))}
                </div>
            )}

            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs text-gray-400 mb-1">요청자</p>
                        <p className="text-sm font-medium">
                            {clientProfile?.full_name ?? "익명"}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-400">신뢰도</p>
                        <p className="text-sm font-bold text-green-600">
                            {clientProfile?.trust_score ?? 50}점
                        </p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <div className="flex items-center gap-1.5">
                        <span className="inline-block text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">
                            {request.category}
                        </span>
                    </div>
                    <div
                        className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${urgencyColor}`}
                    >
                        {request.urgency === "URGENT" && (
                            <AlertTriangle className="w-3 h-3" />
                        )}
                        {urgencyLabel}
                    </div>
                    {request.budget && (
                        <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                            <Wallet className="w-3 h-3" />
                            {request.budget}
                        </div>
                    )}
                </div>

                <div>
                    <p className="text-xs text-gray-400 mb-1">상세 설명</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {request.description ?? "설명이 없습니다."}
                    </p>
                </div>

                {proProfile && (
                    <div className="border-t pt-3">
                        <p className="text-xs text-gray-400 mb-1">
                            {request.status === "PENDING"
                                ? "제안한 프로"
                                : "매칭된 프로"}
                        </p>
                        <div className="flex items-center justify-between">
                            <Link
                                href={`/profile/${request.matched_pro_id}`}
                                className="text-sm font-medium text-blue-600 hover:underline"
                            >
                                {proProfile.full_name ?? "프로"} →
                            </Link>
                            <span className="text-xs text-green-600 font-medium">
                                신뢰도 {proProfile.trust_score ?? 50}점
                            </span>
                        </div>
                        {proProfile.skills &&
                            (proProfile.skills as string[]).length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {(proProfile.skills as string[]).map(
                                        (s: string) => (
                                            <span
                                                key={s}
                                                className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-full"
                                            >
                                                {s}
                                            </span>
                                        ),
                                    )}
                                </div>
                            )}
                        {request.proposed_price && (
                            <div className="flex items-center gap-1.5 mt-2 bg-orange-50 px-3 py-2 rounded-lg">
                                <Banknote className="w-4 h-4 text-orange-500" />
                                <span className="text-sm font-medium text-orange-700">
                                    제안 금액: {request.proposed_price}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    {formatTimeAgo(request.created_at)}
                </div>
            </div>

            {existingReview && (
                <div className="mt-4 bg-yellow-50 border border-yellow-100 rounded-xl p-4">
                    <p className="text-xs text-gray-400 mb-1">리뷰</p>
                    <div className="flex items-center gap-1 mb-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <span
                                key={i}
                                className={`text-sm ${i < existingReview.rating ? "text-yellow-400" : "text-gray-200"}`}
                            >
                                *
                            </span>
                        ))}
                    </div>
                    {existingReview.comment && (
                        <p className="text-sm text-gray-700">
                            {existingReview.comment}
                        </p>
                    )}
                </div>
            )}

            <div className="mt-4 space-y-2">
                {canAccept && (
                    <>
                        {distToRequest != null && (
                            <p className="text-xs text-blue-500 text-center mb-1">
                                내 위치에서 {formatDistance(distToRequest)}
                            </p>
                        )}
                        <AcceptButton
                            requestId={request.id}
                            clientId={request.client_id}
                        />
                    </>
                )}

                {isPro && request.status === "OPEN" && !canAccept && (
                    <div className="text-center text-xs text-gray-400 py-3 bg-gray-50 rounded-xl">
                        {!profile?.is_verified
                            ? "프로 인증을 완료해야 수락할 수 있어요"
                            : distToRequest != null &&
                                distToRequest > MAX_DISTANCE_KM
                              ? `거리가 너무 멀어요 (${formatDistance(distToRequest)})`
                              : "위치 인증을 완료해야 수락할 수 있어요"}
                    </div>
                )}

                {isPro &&
                    request.status === "PENDING" &&
                    user.id === request.matched_pro_id && (
                        <div className="text-center text-sm text-orange-600 py-3 bg-orange-50 rounded-xl">
                            제안을 보냈어요. 이웃의 수락을 기다리는 중...
                        </div>
                    )}

                {isOwner &&
                    request.status === "PENDING" &&
                    request.matched_pro_id && (
                        <div className="space-y-2">
                            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
                                <p className="text-sm font-medium text-orange-800 mb-1">
                                    프로가 제안을 보냈어요!
                                </p>
                                <p className="text-xs text-orange-600">
                                    수락하면 채팅으로 상세 내용을 조율할 수
                                    있어요
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <RejectForm requestId={request.id} />
                                <AcceptProposalForm
                                    requestId={request.id}
                                    proId={request.matched_pro_id}
                                    clientId={request.client_id}
                                />
                            </div>
                        </div>
                    )}

                {(request.status === "MATCHED" ||
                    request.status === "COMPLETED") &&
                    (isOwner || user.id === request.matched_pro_id) && (
                        <Link
                            href={`/chat/${request.id}`}
                            className="flex items-center justify-center gap-2 w-full bg-indigo-500 text-white py-3 rounded-xl text-sm font-medium hover:bg-indigo-600 transition-colors"
                        >
                            <MessageCircle className="w-4 h-4" />
                            채팅하기
                        </Link>
                    )}

                {isOwner && request.status === "MATCHED" && (
                    <CompleteForm requestId={request.id} />
                )}

                {isOwner &&
                    (request.status === "OPEN" ||
                        request.status === "PENDING") && (
                        <CancelForm requestId={request.id} />
                    )}

                {canReview && (
                    <ReviewForm
                        requestId={request.id}
                        revieweeId={request.matched_pro_id!}
                    />
                )}
            </div>
        </main>
    );
}

async function CompleteForm({ requestId }: { requestId: string }) {
    async function completeRequest() {
        "use server";
        const supabase = await createClient();
        await supabase
            .from("requests")
            .update({ status: "COMPLETED" })
            .eq("id", requestId);
        redirect("/requests");
    }

    return (
        <form action={completeRequest}>
            <button
                type="submit"
                className="w-full bg-green-500 text-white py-3 rounded-xl text-sm font-medium hover:bg-green-600 transition-colors"
            >
                완료 처리하기
            </button>
        </form>
    );
}

async function CancelForm({ requestId }: { requestId: string }) {
    async function cancelRequest() {
        "use server";
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        await supabase
            .from("requests")
            .delete()
            .eq("id", requestId)
            .eq("client_id", user.id);
        redirect("/requests");
    }

    return (
        <form action={cancelRequest}>
            <button
                type="submit"
                className="w-full text-red-500 py-3 rounded-xl text-sm font-medium border border-red-200 hover:bg-red-50 transition-colors"
            >
                요청 취소하기
            </button>
        </form>
    );
}

async function AcceptProposalForm({
    requestId,
    proId,
    clientId,
}: {
    requestId: string;
    proId: string;
    clientId: string;
}) {
    async function acceptProposal() {
        "use server";
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user || user.id !== clientId) return;

        const { error: updateError } = await supabase
            .from("requests")
            .update({ status: "MATCHED" })
            .eq("id", requestId)
            .eq("status", "PENDING");

        if (updateError) return;

        await supabase.from("chat_rooms").upsert(
            {
                request_id: requestId,
                neighbor_id: clientId,
                pro_id: proId,
            },
            { onConflict: "request_id" },
        );

        redirect(`/chat/${requestId}`);
    }

    return (
        <form action={acceptProposal} className="flex-1">
            <button
                type="submit"
                className="w-full bg-blue-500 text-white py-3 rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors"
            >
                수락하기
            </button>
        </form>
    );
}

async function RejectForm({ requestId }: { requestId: string }) {
    async function rejectProposal() {
        "use server";
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        await supabase
            .from("requests")
            .update({
                status: "OPEN",
                matched_pro_id: null,
                proposed_price: null,
            })
            .eq("id", requestId)
            .eq("client_id", user.id);
        redirect(`/requests/${requestId}`);
    }

    return (
        <form action={rejectProposal} className="flex-1">
            <button
                type="submit"
                className="w-full text-gray-600 py-3 rounded-xl text-sm font-medium border border-gray-200 hover:bg-gray-50 transition-colors"
            >
                거절하기
            </button>
        </form>
    );
}
