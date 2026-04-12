"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/components/toast";
import type { Chat } from "@/types/database";

export default function ChatMessages({
    requestId,
    userId,
    initialMessages,
}: {
    requestId: string;
    userId: string;
    initialMessages: Chat[];
}) {
    const supabase = createClient();
    const [messages, setMessages] = useState<Chat[]>(initialMessages);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        const channel = supabase
            .channel(`chat-${requestId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "chats",
                    filter: `request_id=eq.${requestId}`,
                },
                (payload) => {
                    const newMsg = payload.new as Chat;
                    setMessages((prev) => {
                        if (prev.some((m) => m.id === newMsg.id)) return prev;
                        return [...prev, newMsg];
                    });
                },
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [requestId, supabase]);

    async function handleSend(e: React.FormEvent) {
        e.preventDefault();
        const text = input.trim();
        if (!text || sending) return;

        setSending(true);
        setInput("");

        const { data, error } = await supabase
            .from("chats")
            .insert({
                request_id: requestId,
                sender_id: userId,
                message: text,
            })
            .select()
            .single();

        if (error) {
            toast("메시지 전송에 실패했어요", "error");
            setInput(text);
        } else if (data) {
            setMessages((prev) => {
                if (prev.some((m) => m.id === data.id)) return prev;
                return [...prev, data as Chat];
            });
        }

        setSending(false);
    }

    return (
        <>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-gray-50">
                {messages.length === 0 && (
                    <p className="text-center text-gray-400 text-xs py-10">
                        대화를 시작해보세요!
                    </p>
                )}
                {messages.map((msg) => {
                    const isMine = msg.sender_id === userId;
                    return (
                        <div
                            key={msg.id}
                            className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                                    isMine
                                        ? "bg-blue-500 text-white rounded-br-md"
                                        : "bg-white text-gray-800 border border-gray-100 rounded-bl-md"
                                }`}
                            >
                                {msg.message}
                                <p
                                    className={`text-[10px] mt-1 ${isMine ? "text-blue-200" : "text-gray-300"}`}
                                >
                                    {new Date(
                                        msg.created_at,
                                    ).toLocaleTimeString("ko-KR", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </p>
                            </div>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            <form
                onSubmit={handleSend}
                className="flex items-center gap-2 px-4 py-3 border-t border-gray-100 bg-white"
            >
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="메시지 입력..."
                    className="flex-1 px-4 py-2.5 rounded-full border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                    type="submit"
                    disabled={sending || !input.trim()}
                    className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                    <Send className="w-4 h-4" />
                </button>
            </form>
        </>
    );
}
