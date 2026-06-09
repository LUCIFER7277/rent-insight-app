import { Layout } from "@/referral-app/components/layout";
import { Package, Building2, MapPin, Users, CheckCircle2, Lock, ChevronRight } from "lucide-react";
import { useGetRealOwnerProperties, useGetRealOwnerRooms } from "@/referral-app/api";
import { useOwnerStore } from "@/referral-app/lib/store";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Skeleton } from "@/referral-app/components/ui/skeleton";

export default function OwnerInventoryPage() {
  const { ownerToken } = useOwnerStore();
  const { data: properties, isLoading: isPropsLoading } = useGetRealOwnerProperties(ownerToken);
  const { data: roomsData, isLoading: isRoomsLoading } = useGetRealOwnerRooms(ownerToken);

  const isLoading = isPropsLoading || isRoomsLoading;

  return (
    <Layout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black font-display text-slate-900 flex items-center gap-2">
              <Package className="w-6 h-6 text-primary" /> Inventory
            </h1>
            <p className="text-slate-500 mt-1">Manage room stock and availability across your properties.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        ) : !properties || properties.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center">
            <Building2 className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800">No Properties Found</h2>
            <p className="text-slate-500 mt-2 max-w-md mx-auto">
              You don't have any properties listed yet. Contact support to onboard your properties.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {properties.map((property: any, idx: number) => {
              // Calculate stats from rooms data if available
              let occupied = 0;
              let vacant = 0;
              let blocked = 0;

              if (roomsData?.roomStatuses) {
                const propStatuses = roomsData.roomStatuses.filter((s: any) => {
                  const room = roomsData.rooms.find((r: any) => (r.customId || r._id) === s.roomId);
                  return room && (room.propertyId === property.id);
                });
                
                occupied = propStatuses.filter((s: any) => s.kind === "occupied" || s.kind === "vacating").length;
                vacant = propStatuses.filter((s: any) => s.kind === "vacant" && !s.lockedUnsellable).length;
                blocked = propStatuses.filter((s: any) => s.lockedUnsellable || s.kind === "blocked").length;
              }

              return (
                <Link key={property.id} href={`/owner/properties/${property.id}/rooms`}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.1 }}
                    className="group bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 transition-all cursor-pointer relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                  >
                    {/* Hover Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                    {/* Property Details (Left side) */}
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-14 h-14 shrink-0 bg-orange-50 rounded-xl flex items-center justify-center text-primary border border-orange-100/50">
                        <Building2 className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-800 line-clamp-1 group-hover:text-primary transition-colors">{property.name}</h3>
                        <div className="flex items-center gap-1.5 text-slate-500 text-sm mt-1 line-clamp-1">
                          <MapPin className="w-4 h-4 shrink-0" />
                          <span>{property.address}</span>
                        </div>
                      </div>
                    </div>

                    {/* Stats and Chevron (Right side) */}
                    <div className="flex items-center gap-6 w-full md:w-auto mt-2 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100">
                          <Users className="w-4 h-4 text-green-600" />
                          <span className="font-bold text-green-700">{occupied}</span>
                          <span className="text-xs font-semibold text-green-600 uppercase">Occ</span>
                        </div>
                        
                        <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                          <CheckCircle2 className="w-4 h-4 text-blue-600" />
                          <span className="font-bold text-blue-700">{vacant}</span>
                          <span className="text-xs font-semibold text-blue-600 uppercase">Vac</span>
                        </div>

                        <div className="flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
                          <Lock className="w-4 h-4 text-red-600" />
                          <span className="font-bold text-red-700">{blocked}</span>
                          <span className="text-xs font-semibold text-red-600 uppercase">Blk</span>
                        </div>
                      </div>

                      <div className="hidden md:flex w-10 h-10 rounded-full bg-slate-50 items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
