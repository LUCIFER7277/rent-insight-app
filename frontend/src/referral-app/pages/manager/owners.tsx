// @ts-nocheck
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/referral-app/components/layout";
import { useOwnersStore } from "@/referral-app/lib/owners-store";
import { Search, Building2, Phone, ChevronRight, KeyRound, UserCheck } from "lucide-react";
import { Input } from "@/referral-app/components/ui/input";
import { Badge } from "@/referral-app/components/ui/badge";

export default function ManagerOwnersPage() {
  const [, setLocation] = useLocation();
  const { owners, activeOwnerId, setActiveOwner } = useOwnersStore();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.toLowerCase().trim();
    const sorted = [...owners].sort(
      (a, b) => b.propertyIds.length - a.propertyIds.length
    );
    if (!s) return sorted;
    return sorted.filter(
      (o) =>
        o.name.toLowerCase().includes(s) ||
        o.username.toLowerCase().includes(s) ||
        (o.phone || "").includes(s)
    );
  }, [owners, q]);

  return (
    <Layout>
      <div className="p-4 md:p-6 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-black font-display text-slate-900">
              Property Owners
            </h1>
            <p className="text-slate-500 text-sm">
              {owners.length} owners · {owners.reduce((a, o) => a + o.propertyIds.length, 0)} properties · Switch role to manage their inventory
            </p>
          </div>
          <button
            onClick={() => setLocation("/manager/credentials")}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800"
          >
            <KeyRound className="w-4 h-4" /> IDs & Passwords
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search owners by name, username, or phone"
            className="pl-9 h-11 rounded-xl"
          />
        </div>

        <div className="grid gap-3">
          {filtered.map((o) => {
            const active = o.id === activeOwnerId;
            return (
              <div
                key={o.id}
                className={`bg-white border rounded-2xl p-4 transition-all ${
                  active ? "border-primary ring-2 ring-primary/30" : "border-slate-100 hover:shadow-md"
                }`}
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-bold text-slate-900 text-base truncate">
                        {o.name}
                      </h3>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          o.role === "Owner"
                            ? "text-emerald-600 border-emerald-200"
                            : o.role === "Manager"
                            ? "text-blue-600 border-blue-200"
                            : "text-slate-500 border-slate-200"
                        }`}
                      >
                        {o.role}
                      </Badge>
                      {active && (
                        <Badge className="bg-primary text-white text-[10px]">
                          Active
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" /> {o.propertyIds.length} properties
                      </span>
                      {o.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {o.phone}
                        </span>
                      )}
                      <span className="font-mono text-slate-400">@{o.username}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setActiveOwner(o.id);
                        setLocation(`/manager/owners/${o.id}`);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-bold hover:bg-primary/20"
                    >
                      <UserCheck className="w-3.5 h-3.5" /> Switch & manage
                    </button>
                    <button
                      onClick={() => setLocation(`/manager/owners/${o.id}`)}
                      className="p-2 rounded-lg hover:bg-slate-100"
                      title="Open"
                    >
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-sm">No matches</div>
          )}
        </div>
      </div>
    </Layout>
  );
}
