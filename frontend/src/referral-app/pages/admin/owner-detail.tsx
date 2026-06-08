// @ts-nocheck
import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Layout } from "@/referral-app/components/layout";
import { useOwnersStore, getOwnerProperties } from "@/referral-app/lib/owners-store";
import { ArrowLeft, Save, RotateCcw, UserCheck, Pencil, X, Check } from "lucide-react";
import { Input } from "@/referral-app/components/ui/input";
import { Badge } from "@/referral-app/components/ui/badge";
import { useToast } from "@/referral-app/hooks/use-toast";

export default function AdminOwnerDetailPage() {
  const [, params] = useRoute("/admin/owners/:id");
  const [, setLocation] = useLocation();
  const ownerId = params?.id || "";
  const { toast } = useToast();
  const {
    owners,
    activeOwnerId,
    setActiveOwner,
    updateOwner,
    rotatePassword,
    updateProperty,
    propertyOverrides,
  } = useOwnersStore();

  const owner = owners.find((o) => o.id === ownerId);
  const [draft, setDraft] = useState(() => ({ ...(owner || {}) }));
  const [editingPg, setEditingPg] = useState<string | null>(null);
  const [pgDraft, setPgDraft] = useState<any>({});

  if (!owner) {
    return (
      <Layout>
        <div className="p-6">Owner not found.</div>
      </Layout>
    );
  }

  const properties = getOwnerProperties(ownerId);
  const isActive = activeOwnerId === ownerId;

  const saveOwner = () => {
    updateOwner(ownerId, {
      name: draft.name,
      phone: draft.phone,
      email: draft.email,
      role: draft.role,
      username: draft.username,
      password: draft.password,
      notes: draft.notes,
    });
    toast({ title: "Owner updated" });
  };

  const startEditPg = (pg: any) => {
    setEditingPg(pg.id);
    setPgDraft({
      name: pg.name,
      actualName: pg.actualName,
      area: pg.area,
      gender: pg.gender,
      rooms: pg.rooms,
      foodType: pg.foodType,
      mealsIncluded: pg.mealsIncluded,
      single: pg.prices?.single ?? 0,
      double: pg.prices?.double ?? 0,
      triple: pg.prices?.triple ?? 0,
      deposit: pg.deposit,
      minStay: pg.minStay,
      mapsLink: pg.mapsLink,
    });
  };

  const savePg = (pgId: string) => {
    updateProperty(pgId, {
      name: pgDraft.name,
      actualName: pgDraft.actualName,
      area: pgDraft.area,
      gender: pgDraft.gender,
      rooms: pgDraft.rooms,
      foodType: pgDraft.foodType,
      mealsIncluded: pgDraft.mealsIncluded,
      deposit: pgDraft.deposit,
      minStay: pgDraft.minStay,
      mapsLink: pgDraft.mapsLink,
      prices: {
        single: Number(pgDraft.single) || 0,
        double: Number(pgDraft.double) || 0,
        triple: Number(pgDraft.triple) || 0,
        min: Math.min(...[pgDraft.single, pgDraft.double, pgDraft.triple].map(Number).filter((x) => x > 0), Infinity) || 0,
        max: Math.max(...[pgDraft.single, pgDraft.double, pgDraft.triple].map(Number)) || 0,
      },
    });
    setEditingPg(null);
    toast({ title: "Property updated" });
  };

  return (
    <Layout>
      <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto">
        <button
          onClick={() => setLocation("/admin/owners")}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" /> All owners
        </button>

        <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-black font-display text-slate-900">
                {owner.name}
              </h1>
              <p className="text-xs text-slate-500">
                ID: {owner.id} Â· {properties.length} properties
              </p>
            </div>
            <button
              onClick={() => {
                setActiveOwner(isActive ? null : ownerId);
                toast({
                  title: isActive
                    ? "Switched out"
                    : `Now acting as ${owner.name}`,
                });
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm ${
                isActive
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-primary text-white hover:bg-orange-600"
              }`}
            >
              <UserCheck className="w-4 h-4" />
              {isActive ? "Active role" : "Switch to this owner"}
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Display name" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} />
            <Field label="Phone" value={draft.phone} onChange={(v) => setDraft({ ...draft, phone: v })} />
            <Field label="Email" value={draft.email || ""} onChange={(v) => setDraft({ ...draft, email: v })} />
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Role</label>
              <select
                value={draft.role}
                onChange={(e) => setDraft({ ...draft, role: e.target.value })}
                className="mt-1 h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              >
                <option>Owner</option>
                <option>Manager</option>
                <option>Unassigned</option>
              </select>
            </div>
            <Field label="Username" value={draft.username} onChange={(v) => setDraft({ ...draft, username: v })} />
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Field label="Password" value={draft.password} onChange={(v) => setDraft({ ...draft, password: v })} />
              </div>
              <button
                onClick={() => {
                  rotatePassword(ownerId);
                  const fresh = useOwnersStore.getState().owners.find((o) => o.id === ownerId);
                  setDraft({ ...draft, password: fresh?.password || draft.password });
                  toast({ title: "Password rotated" });
                }}
                className="h-9 px-3 rounded-md border border-slate-200 text-xs font-bold flex items-center gap-1 hover:bg-slate-50"
                title="Generate new password"
              >
                <RotateCcw className="w-3 h-3" /> New
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Notes</label>
            <textarea
              value={draft.notes || ""}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              className="mt-1 w-full rounded-md border border-input bg-transparent p-2 text-sm min-h-[60px]"
              placeholder="Internal notes about this owner"
            />
          </div>

          <button
            onClick={saveOwner}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800"
          >
            <Save className="w-4 h-4" /> Save owner
          </button>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">
            Inventory ({properties.length})
          </h2>
          {properties.map((pg: any) => {
            const isEditing = editingPg === pg.id;
            const overridden = !!propertyOverrides[pg.id];
            return (
              <div
                key={pg.id}
                className="bg-white border border-slate-100 rounded-2xl p-4"
              >
                {!isEditing ? (
                  <div className="flex justify-between items-start gap-3 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-bold text-slate-900">{pg.name}</h3>
                        <Badge variant="outline" className="text-[10px]">
                          {pg.gender}
                        </Badge>
                        {overridden && (
                          <Badge className="bg-amber-100 text-amber-700 text-[10px]">
                            Edited
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        {pg.area} Â· {pg.rooms}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        S â‚¹{pg.prices?.single || 0} Â· D â‚¹{pg.prices?.double || 0} Â· T â‚¹{pg.prices?.triple || 0}
                      </p>
                    </div>
                    <button
                      onClick={() => startEditPg(pg)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-bold hover:bg-primary/20"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <Field label="Name" value={pgDraft.name} onChange={(v) => setPgDraft({ ...pgDraft, name: v })} />
                      <Field label="Actual name" value={pgDraft.actualName} onChange={(v) => setPgDraft({ ...pgDraft, actualName: v })} />
                      <Field label="Area" value={pgDraft.area} onChange={(v) => setPgDraft({ ...pgDraft, area: v })} />
                      <Field label="Gender" value={pgDraft.gender} onChange={(v) => setPgDraft({ ...pgDraft, gender: v })} />
                      <Field label="Rooms" value={pgDraft.rooms} onChange={(v) => setPgDraft({ ...pgDraft, rooms: v })} />
                      <Field label="Food type" value={pgDraft.foodType} onChange={(v) => setPgDraft({ ...pgDraft, foodType: v })} />
                      <Field label="Meals" value={pgDraft.mealsIncluded} onChange={(v) => setPgDraft({ ...pgDraft, mealsIncluded: v })} />
                      <Field label="Deposit" value={pgDraft.deposit} onChange={(v) => setPgDraft({ ...pgDraft, deposit: v })} />
                      <Field label="Min stay" value={pgDraft.minStay} onChange={(v) => setPgDraft({ ...pgDraft, minStay: v })} />
                      <Field label="Maps link" value={pgDraft.mapsLink} onChange={(v) => setPgDraft({ ...pgDraft, mapsLink: v })} />
                      <Field label="Single â‚¹" value={pgDraft.single} onChange={(v) => setPgDraft({ ...pgDraft, single: v })} />
                      <Field label="Double â‚¹" value={pgDraft.double} onChange={(v) => setPgDraft({ ...pgDraft, double: v })} />
                      <Field label="Triple â‚¹" value={pgDraft.triple} onChange={(v) => setPgDraft({ ...pgDraft, triple: v })} />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => savePg(pg.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700"
                      >
                        <Check className="w-3.5 h-3.5" /> Save
                      </button>
                      <button
                        onClick={() => setEditingPg(null)}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-50"
                      >
                        <X className="w-3.5 h-3.5" /> Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {properties.length === 0 && (
            <div className="text-center py-10 text-slate-400 text-sm">
              No properties assigned to this owner.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

function Field({ label, value, onChange }: { label: string; value: any; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs font-bold text-slate-500 uppercase">{label}</label>
      <Input
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1"
      />
    </div>
  );
}


