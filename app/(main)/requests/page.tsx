import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Shield, MapPin } from "lucide-react";
import StatusBadge from "@/components/status-badge";
import type { ServiceRequest } from "@/types/database";
import {
    getDistanceKm,
    MAX_DISTANCE_KM,
    formatDistance,
    formatTimeAgo,
} from "@/lib/utils";

export default async function RequestsPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/auth/login");

    const { data: profile } = await supabase
        .from("profiles")
        .select("role, lat, lng, is_verified")
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
            .order("created_at", { ascending: false });
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
                <h1 className="text-lg font-bold">
                    {isNeighbor ? "내 요청 목록" : "주변 요청"}
                </h1>
                {isNeighbor && (
                    <Link
                        href="/requests/new"
                        className="flex items-center gap-1 bg-blue-500 text-white px-3 py-2 rounded-lg text-xs font-medium"
                    >
                        <Plus className="w-3 h-3" />새 요청
                    </Link>
                )}
            </header>

            {proNeedsSetup ? (
                <div className="text-center py-16 space-y-4">
                    <Shield className="w-10 h-10 text-yellow-400 mx-auto" />
                    <p className="text-sm text-gray-600 font-medium">
                        동네 인증과 프로 인증을 완료해야
                        <br />
                        주변 요청을 볼 수 있어요
                    </p>
                    <div className="flex flex-col gap-2 max-w-xs mx-auto">
                        {(!profile?.lat || !profile?.lng) && (
                            <Link
                                href="/profile"
                                className="flex items-center justify-center gap-2 bg-blue-500 text-white py-2.5 rounded-xl text-sm font-medium"
                            >
                                <MapPin className="w-4 h-4" />
                                동네 인증하기
                            </Link>
                        )}
                        {!profile?.is_verified && (
                            <Link
                                href="/profile/verification"
                                className="flex items-center justify-center gap-2 bg-indigo-500 text-white py-2.5 rounded-xl text-sm font-medium"
                            >
                                <Shield className="w-4 h-4" />
                                프로 인증하기
                            </Link>
                        )}
                    </div>
                </div>
            ) : requests.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-gray-400 text-sm mb-4">
                        {isNeighbor
                            ? "요청이 없습니다"
                            : "주변에 열린 요청이 없어요"}
                    </p>
                    {isNeighbor && (
                        <Link
                            href="/requests/new"
                            className="text-blue-500 text-sm font-medium"
                        >
                            첫 요청 만들기
                        </Link>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {requests.map((req) => {
                        const dist =
                            !isNeighbor &&
                            profile?.lat &&
                            profile?.lng &&
                            req.lat != null &&
                            req.lng != null
                                ? getDistanceKm(
                                      profile.lat,
                                      profile.lng,
                                      req.lat,
                                      req.lng,
                                  )
                                : null;

                        return (
                            <Link
                                key={req.id}
                                href={`/requests/${req.id}`}
                                className="block bg-white rounded-xl p-4 shadow-sm border border-gray-100"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {req.title}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                                            {req.description}
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
                                    {req.urgency === "URGENT" && (
                                        <span className="text-xs bg-red-100 px-2 py-0.5 rounded-full text-red-600 font-medium">
                                            급함
                                        </span>
                                    )}
                                    {dist != null && (
                                        <span className="text-xs text-blue-500">
                                            {formatDistance(dist)}
                                        </span>
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </main>
    );
}
