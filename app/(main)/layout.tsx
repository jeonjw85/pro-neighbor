import BottomNav from "@/components/bottom-nav";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen pb-16">
            {children}
            <BottomNav />
        </div>
    );
}
