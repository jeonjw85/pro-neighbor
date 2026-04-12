import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, User, MapPin, Shield, Bell } from "lucide-react";
import StatusBadge from "@/components/status-badge";
import ProDashboard from "@/components/pro-dashboard";
import type { ServiceRequest, Profile } from "@/types/database";
import { getDistanceKm, MAX_DISTANCE_KM, formatTimeAgo } from "@/lib/utils";

export default async function DashboardPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/auth/login");

    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    const isNeighbor = profile?.role === "NEIGHBOR";
    const proNeedsSetup =
        !isNeighbor &&
        (!profile?.lat || !profile?.lng || !profile?.is_verified);

    let requests: ServiceRequest[] = [];

    if (isNeighbor) {
        const { data } = await supabase
            .from("requests")
            .select("*")
            .eq("client_id", user.id)
            .order("created_at", { ascending: false })
            .limit(20);
        requests = (data as ServiceRequest[]) ?? [];
    } else if (!proNeedsSetup && profile?.lat && profile?.lng) {
        const { data } = await supabase
            .from("requests")
            .select("*")
            .eq("status", "OPEN")
            .order("created_at", { ascending: false })
            .limit(100);

        const allReqs = (data as ServiceRequest[]) ?? [];
        requests = allReqs.filter((r) => {
            if (r.lat == null || r.lng == null) return false;
            return (
                getDistanceKm(profile.lat!, profile.lng!, r.lat, r.lng) <=
                MAX_DISTANCE_KM
            );
        });
    }

    return (
        <main className="max-w-lg mx-auto px-4 pt-6">
            <header className="flex items-center justify-between mb-6">
                <div>
                    <p className="text-xs text-gray-400">
                        {isNeighbor ? "이웃 모드" : "프로 모드"}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                        <h1 className="text-lg font-bold">
                            {profile?.full_name ?? "사용자"}님
                        </h1>
                        <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                isNeighbor
                                    ? "bg-blue-100 text-blue-600"
                                    : "bg-indigo-100 text-indigo-600"
                            }`}
                        >
                            {isNeighbor ? "이웃" : "프로"}
                        </span>
                    </div>
                </div>
                <Link
                    href="/profile"
                    className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center"
                >
                    <User className="w-4 h-4 text-gray-500" />
                </Link>
            </header>

            {isNeighbor ? (
                <div>
                    <Link
                        href="/requests/new"
                        className="flex items-center justify-center gap-2 w-full bg-blue-500 text-white py-3 rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors mb-6"
                    >
                        <Plus className="w-4 h-4" />
                        도움 요청하기
                    </Link>

                    {requests.filter((r) => r.status === "PENDING").length >
                        0 && (
                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-3">
                                <Bell className="w-4 h-4 text-orange-500" />
                                <h2 className="text-sm font-semibold text-orange-600">
                                    프로의 제안이 왔어요!
                                </h2>
                            </div>
                            <div className="space-y-2">
                                {requests
                                    .filter((r) => r.status === "PENDING")
                                    .map((req) => (
                                        <Link
                                            key={req.id}
                                            href={`/requests/${req.id}`}
                                            className="block bg-orange-50 rounded-xl p-4 border border-orange-200 hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">
                                                        {req.title}
                                                    </p>
                                                    {req.proposed_price && (
                                                        <p className="text-xs text-orange-600 mt-1">
                                                            제안 금액:{" "}
                                                            {req.proposed_price}
                                                        </p>
                                                    )}
                                                </div>
                                                <StatusBadge
                                                    status={req.status}
                                                />
                                            </div>
                                            <p className="text-xs text-orange-500 mt-2">
                                                탭하여 수락/거절하기 →
                                            </p>
                                        </Link>
                                    ))}
                            </div>
                        </div>
                    )}

                    <h2 className="text-sm font-semibold text-gray-600 mb-3">
                        내 요청
                    </h2>

                    {requests.length === 0 ? (
                        <div className="text-center py-14 text-gray-400 text-sm">
                            아직 요청이 없어요
                            <br />
                            <span className="text-xs">
                                위 버튼을 눌러 첫 요청을 올려보세요
                            </span>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {requests.map((req) => (
                                <Link
                                    key={req.id}
                                    href={`/requests/${req.id}`}
                                    className="block bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {req.title}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1 truncate">
                                                {req.description ?? "설명 없음"}
                                            </p>
                                        </div>
                                        <StatusBadge status={req.status} />
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-xs text-gray-300">
                                            {formatTimeAgo(req.created_at)}
                                        </span>
                                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-500">
                                            {req.category}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            ) : proNeedsSetup ? (
                <div className="space-y-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 text-center">
                        <Shield className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                        <p className="text-sm font-medium text-yellow-800 mb-1">
                            프로 설정을 완료해주세요
                        </p>
                        <p className="text-xs text-yellow-600 mb-4">
                            요청을 받으려면 동네 인증과 프로 인증이 필요해요
                        </p>
                    </div>

                    {!profile?.lat || !profile?.lng ? (
                        <Link
                            href="/profile"
                            className="flex items-center gap-3 bg-white rounded-xl p-4 border border-gray-200"
                        >
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                <MapPin className="w-5 h-5 text-red-500" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium">
                                    동네 인증하기
                                </p>
                                <p className="text-xs text-gray-400">
                                    GPS 위치로 동네를 인증하세요
                                </p>
                            </div>
                            <span className="text-xs text-red-500 font-medium">
                                필요
                            </span>
                        </Link>
                    ) : (
                        <div className="flex items-center gap-3 bg-white rounded-xl p-4 border border-green-200">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                <MapPin className="w-5 h-5 text-green-500" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium">
                                    동네 인증 완료
                                </p>
                            </div>
                        </div>
                    )}

                    {!profile?.is_verified ? (
                        <Link
                            href="/profile/verification"
                            className="flex items-center gap-3 bg-white rounded-xl p-4 border border-gray-200"
                        >
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                <Shield className="w-5 h-5 text-red-500" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium">
                                    프로 인증하기
                                </p>
                                <p className="text-xs text-gray-400">
                                    소개와 전문 분야를 등록하세요
                                </p>
                            </div>
                            <span className="text-xs text-red-500 font-medium">
                                필요
                            </span>
                        </Link>
                    ) : (
                        <div className="flex items-center gap-3 bg-white rounded-xl p-4 border border-green-200">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                <Shield className="w-5 h-5 text-green-500" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium">
                                    프로 인증 완료
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <ProDashboard
                    initialRequests={requests}
                    profile={profile as Profile}
                />
            )}
        </main>
    );
}
