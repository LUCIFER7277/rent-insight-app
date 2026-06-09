// @ts-nocheck
import { useAppStore, useOwnerStore } from "@/referral-app/lib/store";
import { useGetReferrerDashboard, useGetReferrerReferrals, useGetRealOwnerProperties } from "@/referral-app/api";
import { useLocation } from "wouter";
import { Layout } from "@/referral-app/components/layout";
import { LEVEL_NAMES, BADGE_ICONS, BADGE_DESCRIPTIONS } from "@/referral-app/lib/constants";
import { motion } from "framer-motion";
import { Skeleton } from "@/referral-app/components/ui/skeleton";
import { Badge as UiBadge } from "@/referral-app/components/ui/badge";
import { format } from "date-fns";
import { MapPin, Calendar, CheckCircle2, Clock, XCircle, Wallet, Share2, Copy, Target, Bell, LogOut, Building2, Mail, Phone, ChevronRight, ShieldCheck, Camera } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/referral-app/hooks/use-toast";

export default function ProfilePage() {
  const { persona, referrer, logout, setPersona } = useAppStore();
  const { isOwnerAuthenticated, ownerUser, ownerToken, logoutOwner } = useOwnerStore();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    logout();
    logoutOwner();
    setLocation("/");
  };
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data: dashboard, isLoading: isDashboardLoading } = useGetReferrerDashboard(referrer?.id);
  const { data: referrals, isLoading: isReferralsLoading } = useGetReferrerReferrals(referrer?.id);
  const { data: properties, isLoading: isPropsLoading } = useGetRealOwnerProperties(ownerToken);

  if (!persona && !isOwnerAuthenticated) {
    setLocation("/");
    return null;
  }

  if (isOwnerAuthenticated && ownerUser) {
    return (
      <Layout>
        <div className="p-4 md:p-6 space-y-8 max-w-3xl mx-auto pb-24">
          
          {/* Premium Header Profile Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative bg-white rounded-[2rem] overflow-hidden border border-slate-100 shadow-xl shadow-slate-200/40"
          >
            {/* Background Gradient Banner */}
            <div className="h-32 bg-gradient-to-br from-primary/90 via-orange-500 to-red-500 relative">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
              <div className="absolute top-4 right-4">
                <UiBadge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-md font-bold px-3 py-1">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
                  Verified Owner
                </UiBadge>
              </div>
            </div>

            {/* Profile Content */}
            <div className="px-6 pb-8 sm:px-8 relative">
              <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-end -mt-16 sm:-mt-12 mb-6">
                <div className="w-28 h-28 bg-white p-1.5 rounded-full shadow-lg relative z-10 shrink-0 group">
                  <div className="w-full h-full bg-gradient-to-br from-orange-50 to-orange-100 rounded-full flex items-center justify-center text-4xl font-bold font-display text-primary shadow-inner overflow-hidden border border-slate-100 relative">
                    {ownerUser.profileImage ? (
                      <img src={ownerUser.profileImage} alt={ownerUser.fullName} className="w-full h-full object-cover" />
                    ) : (
                      ownerUser.fullName?.charAt(0).toUpperCase() || 'O'
                    )}
                    
                    {/* Upload Overlay */}
                    <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-opacity backdrop-blur-sm">
                      <Camera className="w-6 h-6 mb-1" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Upload</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const base64 = event.target?.result;
                              if (base64) {
                                // @ts-ignore
                                useOwnerStore.getState().setOwnerAuth(ownerToken, { ...ownerUser, profileImage: base64 });
                                toast({ title: "Profile Image Updated", description: "Looking sharp!" });
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
                
                <div className="text-center sm:text-left flex-1 pt-2 sm:pt-0">
                  <h1 className="text-3xl font-black font-display text-slate-900 tracking-tight">{ownerUser.fullName}</h1>
                  <p className="text-primary font-bold text-sm tracking-wide uppercase mt-1">Property Owner</p>
                </div>
              </div>

              {/* Contact Information Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100/60 transition-colors hover:bg-slate-100/80">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-100 shrink-0">
                    <Mail className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Email Address</p>
                    <p className="text-sm font-semibold text-slate-700 truncate">{ownerUser.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100/60 transition-colors hover:bg-slate-100/80">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-100 shrink-0">
                    <Phone className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Phone Number</p>
                    <p className="text-sm font-semibold text-slate-700 truncate">{ownerUser.phone}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Properties Section */}
          <div className="space-y-5 relative z-10">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xl font-bold font-display text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                My Portfolio
              </h3>
              {properties && properties.length > 0 && (
                <span className="text-sm font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                  {properties.length} Properties
                </span>
              )}
            </div>

            {isPropsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Skeleton className="h-28 w-full rounded-2xl" />
                <Skeleton className="h-28 w-full rounded-2xl" />
              </div>
            ) : properties && properties.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {properties.map((p: any, i: number) => (
                  <motion.div 
                    key={p.id} 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="group relative bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-xl hover:shadow-orange-500/10 hover:border-orange-200 transition-all duration-300 overflow-hidden cursor-pointer"
                    onClick={() => setLocation(`/owner/properties/${p.id}/rooms`)}
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
                    
                    <div className="flex gap-4 items-start">
                      <div className="w-12 h-12 bg-white text-primary rounded-xl flex items-center justify-center shrink-0 border border-orange-100 shadow-sm shadow-orange-100">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0 pr-6">
                        <h4 className="font-bold text-slate-900 text-base line-clamp-1 group-hover:text-primary transition-colors">{p.name}</h4>
                        <div className="flex items-start gap-1 mt-1.5 text-slate-500">
                          <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
                          <p className="text-xs leading-relaxed line-clamp-2 font-medium">{p.address}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                      <div className="w-8 h-8 rounded-full bg-orange-50 text-primary flex items-center justify-center">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12 bg-white border border-slate-100 rounded-3xl border-dashed shadow-sm"
              >
                 <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                   <Building2 className="w-8 h-8 text-slate-300" />
                 </div>
                 <h4 className="text-lg font-bold text-slate-700 mb-2">No properties yet</h4>
                 <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">You haven't listed any properties in your portfolio yet.</p>
                 <button onClick={() => setLocation("/owner/properties/new")} className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-sm">
                   Add Property
                 </button>
              </motion.div>
            )}
          </div>
          
          {/* Logout Section */}
          <div className="pt-6">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border border-slate-200 text-slate-600 bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-100 font-bold transition-all shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!referrer) {
    setPersona(null as any);
    setLocation("/");
    return null;
  }

  const referralLink = `${window.location.origin}/profile/${referrer.referralCode}`;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({ title: "Profile link copied!", description: "Share it to refer people to PGs" });
    setTimeout(() => setCopied(false), 2000);
  };

  if (isDashboardLoading || isReferralsLoading || !dashboard) {
    return (
      <Layout>
        <div className="p-6 space-y-6">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </Layout>
    );
  }

  const levelName = LEVEL_NAMES[persona]?.[dashboard.referrer.level] || dashboard.referrer.level;
  const progressPercent = Math.min(100, Math.max(0, 
    ((dashboard.referrer.xp - dashboard.currentLevelXp) / 
    (dashboard.nextLevelXp - dashboard.currentLevelXp)) * 100
  ));

  const earnedBadgeIds = dashboard.badges.map(b => b.name);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'BOOKED': return 'bg-green-100 text-green-700 border-green-200';
      case 'VERIFIED': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'LOST': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-orange-100 text-orange-700 border-orange-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'BOOKED': return <CheckCircle2 className="w-3 h-3 mr-1" />;
      case 'LOST': return <XCircle className="w-3 h-3 mr-1" />;
      default: return <Clock className="w-3 h-3 mr-1" />;
    }
  };

  return (
    <Layout>
      <div className="p-4 md:p-6 space-y-6 max-w-3xl mx-auto">
        
        {/* Header Profile Section */}
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left bg-card p-6 rounded-3xl border border-border shadow-sm">
          <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center text-3xl font-bold font-display shadow-inner shrink-0">
            {dashboard.referrer.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-black font-display text-foreground mb-1">{dashboard.referrer.name}</h1>
            <p className="text-muted-foreground font-medium mb-1">{dashboard.referrer.phone} · {persona}</p>
            <div className="flex items-center gap-2 mb-4">
              <span className="font-mono text-xs bg-muted px-2 py-1 rounded-md text-slate-600">REF: {referrer.referralCode}</span>
              <button onClick={handleCopyLink} className="flex items-center gap-1 text-xs text-primary hover:underline font-medium">
                {copied ? <><CheckCircle2 className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy profile link</>}
              </button>
            </div>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <div className="bg-muted px-4 py-2 rounded-xl">
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">Rank</p>
                <p className="text-xl font-black text-foreground">#{dashboard.rank}</p>
              </div>
              <div className="bg-muted px-4 py-2 rounded-xl">
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">Level</p>
                <p className="text-xl font-black text-primary">{levelName}</p>
              </div>
              <div className="bg-muted px-4 py-2 rounded-xl">
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">Total Earned</p>
                <p className="text-xl font-black text-green-600">₹{dashboard.referrer.totalEarned}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setLocation("/payout-setup")}
            className="flex items-center gap-3 p-4 bg-card border border-border rounded-2xl hover:border-primary/50 hover:shadow-sm transition-all text-left">
            <Wallet className="w-5 h-5 text-primary" />
            <div>
              <p className="font-bold text-foreground text-sm">Payout Setup</p>
              <p className="text-xs text-muted-foreground">Add UPI / Bank</p>
            </div>
          </button>
          <button onClick={() => setLocation("/challenges")}
            className="flex items-center gap-3 p-4 bg-card border border-border rounded-2xl hover:border-primary/50 hover:shadow-sm transition-all text-left">
            <Target className="w-5 h-5 text-primary" />
            <div>
              <p className="font-bold text-foreground text-sm">Challenges</p>
              <p className="text-xs text-muted-foreground">Earn XP & bonuses</p>
            </div>
          </button>
          <button onClick={() => setLocation("/teams")}
            className="flex items-center gap-3 p-4 bg-card border border-border rounded-2xl hover:border-primary/50 hover:shadow-sm transition-all text-left">
            <Share2 className="w-5 h-5 text-primary" />
            <div>
              <p className="font-bold text-foreground text-sm">My Squad</p>
              <p className="text-xs text-muted-foreground">Join or create a team</p>
            </div>
          </button>
          <button onClick={() => setLocation("/notifications")}
            className="flex items-center gap-3 p-4 bg-card border border-border rounded-2xl hover:border-primary/50 hover:shadow-sm transition-all text-left">
            <Bell className="w-5 h-5 text-primary" />
            <div>
              <p className="font-bold text-foreground text-sm">Notifications</p>
              <p className="text-xs text-muted-foreground">Payouts & updates</p>
            </div>
          </button>
        </div>

        {/* Level Progress */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h3 className="font-bold text-foreground mb-1">Level Progress</h3>
              <p className="text-sm text-muted-foreground">{dashboard.referrer.xp} / {dashboard.nextLevelXp} XP</p>
            </div>
            <span className="text-sm font-bold text-primary">{dashboard.nextLevelXp - dashboard.referrer.xp} XP to go</span>
          </div>
          <div className="h-4 bg-muted rounded-full overflow-hidden border border-border/50">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ type: "spring", stiffness: 50, damping: 15 }}
              className="h-full bg-primary rounded-full relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 w-full h-full skew-x-12 animate-[shimmer_2s_infinite]" />
            </motion.div>
          </div>
        </div>

        {/* Badges Collection */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold font-display text-foreground">Badges Collection</h3>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
            {Object.entries(BADGE_ICONS).map(([name, icon], i) => {
              const isEarned = earnedBadgeIds.includes(name);
              return (
                <motion.div 
                  key={name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`
                    flex flex-col items-center p-3 rounded-xl border text-center transition-all
                    ${isEarned 
                      ? 'bg-primary/5 border-primary/20 hover:bg-primary/10 shadow-sm' 
                      : 'bg-muted/50 border-transparent opacity-50 grayscale'}
                  `}
                >
                  <span className="text-3xl mb-2">{icon}</span>
                  <span className="text-[10px] font-bold uppercase tracking-tight text-foreground leading-tight">
                    {name}
                  </span>
                  {isEarned && (
                    <span className="text-[9px] text-muted-foreground mt-1">Earned</span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Referrals List */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold font-display text-foreground">My Referrals</h3>
          
          {referrals && referrals.length > 0 ? (
            <div className="space-y-3">
              {referrals.map((ref, i) => (
                <motion.div 
                  key={ref.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-card border border-border p-4 rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-muted-foreground">{ref.referralId}</span>
                      <UiBadge variant="outline" className={`text-[10px] font-bold px-2 py-0.5 border ${getStatusColor(ref.status)}`}>
                        <span className="flex items-center">{getStatusIcon(ref.status)}{ref.status}</span>
                      </UiBadge>
                    </div>
                    <h4 className="font-bold text-foreground text-lg">{ref.leadName}</h4>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {ref.area || 'Any area'}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {format(new Date(ref.createdAt), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                  
                  <div className="flex sm:flex-col items-center sm:items-end justify-between bg-muted/50 sm:bg-transparent p-3 sm:p-0 rounded-lg">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest sm:mb-1">XP Earned</span>
                    <span className="font-black text-primary text-xl">+{ref.xpEarned}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-card border border-border rounded-2xl border-dashed">
              <p className="text-muted-foreground mb-4">You haven't made any referrals yet.</p>
              <button 
                onClick={() => setLocation("/refer")}
                className="bg-primary text-primary-foreground font-bold px-6 py-2 rounded-full hover:bg-primary/90 transition-colors"
              >
                Refer Someone Now
              </button>
            </div>
          )}
        </div>

        {/* Logout */}
        <div className="pb-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-red-200 text-red-500 bg-red-50 hover:bg-red-100 font-semibold transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Log out
          </button>
        </div>

      </div>
    </Layout>
  );
}

