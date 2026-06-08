// @ts-nocheck
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useOwnerStore } from "@/referral-app/lib/store";
import { Button } from "@/referral-app/components/ui/button";
import { Input } from "@/referral-app/components/ui/input";
import { toast } from "sonner";
import { Building2 } from "lucide-react";
import { motion } from "framer-motion";
import { useOwnerLogin } from "@/referral-app/api";

export default function OwnerLogin() {
  const [, setLocation] = useLocation();
  const { isOwnerAuthenticated, setOwnerAuth } = useOwnerStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  const loginMutation = useOwnerLogin();

  useEffect(() => {
    if (isOwnerAuthenticated) {
      const returnPath = window.location.pathname.startsWith("/app/owner") ? "/owner/dashboard" : "/manager/properties";
      setLocation(returnPath);
    }
  }, [isOwnerAuthenticated, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    
    try {
      const res = await loginMutation.mutateAsync({ username, password });
      if (res.success) {
        setOwnerAuth(res.data.accessToken, res.data.owner);
        toast.success("Welcome back!");
        const returnPath = window.location.pathname.startsWith("/app/owner") ? "/owner/dashboard" : "/manager/properties";
        setLocation(returnPath);
      } else {
        toast.error(res.message || "Invalid credentials");
      }
    } catch (err: any) {
      console.error("LOGIN ERROR:", err);
      toast.error(`Login error: ${err.message || String(err)}`);
    }
  };

  if (isOwnerAuthenticated) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm bg-white rounded-3xl p-8 border border-slate-200 shadow-xl"
      >
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6 mx-auto">
          <Building2 className="w-8 h-8" />
        </div>
        
        <h1 className="text-2xl font-bold font-display text-slate-900 text-center mb-2">Owner / Manager Login</h1>
        <p className="text-slate-500 text-center text-sm mb-8">Enter your credentials to manage your properties.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input 
              type="text" 
              placeholder="Username or Email" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="h-12 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-primary focus-visible:border-primary"
              autoFocus
            />
          </div>
          <div>
            <Input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-primary focus-visible:border-primary"
            />
          </div>
          <Button 
            type="submit" 
            className="w-full h-12 text-lg font-bold mt-2 hover:bg-orange-600 transition-colors" 
            disabled={!username || !password || loginMutation.isPending}
          >
            {loginMutation.isPending ? "Logging in..." : "Login"}
          </Button>
        </form>
        <div className="mt-8 text-center">
          <button onClick={() => setLocation("/")} className="text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors">
            Return to App
          </button>
        </div>
      </motion.div>
    </div>
  );
}
