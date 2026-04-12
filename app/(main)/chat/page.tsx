import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { MessageCircle } from "lucide-react";

export default async function ChatListPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/auth/login");

    const { data: rawRooms } = await supabase
        .from("chat_rooms")
        .select("*, requests(title, status)")
        .or(`neighbor_id.eq.${user.id},pro_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

    const seen = new Set<string>();
    const rooms = (rawRooms ?? []).filter((room) => {
        if (seen.has(room.request_id)) return false;
        seen.add(room.request_id);
        return true;
    });

    return (
        <main className="max-w-lg mx-auto px-4 pt-6">
            <h1 className="text-lg font-bold mb-6">채팅</h1>

            {!rooms || rooms.length === 0 ? (
                <div className="text-center py-20">
                    <MessageCircle className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">아직 채팅이 없어요</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {rooms.map((room) => {
                        const req = room.requests as {
                            title: string;
                            status: string;
                        } | null;
                        return (
                            <Link
                                key={room.id}
                                href={`/chat/${room.request_id}`}
                                className="flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm border border-gray-100"
                            >
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                    <MessageCircle className="w-5 h-5 text-blue-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                        {req?.title ?? "요청"}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {req?.status === "MATCHED"
                                            ? "진행중"
                                            : "완료"}
                                    </p>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </main>
    );
}
