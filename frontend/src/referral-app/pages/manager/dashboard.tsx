// @ts-nocheck
import { useAppStore } from "@/referral-app/lib/store";
import { useGetManagerStats, useGetManagerProperties } from "@/referral-app/api";
import { Layout } from "@/referral-app/components/layout";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Building2, TrendingUp, Users, Star, Plus, ArrowRight, BarChart2, Home } from "lucide-react";
import { Skeleton } from "@/referral-app/components/ui/skeleton";
import { useEffect } from "react";
import { Badge } from "@/referral-app/components/ui/badge";
import { useOwnersStore, getOwnerProperties } from "@/referral-app/lib/owners-store";

export default function ManagerDashPage() {
  const { referrer, persona } = useAppStore();
  const [, setLocation] = useLocation();
  const { activeOwnerId, owners } = useOwnersStore();

  useEffect(() => {
    if (!referrer) {
      setLocation("/owner/login");
      return;
    }
    if (persona !== "PG_MANAGER") {
      setLocation("/home");
    }
  }, [persona, referrer, setLocation]);

  if (!referrer || persona !== "PG_MANAGER") return null;

  const { data: stats, isLoading: statsLoading } = useGetManagerStats(referrer.id);
  const { data: properties, isLoading: propsLoading } = useGetManagerProperties(referrer.id);
  const activeOwner = owners.find((owner) => owner.id === activeOwnerId);
  const viewedProperties = activeOwnerId
    ? getOwnerProperties(activeOwnerId).map((pg: any, index: number) => ({
        id: pg.id,
        name: pg.name,
        area: pg.area,
        monthlyRent: pg.prices?.min || pg.prices?.single || pg.prices?.double || pg.prices?.triple || 0,
        availability: "AVAILABLE",
        availableRooms: Math.max(1, [pg.prices?.single, pg.prices?.double, pg.prices?.triple].filter((v: number) => v > 0).length),
        totalRooms: Number(String(pg.rooms || "").match(/(\d+)/)?.[1] || 12),
      }))
    : properties || [];

  if (statsLoading || propsLoading) {
    return (
      <Layout>
        <div className="p-6 space-y-4">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </div>
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </Layout>
    );
  }

  const s = stats || { occupancyRate: 0, occupiedRooms: 0, totalRooms: 0, totalProperties: 0, monthlyRevenue: 0, totalLeadsReceived: 0, totalBookings: 0, referralEarnings: 0 };
  const occupancyPct = Math.round(s.occupancyRate * 100);
  return (
    <Layout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black font-display text-slate-900">PG Dashboard</h1>
            <div className="text-slate-500 text-sm flex items-center gap-2 flex-wrap">
              <span>Welcome, {referrer.name}</span>
              {activeOwner && <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Acting as {activeOwner.name}</Badge>}
            </div>
          </div>
          <button onClick={() => setLocation("/manager/properties/new")}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-bold text-sm hover:bg-orange-600 transition-colors">
            <Plus className="w-4 h-4" /> Add PG
          </button>
        </div>

        {/* Occupancy highlight */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-3xl p-6 text-white shadow-xl shadow-blue-200">
          <p className="text-blue-200 font-bold text-sm uppercase tracking-wider mb-2">Overall Occupancy</p>
          <div className="flex items-end gap-4">
            <div className="text-6xl font-black">{occupancyPct}%</div>
            <div>
              <p className="text-blue-100">{activeOwner ? viewedProperties.reduce((sum, property) => sum + Math.max((property.totalRooms || 0) - (property.availableRooms || 0), 0), 0) : s.occupiedRooms} of {activeOwner ? viewedProperties.reduce((sum, property) => sum + (property.totalRooms || 0), 0) : s.totalRooms} rooms filled</p>
              <p className="text-blue-200 text-sm">{activeOwner ? viewedProperties.length : s.totalProperties} properties</p>
            </div>
          </div>
          <div className="mt-4 h-3 bg-blue-500/40 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${occupancyPct}%` }} transition={{ type: "spring", stiffness: 40 }}
              className="h-full bg-white rounded-full" />
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Monthly Revenue", value: `₹${s.monthlyRevenue.toLocaleString()}`, icon: "💰", color: "bg-green-50 border-green-100" },
            { label: "Total Leads", value: s.totalLeadsReceived, icon: "📥", color: "bg-orange-50 border-orange-100" },
            { label: "Total Bookings", value: s.totalBookings, icon: "🏠", color: "bg-purple-50 border-purple-100" },
            { label: "Referral Earnings", value: `₹${s.referralEarnings.toLocaleString()}`, icon: "🤝", color: "bg-yellow-50 border-yellow-100" },
          ].map((item, i) => (
            <motion.div key={item.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className={`${item.color} border rounded-2xl p-4`}>
              <p className="text-2xl mb-1">{item.icon}</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{item.label}</p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">{item.value}</p>
            </motion.div>
          ))}
        </div>

        {/* My Properties */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" /> My Properties
            </h2>
            <button onClick={() => setLocation("/manager/properties")}
              className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {!viewedProperties || viewedProperties.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No PGs listed yet</p>
              <button onClick={() => setLocation("/manager/properties/new")}
                className="mt-3 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-orange-600 transition-colors">
                + List your first PG
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {viewedProperties.slice(0, 4).map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div>
                    <p className="font-bold text-slate-800">{p.name}</p>
                    <p className="text-sm text-slate-500">{p.area} · ₹{p.monthlyRent.toLocaleString()}/mo</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${p.availability === "AVAILABLE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                      {p.availability === "AVAILABLE" ? `${p.availableRooms} free` : "FULL"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setLocation("/pg")}
            className="flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-2xl hover:border-orange-200 transition-all text-left">
            <Home className="w-5 h-5 text-primary" />
            <div>
              <p className="font-bold text-slate-800 text-sm">Browse PGs</p>
              <p className="text-xs text-slate-500">Route overflow leads</p>
            </div>
          </button>
          <button onClick={() => setLocation("/refer")}
            className="flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-2xl hover:border-orange-200 transition-all text-left">
            <Users className="w-5 h-5 text-primary" />
            <div>
              <p className="font-bold text-slate-800 text-sm">Submit Lead</p>
              <p className="text-xs text-slate-500">Refer to another PG</p>
            </div>
          </button>
        </div>
      </div>
    </Layout>
  );
}
