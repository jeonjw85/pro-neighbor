"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/components/toast";
import type { Profile } from "@/types/database";

const allSkills = [
    "청소",
    "수리",
    "배달/심부름",
    "반려동물",
    "이사",
    "가구조립",
    "전기/배선",
    "페인트",
    "컴퓨터/IT",
    "가전수리",
    "요리/식사준비",
    "정리정돈",
];

export default function VerificationPage() {
    const router = useRouter();
    const supabase = createClient();
    const [bio, setBio] = useState("");
    const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
    const [certFiles, setCertFiles] = useState<File[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingProfile, setLoadingProfile] = useState(true);

    useEffect(() => {
        (async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) {
                router.push("/auth/login");
                return;
            }
            const { data: profile } = await supabase
                .from("profiles")
                .select("bio, skills, is_verified")
                .eq("id", user.id)
                .single();

            if (profile) {
                const p = profile as Pick<
                    Profile,
                    "bio" | "skills" | "is_verified"
                >;
                if (p.bio) setBio(p.bio);
                if (p.skills) setSelectedSkills(p.skills);
            }
            setLoadingProfile(false);
        })();
    }, []);

    function toggleSkill(skill: string) {
        setSelectedSkills((prev) =>
            prev.includes(skill)
                ? prev.filter((s) => s !== skill)
                : [...prev, skill],
        );
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const files = e.target.files;
        if (!files) return;
        const newFiles = Array.from(files).slice(0, 3 - certFiles.length);
        setCertFiles((prev) => [...prev, ...newFiles]);
    }

    function removeFile(index: number) {
        setCertFiles((prev) => prev.filter((_, i) => i !== index));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!bio.trim()) {
            toast("자기소개를 입력해주세요", "error");
            return;
        }
        if (selectedSkills.length === 0) {
            toast("전문 분야를 1개 이상 선택해주세요", "error");
            return;
        }

        setLoading(true);

        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const certUrls: string[] = [];
        for (const file of certFiles) {
            const ext = file.name.split(".").pop();
            const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
            const { error } = await supabase.storage
                .from("certificates")
                .upload(fileName, file);
            if (!error) {
                certUrls.push(fileName);
            }
        }

        const { error } = await supabase
            .from("profiles")
            .update({
                bio: bio.trim(),
                skills: selectedSkills,
                certificate_urls: certUrls.length > 0 ? certUrls : undefined,
                is_verified: true,
            })
            .eq("id", user.id);

        if (error) {
            toast("저장에 실패했어요", "error");
        } else {
            toast("프로 인증이 완료되었어요!", "success");
            router.push("/dashboard");
            router.refresh();
        }

        setLoading(false);
    }

    if (loadingProfile) {
        return (
            <main className="max-w-lg mx-auto px-4 pt-6">
                <div className="text-center py-20 text-gray-400 text-sm">
                    불러오는 중...
                </div>
            </main>
        );
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
                <h1 className="text-lg font-bold">프로 인증</h1>
            </header>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">
                        자기소개
                    </label>
                    <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="자신을 소개해주세요. 어떤 서비스를 제공할 수 있는지, 경력이나 특기 등을 적어주세요."
                        rows={4}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                </div>

                <div>
                    <label className="text-xs font-medium text-gray-500 mb-2 block">
                        전문 분야 (1개 이상 선택)
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {allSkills.map((skill) => (
                            <button
                                key={skill}
                                type="button"
                                onClick={() => toggleSkill(skill)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                                    selectedSkills.includes(skill)
                                        ? "bg-indigo-500 text-white border-indigo-500"
                                        : "bg-white text-gray-600 border-gray-200"
                                }`}
                            >
                                {skill}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="text-xs font-medium text-gray-500 mb-2 block">
                        자격증 / 경력 증명 (선택, 최대 3장)
                    </label>
                    <div className="space-y-2">
                        {certFiles.map((file, i) => (
                            <div
                                key={i}
                                className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
                            >
                                <span className="text-xs text-gray-600 truncate flex-1">
                                    {file.name}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => removeFile(i)}
                                    className="ml-2 text-gray-400 hover:text-red-500"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        {certFiles.length < 3 && (
                            <label className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-gray-200 rounded-xl py-4 cursor-pointer hover:border-indigo-300 transition-colors">
                                <Upload className="w-4 h-4 text-gray-400" />
                                <span className="text-xs text-gray-400">
                                    파일 선택
                                </span>
                                <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </label>
                        )}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-500 text-white py-3 rounded-xl text-sm font-medium hover:bg-indigo-600 transition-colors disabled:opacity-50"
                >
                    {loading ? "저장 중..." : "인증 완료하기"}
                </button>
            </form>
        </main>
    );
}
