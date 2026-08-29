import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppTop from "@/components/app/AppTop";
import Admin from "@/components/Admin";

export const metadata = { title: "Administração", robots: { index: false } };

export default async function AdminPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") redirect("/conta");

  const { data: pendings } = await supabase
    .from("profiles").select("id,full_name,area,council_type,council_number,created_at,documents(kind)")
    .eq("status", "pending").order("created_at", { ascending: true });

  const { data: professionals } = await supabase
    .from("profiles").select("id,full_name,area,council_type,council_number,status,created_at")
    .eq("role", "professional").order("created_at", { ascending: false }).limit(200);

  const start = new Date(); start.setHours(0,0,0,0);
  const end = new Date(start); end.setDate(end.getDate()+1);
  const { data: todaySlots } = await supabase
    .from("booking_slots")
    .select("start_at,end_at,room_id,rooms(name),bookings(use_mode,profiles(full_name,area))")
    .eq("status","reserved").gte("start_at", start.toISOString()).lt("start_at", end.toISOString())
    .order("start_at", { ascending: true });

  const { data: rooms } = await supabase.from("rooms").select("id,name,category,available,accent,icon").order("sort");

  return (
    <>
      <AppTop />
      <Admin pendings={pendings||[]} professionals={professionals||[]} todaySlots={todaySlots||[]} rooms={rooms||[]} />
    </>
  );
}
