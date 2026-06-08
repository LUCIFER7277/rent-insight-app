import { useGetAdminNotifications, useMarkAdminNotificationRead } from "@/referral-app/api";
import { Layout } from "@/referral-app/components/layout";
import { useAdminStore } from "@/referral-app/lib/store";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Bell, BellOff, CheckCheck, Building2, ChevronLeft } from "lucide-react";
import { useToast } from "@/referral-app/hooks/use-toast";
import { useEffect } from "react";
import { cn } from "@/referral-app/lib/utils";

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function AdminNotificationsPage() {
  const { isAdminAuthenticated } = useAdminStore();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (!isAdminAuthenticated) {
      setLocation("/app/admin");
    }
  }, [isAdminAuthenticated, setLocation]);

  const { data: notifications, isLoading, refetch } = useGetAdminNotifications();
  const markRead = useMarkAdminNotificationRead();

  const unread = (notifications || []).filter((n: any) => !n.isRead);

  const handleMarkAll = async () => {
    await markRead.mutateAsync();
    refetch();
    toast({ title: "All notifications cleared" });
  };

  if (!isAdminAuthenticated) return null;

  return (
    <Layout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => setLocation("/admin/dashboard")} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex-1 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black font-display text-slate-900 flex items-center gap-2">
                <Bell className="w-6 h-6 text-primary" /> Admin Alerts
              </h1>
              {unread.length > 0 && <p className="text-sm text-orange-600 font-medium mt-1">{unread.length} unread</p>}
            </div>
            {unread.length > 0 && (
              <button onClick={handleMarkAll} className="flex items-center gap-2 text-sm text-slate-500 hover:text-primary font-medium transition-colors">
                <CheckCheck className="w-4 h-4" /> Mark all read
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />)}
          </div>
        ) : (notifications || []).length === 0 ? (
          <div className="text-center py-16">
            <BellOff className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No alerts yet</p>
            <p className="text-slate-400 text-sm">We'll notify you when owners add or update properties.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {(notifications || []).map((n: any, i: number) => {
              return (
                <motion.div key={n.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className={cn(
                    "flex gap-4 p-4 rounded-2xl border transition-all hover:shadow-sm",
                    n.isRead ? "bg-white border-slate-100 opacity-70" : "bg-white border-orange-100 shadow-sm",
                  )}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-blue-100 text-blue-600">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 text-sm">{n.title}</p>
                    <p className="text-slate-500 text-sm leading-snug">{n.message}</p>
                    <p className="text-slate-400 text-xs mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.isRead && <div className="w-2.5 h-2.5 bg-primary rounded-full mt-1.5 shrink-0" />}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
