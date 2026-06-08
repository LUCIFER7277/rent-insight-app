// @ts-nocheck
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/referral-app/components/layout";
import { useOwnersStore } from "@/referral-app/lib/owners-store";
import { Search, Copy, Eye, EyeOff, Download, RotateCcw, ArrowLeft } from "lucide-react";
import { Input } from "@/referral-app/components/ui/input";
import { useToast } from "@/referral-app/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/referral-app/components/ui/table";

export default function ManagerCredentialsPage() {
  const [, setLocation] = useLocation();
  const { owners, rotatePassword } = useOwnersStore();
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [reveal, setReveal] = useState(false);

  const filtered = useMemo(() => {
    const s = q.toLowerCase().trim();
    const sorted = [...owners].sort((a, b) => a.name.localeCompare(b.name));
    if (!s) return sorted;
    return sorted.filter(
      (o) =>
        o.name.toLowerCase().includes(s) ||
        o.username.toLowerCase().includes(s) ||
        (o.phone || "").includes(s)
    );
  }, [owners, q]);

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copied` });
  };

  const exportCsv = () => {
    const rows = [
      ["id", "name", "role", "phone", "username", "password", "properties"],
      ...owners.map((o) => [
        o.id,
        o.name,
        o.role,
        o.phone,
        o.username,
        o.password,
        String(o.propertyIds.length),
      ]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "gharpayy-owner-credentials.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Layout>
      <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">
        <button
          onClick={() => setLocation("/manager/owners")}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" /> Back to owners
        </button>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-black font-display text-slate-900">
              IDs & Passwords
            </h1>
            <p className="text-slate-500 text-sm">
              Single source of truth for all {owners.length} owner accounts
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setReveal((r) => !r)}
              className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50"
            >
              {reveal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {reveal ? "Hide" : "Reveal"}
            </button>
            <button
              onClick={exportCsv}
              className="flex items-center gap-2 px-3 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, username, phone"
            className="pl-9 h-11 rounded-xl"
          />
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Owner</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Password</TableHead>
                <TableHead className="text-right">PGs</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((o) => (
                <CredentialRow key={o.id} o={o} globalReveal={reveal} />
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </Layout>
  );
}

function CredentialRow({ o, globalReveal }: { o: any; globalReveal: boolean }) {
  const [, setLocation] = useLocation();
  const { rotatePassword } = useOwnersStore();
  const { toast } = useToast();
  const [localReveal, setLocalReveal] = useState(false);
  
  const isRevealed = globalReveal || localReveal;

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copied` });
  };

  return (
    <TableRow>
      <TableCell>
        <button
          onClick={() => setLocation(`/manager/owners/${o.id}`)}
          className="font-bold text-slate-900 hover:text-primary text-left"
        >
          {o.name}
        </button>
        <div className="text-xs text-slate-400">{o.id}</div>
      </TableCell>
      <TableCell className="text-xs">{o.role}</TableCell>
      <TableCell className="text-xs">{o.phone || "—"}</TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <code className="text-xs">{o.username}</code>
          <button onClick={() => copy(o.username, "Username")} className="p-1 hover:bg-slate-100 rounded" title="Copy username">
            <Copy className="w-3 h-3 text-slate-400" />
          </button>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <code className="text-xs w-20 inline-block">
            {isRevealed ? o.password : "••••••••"}
          </code>
          <button onClick={() => setLocalReveal(r => !r)} className="p-1 hover:bg-slate-100 rounded" title={isRevealed ? "Hide" : "Reveal"}>
            {isRevealed ? <EyeOff className="w-3 h-3 text-slate-400" /> : <Eye className="w-3 h-3 text-slate-400" />}
          </button>
          <button onClick={() => copy(o.password, "Password")} className="p-1 hover:bg-slate-100 rounded" title="Copy password">
            <Copy className="w-3 h-3 text-slate-400" />
          </button>
          <button
            onClick={() => {
              rotatePassword(o.id);
              toast({ title: `Password rotated for ${o.name}` });
            }}
            className="p-1 hover:bg-slate-100 rounded"
            title="Rotate"
          >
            <RotateCcw className="w-3 h-3 text-slate-400" />
          </button>
        </div>
      </TableCell>
      <TableCell className="text-right text-xs font-bold">
        {o.propertyIds.length}
      </TableCell>
      <TableCell></TableCell>
    </TableRow>
  );
}
