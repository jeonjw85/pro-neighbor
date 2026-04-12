import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import ChatMessages from "./chat-messages";

export default async function ChatRoomPage({
    params,
}: {
    params: Promise<{ requestId: string }>;
}) {
    const { requestId } = await params;
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/auth/login");

    const { data: room } = await supabase
        .from("chat_rooms")
        .select("*")
        .eq("request_id", requestId)
        .or(`neighbor_id.eq.${user.id},pro_id.eq.${user.id}`)
        .limit(1)
        .maybeSingle();

    if (!room) {
        const { data: req } = await supabase
            .from("requests")
            .select("client_id, matched_pro_id, status")
            .eq("id", requestId)
            .single();

        if (
            !req ||
            req.status === "OPEN" ||
            req.status === "PENDING" ||
            (user.id !== req.client_id && user.id !== req.matched_pro_id)
        ) {
            notFound();
        }

        if (req.matched_pro_id) {
            await supabase.from("chat_rooms").upsert(
                {
                    request_id: requestId,
                    neighbor_id: req.client_id,
                    pro_id: req.matched_pro_id,
                },
                { onConflict: "request_id" },
            );
        }
    }

    const { data: request } = await supabase
        .from("requests")
        .select("title")
        .eq("id", requestId)
        .single();

    const { data: messages } = await supabase
        .from("chats")
        .select("*")
        .eq("request_id", requestId)
        .order("created_at", { ascending: true });

    return (
        <main className="flex flex-col h-screen max-w-lg mx-auto">
            <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white">
                <Link
                    href="/chat"
                    className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center"
                >
                    <ArrowLeft className="w-4 h-4" />
                </Link>
                <h1 className="text-sm font-bold truncate">
                    {request?.title ?? "채팅"}
                </h1>
            </header>

            <ChatMessages
                requestId={requestId}
                userId={user.id}
                initialMessages={messages ?? []}
            />
        </main>
    );
}
