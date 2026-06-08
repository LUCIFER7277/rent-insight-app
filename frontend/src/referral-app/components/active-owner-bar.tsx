// @ts-nocheck
import { useMemo, useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useOwnersStore } from "@/referral-app/lib/owners-store";
import { ChevronDown, Search, UserCheck, X, Building2, LogOut } from "lucide-react";

export function ActiveOwnerBar() {
  const [, setLocation] = useLocation();
  const { owners, activeOwnerId, setActiveOwner } = useOwnersStore();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const active = owners.find((o) => o.id === activeOwnerId);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const filtered = useMemo(() => {
    const s = q.toLowerCase().trim();
    const sorted = [...owners].sort(
      (a, b) => b.propertyIds.length - a.propertyIds.length
    );
    if (!s) return sorted.slice(0, 60);
    return sorted
      .filter(
        (o) =>
          o.name.toLowerCase().includes(s) ||
          o.username.toLowerCase().includes(s) ||
          (o.phone || "").includes(s)
      )
      .slice(0, 60);
  }, [owners, q]);

  const pick = (id: string) => {
    setActiveOwner(id);
    setOpen(false);
    setQ("");
  };

  return (
    <div
      ref={ref}
      className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 px-4 py-2 flex items-center gap-2 flex-wrap"
    >
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
        Acting as
      </span>

      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold border transition-colors ${
          active
            ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
            : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
        }`}
      >
        <UserCheck className="w-3.5 h-3.5" />
        <span className="truncate max-w-[160px]">
          {active ? active.name : "No owner selected"}
        </span>
        {active && (
          <span className="text-[10px] font-normal text-emerald-600/80">
            · {active.propertyIds.length} PGs
          </span>
        )}
        <ChevronDown className="w-3.5 h-3.5 opacity-60" />
      </button>

      {active && (
        <>
          <button
            onClick={() => setLocation(`/manager/owners/${active.id}`)}
            className="text-xs text-slate-500 hover:text-slate-900 underline underline-offset-2"
          >
            Open profile
          </button>
          <button
            onClick={() => setActiveOwner(null)}
            className="ml-auto flex items-center gap-1 text-xs text-slate-400 hover:text-red-500"
            title="Clear active owner"
          >
            <LogOut className="w-3 h-3" /> Exit
          </button>
        </>
      )}
      {!active && (
        <span className="ml-auto text-[11px] text-slate-400">
          Pick an owner to manage their inventory
        </span>
      )}

      {open && (
        <div className="absolute left-2 right-2 sm:left-4 sm:right-auto sm:w-[420px] top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden">
          <div className="p-2 border-b border-slate-100 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search 121 owners..."
              className="flex-1 outline-none text-sm py-1 bg-transparent"
            />
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded hover:bg-slate-100"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
          <div className="max-h-[55vh] overflow-y-auto">
            {filtered.map((o) => {
              const isActive = o.id === activeOwnerId;
              return (
                <button
                  key={o.id}
                  onClick={() => pick(o.id)}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between gap-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 ${
                    isActive ? "bg-emerald-50/60" : ""
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm truncate">
                        {o.name}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        {o.role}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2">
                      <span className="font-mono">@{o.username}</span>
                      <span className="flex items-center gap-0.5">
                        <Building2 className="w-3 h-3" />
                        {o.propertyIds.length}
                      </span>
                      {o.phone && <span>· {o.phone}</span>}
                    </div>
                  </div>
                  {isActive ? (
                    <span className="text-[10px] font-bold text-emerald-600">
                      ACTIVE
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-primary">
                      Switch →
                    </span>
                  )}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="text-center text-sm text-slate-400 py-6">
                No matches
              </div>
            )}
          </div>
          <div className="p-2 border-t border-slate-100 flex gap-2">
            <button
              onClick={() => {
                setOpen(false);
                setLocation("/manager/owners");
              }}
              className="flex-1 text-xs font-bold py-1.5 rounded-md border border-slate-200 hover:bg-slate-50"
            >
              All owners
            </button>
            <button
              onClick={() => {
                setOpen(false);
                setLocation("/manager/credentials");
              }}
              className="flex-1 text-xs font-bold py-1.5 rounded-md border border-slate-200 hover:bg-slate-50"
            >
              Credentials
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
