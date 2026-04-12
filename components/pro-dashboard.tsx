"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import MapView, { type RequestPin } from "@/components/map-view";
import StatusBadge from "@/components/status-badge";
import type { ServiceRequest, Profile } from "@/types/database";
import {
    getDistanceKm,
    MAX_DISTANCE_KM,
    formatDistance,
    formatTimeAgo,
} from "@/lib/utils";

export default function ProDashboard({
    initialRequests,
    profile,
}: {
    initialRequests: ServiceRequest[];
    profile: Profile;
}) {
    const [requests, setRequests] = useState<ServiceRequest[]>(initialRequests);
    const supabase = createClient();

    useEffect(() => {
        const channel = supabase
            .channel("pro-new-requests")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "requests",
                },
                (payload) => {
                    const newReq = payload.new as ServiceRequest;
                    if (newReq.status !== "OPEN") return;
                    if (
                        profile.lat != null &&
                        profile.lng != null &&
                        newReq.lat != null &&
                        newReq.lng != null
                    ) {
                        const dist = getDistanceKm(
                            profile.lat,
                            profile.lng,
                            newReq.lat,
                            newReq.lng,
                        );
                        if (dist > MAX_DISTANCE_KM) return;
                    }
                    setRequests((prev) => [newReq, ...prev]);
                },
            )
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "requests",
                },
                (payload) => {
                    const updated = payload.new as ServiceRequest;
                    setRequests((prev) =>
                        prev
                            .map((r) => (r.id === updated.id ? updated : r))
                            .filter((r) => r.status === "OPEN"),
                    );
                },
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase, profile.lat, profile.lng]);

    const openRequests = requests.filter((r) => r.status === "OPEN");

    const pins: RequestPin[] = openRequests
        .filter((r) => r.lat != null && r.lng != null)
        .map((r) => ({
            id: r.id,
            title: r.title,
            category: r.category,
            lat: r.lat!,
            lng: r.lng!,
            status: r.status,
        }));

    const center: [number, number] =
        profile.lat != null && profile.lng != null
            ? [profile.lat, profile.lng]
            : [37.5665, 126.978];

    return (
        <div className="space-y-5">
            <div>
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-sm font-semibold text-gray-600">
                        주변 요청 지도
                    </h2>
                    <span className="text-xs text-gray-400">
                        반경 {MAX_DISTANCE_KM}km 이내
                    </span>
                </div>
                <MapView pins={pins} center={center} />
            </div>

            <div>
                <h2 className="text-sm font-semibold text-gray-600 mb-3">
                    열린 요청{" "}
                    <span className="text-blue-500">
                        ({openRequests.length})
                    </span>
                </h2>

                {openRequests.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 text-sm">
                        주변에 요청이 없어요
                    </div>
                ) : (
                    <div className="space-y-3">
                        {openRequests.map((req) => {
                            const dist =
                                profile.lat != null &&
                                profile.lng != null &&
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
            </div>
        </div>
    );
}
