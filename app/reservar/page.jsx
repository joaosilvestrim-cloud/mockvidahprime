import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppTop from "@/components/app/AppTop";
import Booking from "@/components/Booking";

export const metadata = { title: "Reservar" };

export default async function ReservarPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: profile } = await supabase.from("profiles").select("status,role").eq("id", user.id).single();
  if (!profile || profile.status === "incomplete") redirect("/cadastro");
  if (profile.status !== "approved") redirect("/conta");

  const { data: rooms } = await supabase
    .from("rooms")
    .select("id,name,category,description,price_hour,available,accent,icon")
    .eq("available", true)
    .order("sort", { ascending: true });

  return (
    <>
      <AppTop />
      <Booking rooms={rooms || []} />
    </>
  );
}
