import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppTop from "@/components/app/AppTop";
import Conta from "@/components/Conta";

export const metadata = { title: "Minha conta" };

export default async function ContaPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile || profile.status === "incomplete") redirect("/cadastro");
  if (profile.role === "admin") redirect("/admin");

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id,use_mode,status,total,payment_method,created_at,rooms(name,icon,accent),booking_slots(start_at,end_at,status)")
    .order("created_at", { ascending: false });

  const { data: credits } = await supabase
    .from("credits")
    .select("amount,expires_at,used")
    .eq("used", false)
    .gt("expires_at", new Date().toISOString());

  const { data: contract } = await supabase
    .from("contracts")
    .select("signed_url,provider,status,created_at")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <>
      <AppTop />
      <Conta profile={profile} bookings={bookings || []} credits={credits || []} contract={contract} />
    </>
  );
}
