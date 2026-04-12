import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ArrowLeft, Shield, MapPin, BadgeCheck, Briefcase } from "lucide-react";
import Link from "next/link";
import { signOut } from "@/app/auth/actions";
import LocationVerify from "./location-verify";

export default async function ProfilePage() {
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

    const isPro = profile?.role === "PRO";

    const { data: reviewData } = isPro
        ? await supabase
              .from("reviews")
              .select("rating")
              .eq("reviewee_id", user.id)
        : { data: null };

    const reviewCount = reviewData?.length ?? 0;

    return (
        <main className="max-w-lg mx-auto px-4 pt-6">
            <header className="flex items-center gap-3 mb-6">
                <Link
                    href="/dashboard"
                    className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center"
                >
                    <ArrowLeft className="w-4 h-4" />
                </Link>
                <h1 className="text-lg font-bold">내 프로필</h1>
            </header>

            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 space-y-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-xl">
                        {isPro ? "P" : "N"}
                    </div>
                    <div>
                        <p className="font-bold">
                            {profile?.full_name ?? "사용자"}
                        </p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                        <span
                            className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                                isPro
                                    ? "bg-indigo-100 text-indigo-600"
                                    : "bg-blue-100 text-blue-600"
                            }`}
                        >
                            {isPro ? "프로" : "이웃"}
                        </span>
                    </div>
                </div>

                {isPro && profile?.bio && (
                    <div className="border-t pt-3">
                        <p className="text-xs text-gray-400 mb-1">소개</p>
                        <p className="text-sm text-gray-700">{profile.bio}</p>
                    </div>
                )}

                {isPro && profile?.skills && profile.skills.length > 0 && (
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

                <div className="border-t pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-green-500" />
                            <span className="text-sm">신뢰 점수</span>
                        </div>
                        <span className="text-sm font-bold text-green-600">
                            {profile?.trust_score ?? 50}점
                        </span>
                    </div>

                    {isPro && (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-indigo-500" />
                                <span className="text-sm">받은 리뷰</span>
                            </div>
                            <span className="text-sm text-gray-500">
                                {reviewCount}건
                            </span>
                        </div>
                    )}

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-blue-500" />
                            <span className="text-sm">동네 인증</span>
                        </div>
                        <span className="text-xs text-gray-400">
                            {profile?.location ? "인증 완료" : "미인증"}
                        </span>
                    </div>

                    {isPro && (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <BadgeCheck className="w-4 h-4 text-indigo-500" />
                                <span className="text-sm">프로 인증</span>
                            </div>
                            <span
                                className={`text-xs ${profile?.is_verified ? "text-green-600" : "text-gray-400"}`}
                            >
                                {profile?.is_verified ? "인증 완료" : "미인증"}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-4 space-y-2">
                <LocationVerify verified={!!profile?.location} />

                {isPro && (
                    <Link
                        href="/profile/verification"
                        className="block w-full text-center bg-indigo-500 text-white py-3 rounded-xl text-sm font-medium hover:bg-indigo-600 transition-colors"
                    >
                        {profile?.is_verified
                            ? "프로 인증 정보 수정"
                            : "프로 인증하기"}
                    </Link>
                )}
            </div>

            <form action={signOut} className="mt-6">
                <button
                    type="submit"
                    className="w-full text-red-500 py-3 rounded-xl text-sm font-medium border border-red-200 hover:bg-red-50 transition-colors"
                >
                    로그아웃
                </button>
            </form>
        </main>
    );
}
