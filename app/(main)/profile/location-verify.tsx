"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/components/toast";

export default function LocationVerify({ verified }: { verified: boolean }) {
    const supabase = createClient();
    const [loading, setLoading] = useState(false);

    async function handleVerify() {
        if (!navigator.geolocation) {
            toast("위치 서비스를 지원하지 않는 브라우저입니다", "error");
            return;
        }

        setLoading(true);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                const {
                    data: { user },
                } = await supabase.auth.getUser();
                if (!user) return;

                const { error } = await supabase
                    .from("profiles")
                    .update({
                        location: `POINT(${longitude} ${latitude})` as unknown,
                        lat: latitude,
                        lng: longitude,
                    })
                    .eq("id", user.id);

                if (error) {
                    toast("위치 저장에 실패했어요", "error");
                } else {
                    toast("동네 인증 완료!", "success");
                    window.location.reload();
                }
                setLoading(false);
            },
            () => {
                toast("위치 권한을 허용해주세요", "error");
                setLoading(false);
            },
        );
    }

    if (verified) {
        return (
            <div className="flex items-center gap-2 bg-green-50 text-green-700 rounded-xl p-4 text-sm border border-green-100">
                <MapPin className="w-4 h-4" />
                동네 인증이 완료되었어요!
            </div>
        );
    }

    return (
        <button
            onClick={handleVerify}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white py-3 rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
            <MapPin className="w-4 h-4" />
            {loading ? "위치 확인 중..." : "동네 인증하기"}
        </button>
    );
}
