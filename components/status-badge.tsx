import { RequestStatus } from "@/types/database";

const statusConfig: Record<RequestStatus, { label: string; color: string }> = {
    OPEN: { label: "대기중", color: "bg-yellow-100 text-yellow-700" },
    PENDING: { label: "제안됨", color: "bg-orange-100 text-orange-700" },
    MATCHED: { label: "진행중", color: "bg-blue-100 text-blue-700" },
    COMPLETED: { label: "완료", color: "bg-green-100 text-green-700" },
};

export default function StatusBadge({ status }: { status: RequestStatus }) {
    const config = statusConfig[status];
    return (
        <span
            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}
        >
            {config.label}
        </span>
    );
}
