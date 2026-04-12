"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Camera, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/components/toast";
import type { Urgency } from "@/types/database";

const categories = [
    "청소",
    "수리",
    "배달/심부름",
    "반려동물",
    "이사",
    "가구조립",
    "전기/배선",
    "기타",
];
const urgencyOptions: { value: Urgency; label: string; color: string }[] = [
    {
        value: "LOW",
        label: "여유있음",
        color: "bg-green-100 text-green-700 border-green-200",
    },
    {
        value: "NORMAL",
        label: "보통",
        color: "bg-gray-100 text-gray-700 border-gray-200",
    },
    {
        value: "URGENT",
        label: "급함",
        color: "bg-red-100 text-red-700 border-red-200",
    },
];

export default function NewRequestPage() {
    const router = useRouter();
    const supabase = createClient();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("기타");
    const [budget, setBudget] = useState("");
    const [urgency, setUrgency] = useState<Urgency>("NORMAL");
    const [photos, setPhotos] = useState<File[]>([]);
    const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [lat, setLat] = useState<number | null>(null);
    const [lng, setLng] = useState<number | null>(null);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setLat(pos.coords.latitude);
                    setLng(pos.coords.longitude);
                },
                () => {},
            );
        }
    }, []);

    function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
        const files = e.target.files;
        if (!files) return;
        const newFiles = Array.from(files).slice(0, 5 - photos.length);
        setPhotos((prev) => [...prev, ...newFiles]);
        newFiles.forEach((file) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreviews((prev) => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        });
    }

    function removePhoto(index: number) {
        setPhotos((prev) => prev.filter((_, i) => i !== index));
        setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
            toast("로그인이 필요합니다", "error");
            router.push("/auth/login");
            return;
        }

        const photoUrls: string[] = [];
        for (const file of photos) {
            const ext = file.name.split(".").pop();
            const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
            const { error } = await supabase.storage
                .from("request-photos")
                .upload(fileName, file);
            if (!error) {
                const { data: urlData } = supabase.storage
                    .from("request-photos")
                    .getPublicUrl(fileName);
                photoUrls.push(urlData.publicUrl);
            }
        }

        const { error } = await supabase.from("requests").insert({
            client_id: user.id,
            title,
            description,
            category,
            photo_urls: photoUrls,
            status: "OPEN",
            location: lat && lng ? (`POINT(${lng} ${lat})` as unknown) : null,
            lat,
            lng,
            matched_pro_id: null,
            budget: budget.trim() || null,
            urgency,
        });

        if (error) {
            toast(error.message, "error");
            setLoading(false);
            return;
        }

        toast("요청이 등록되었어요!", "success");
        router.push("/requests");
        router.refresh();
    }

    return (
        <main className="max-w-lg mx-auto px-4 pt-6 pb-8">
            <header className="flex items-center gap-3 mb-6">
                <button
                    onClick={() => router.back()}
                    className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center"
                >
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <h1 className="text-lg font-bold">새 요청</h1>
            </header>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">
                        제목
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="어떤 도움이 필요하세요?"
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">
                        카테고리
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setCategory(cat)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                                    category === cat
                                        ? "bg-blue-500 text-white border-blue-500"
                                        : "bg-white text-gray-600 border-gray-200"
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">
                        상세 설명
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="구체적으로 설명해주세요 (상황, 크기, 수량 등)"
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                </div>

                <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">
                        사진 첨부 (최대 5장)
                    </label>
                    <div className="flex gap-2 flex-wrap">
                        {photoPreviews.map((preview, i) => (
                            <div
                                key={i}
                                className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200"
                            >
                                <img
                                    src={preview}
                                    alt=""
                                    className="w-full h-full object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={() => removePhoto(i)}
                                    className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center"
                                >
                                    <X className="w-3 h-3 text-white" />
                                </button>
                            </div>
                        ))}
                        {photos.length < 5 && (
                            <label className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-blue-300 transition-colors">
                                <Camera className="w-5 h-5 text-gray-300" />
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoChange}
                                    className="hidden"
                                />
                            </label>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs font-medium text-gray-500 mb-1 block">
                            예산 (선택)
                        </label>
                        <input
                            type="text"
                            value={budget}
                            onChange={(e) => setBudget(e.target.value)}
                            placeholder="예: 3만원"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-500 mb-1 block">
                            긴급도
                        </label>
                        <div className="flex gap-1.5">
                            {urgencyOptions.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setUrgency(opt.value)}
                                    className={`flex-1 py-2.5 rounded-lg text-xs font-medium border transition-colors ${
                                        urgency === opt.value
                                            ? opt.color
                                            : "bg-white text-gray-400 border-gray-200"
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div
                    className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${lat ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-400"}`}
                >
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    {lat
                        ? "현재 위치가 자동 첨부돼요"
                        : "위치 정보를 가져오는 중..."}
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-500 text-white py-3 rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                    {loading ? "등록 중..." : "요청 등록하기"}
                </button>
            </form>
        </main>
    );
}
