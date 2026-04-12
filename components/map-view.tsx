"use client";

import { useEffect, useRef, useState } from "react";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";

export interface RequestPin {
    id: string;
    title: string;
    category: string;
    lat: number;
    lng: number;
    status: string;
}

export default function MapView({
    pins,
    center,
}: {
    pins: RequestPin[];
    center: [number, number];
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<google.maps.Map | null>(null);
    const myMarkerRef = useRef<google.maps.Marker | null>(null);
    const accuracyCircleRef = useRef<google.maps.Circle | null>(null);
    const watchIdRef = useRef<number | null>(null);
    const [accuracy, setAccuracy] = useState<number | null>(null);
    const [geoError, setGeoError] = useState(false);
    const [locating, setLocating] = useState(true);

    useEffect(() => {
        if (!containerRef.current) return;

        async function initMap(pos: [number, number]) {
            if (!containerRef.current) return;

            setOptions({
                key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? "",
                v: "weekly",
            });

            const { Map } = await importLibrary("maps");
            const mapCenter = { lat: pos[0], lng: pos[1] };

            if (!mapRef.current) {
                const map = new Map(containerRef.current!, {
                    center: mapCenter,
                    zoom: 15,
                    disableDefaultUI: true,
                    zoomControl: true,
                    gestureHandling: "greedy",
                });
                mapRef.current = map;

                pins.forEach((pin) => {
                    const color =
                        pin.status === "OPEN"
                            ? "#ef4444"
                            : pin.status === "MATCHED"
                              ? "#6366f1"
                              : "#22c55e";

                    const marker = new google.maps.Marker({
                        map,
                        position: { lat: pin.lat, lng: pin.lng },
                        icon: {
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: 7,
                            fillColor: color,
                            fillOpacity: 1,
                            strokeColor: "#ffffff",
                            strokeWeight: 2,
                        },
                    });

                    const info = new google.maps.InfoWindow({
                        content: `<div style="min-width:130px;font-family:sans-serif">
                            <p style="font-weight:600;font-size:13px;margin:0 0 3px">${pin.title}</p>
                            <p style="font-size:11px;color:#6b7280;margin:0 0 6px">${pin.category}</p>
                            <a href="/requests/${pin.id}" style="font-size:12px;color:#3b82f6;text-decoration:none">자세히 보기 →</a>
                        </div>`,
                    });

                    marker.addListener("click", () =>
                        info.open({ anchor: marker, map }),
                    );
                });
            }

            return mapRef.current;
        }

        function updateMyLocation(
            map: google.maps.Map,
            pos: [number, number],
            acc: number,
        ) {
            const latLng = { lat: pos[0], lng: pos[1] };

            if (!myMarkerRef.current) {
                myMarkerRef.current = new google.maps.Marker({
                    map,
                    position: latLng,
                    title: "내 현재 위치",
                    zIndex: 100,
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 10,
                        fillColor: "#3b82f6",
                        fillOpacity: 1,
                        strokeColor: "#ffffff",
                        strokeWeight: 3,
                    },
                });
            } else {
                myMarkerRef.current.setPosition(latLng);
            }

            if (!accuracyCircleRef.current) {
                accuracyCircleRef.current = new google.maps.Circle({
                    map,
                    center: latLng,
                    radius: acc,
                    fillColor: "#3b82f6",
                    fillOpacity: 0.08,
                    strokeColor: "#3b82f6",
                    strokeOpacity: 0.4,
                    strokeWeight: 1,
                });
            } else {
                accuracyCircleRef.current.setCenter(latLng);
                accuracyCircleRef.current.setRadius(acc);
            }

            map.panTo(latLng);
        }

        async function startWatch() {
            if (!navigator.geolocation) {
                setGeoError(true);
                setLocating(false);
                const map = await initMap(center);
                if (map) {
                    new google.maps.Marker({
                        map,
                        position: { lat: center[0], lng: center[1] },
                        title: "내 인증 위치",
                        icon: {
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: 10,
                            fillColor: "#f59e0b",
                            fillOpacity: 1,
                            strokeColor: "#ffffff",
                            strokeWeight: 3,
                        },
                    });
                }
                return;
            }

            watchIdRef.current = navigator.geolocation.watchPosition(
                async (position) => {
                    const pos: [number, number] = [
                        position.coords.latitude,
                        position.coords.longitude,
                    ];
                    const acc = position.coords.accuracy;
                    setAccuracy(Math.round(acc));
                    setLocating(false);
                    setGeoError(false);

                    const map = await initMap(pos);
                    if (map) updateMyLocation(map, pos, acc);

                    if (acc < 50 && watchIdRef.current !== null) {
                        navigator.geolocation.clearWatch(watchIdRef.current);
                        watchIdRef.current = null;
                    }
                },
                async () => {
                    setGeoError(true);
                    setLocating(false);
                    const map = await initMap(center);
                    if (map) {
                        new google.maps.Marker({
                            map,
                            position: { lat: center[0], lng: center[1] },
                            title: "내 인증 위치",
                            icon: {
                                path: google.maps.SymbolPath.CIRCLE,
                                scale: 10,
                                fillColor: "#f59e0b",
                                fillOpacity: 1,
                                strokeColor: "#ffffff",
                                strokeWeight: 3,
                            },
                        });
                    }
                },
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
            );
        }

        startWatch();

        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, []);

    function retryLocation() {
        if (!mapRef.current || !navigator.geolocation) return;
        setLocating(true);
        setGeoError(false);
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
        }
        watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
                const pos: [number, number] = [
                    position.coords.latitude,
                    position.coords.longitude,
                ];
                const acc = position.coords.accuracy;
                setAccuracy(Math.round(acc));
                setLocating(false);
                if (mapRef.current) updateLocationMarker(pos, acc);
                if (acc < 50 && watchIdRef.current !== null) {
                    navigator.geolocation.clearWatch(watchIdRef.current!);
                    watchIdRef.current = null;
                }
            },
            () => {
                setGeoError(true);
                setLocating(false);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
        );
    }

    function updateLocationMarker(pos: [number, number], acc: number) {
        if (!mapRef.current) return;
        const latLng = { lat: pos[0], lng: pos[1] };
        if (myMarkerRef.current) myMarkerRef.current.setPosition(latLng);
        if (accuracyCircleRef.current) {
            accuracyCircleRef.current.setCenter(latLng);
            accuracyCircleRef.current.setRadius(acc);
        }
        mapRef.current.panTo(latLng);
    }

    return (
        <div className="relative">
            <div className="flex items-center justify-between mb-1">
                <div className="text-[10px] text-gray-400">
                    {locating && "📡 위치 찾는 중..."}
                    {!locating && !geoError && accuracy !== null && (
                        <span
                            className={
                                accuracy > 200
                                    ? "text-orange-500"
                                    : "text-green-600"
                            }
                        >
                            위치 정확도 ±{accuracy}m
                            {accuracy > 200 ? " (WiFi/IP 기반)" : ""}
                        </span>
                    )}
                    {geoError && (
                        <span className="text-orange-500">
                            위치 권한 없음 — 인증 위치 표시 중
                        </span>
                    )}
                </div>
                <button
                    onClick={retryLocation}
                    className="text-[10px] text-blue-500 underline"
                >
                    위치 갱신
                </button>
            </div>
            <div
                ref={containerRef}
                className="w-full rounded-xl overflow-hidden border border-gray-200"
                style={{ height: "280px" }}
            />
        </div>
    );
}
