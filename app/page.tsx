import Link from "next/link";
import { MapPin, Users, Zap } from "lucide-react";

export default function HomePage() {
    return (
        <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
            <div className="max-w-sm w-full text-center space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        프로이웃
                    </h1>
                    <p className="mt-2 text-gray-500 text-sm">
                        우리 동네 신뢰할 수 있는 이웃과 연결해요
                    </p>
                </div>

                <div className="space-y-3 text-left">
                    <div className="flex items-start gap-3 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <MapPin className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-sm font-medium">반경 1km 매칭</p>
                            <p className="text-xs text-gray-400">
                                진짜 가까운 이웃과만 연결
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <Users className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-sm font-medium">
                                신원 인증된 프로
                            </p>
                            <p className="text-xs text-gray-400">
                                믿을 수 있는 동네 전문가
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <Zap className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-sm font-medium">실시간 매칭</p>
                            <p className="text-xs text-gray-400">
                                요청하면 바로 연결돼요
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Link
                        href="/auth/signup"
                        className="block w-full bg-blue-500 text-white py-3 rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors"
                    >
                        시작하기
                    </Link>
                    <Link
                        href="/auth/login"
                        className="block w-full bg-white text-gray-700 py-3 rounded-xl text-sm font-medium border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                        로그인
                    </Link>
                </div>
            </div>
        </main>
    );
}
