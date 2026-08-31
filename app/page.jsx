import { createClient } from "@/lib/supabase/server";
import Landing from "@/components/Landing";

export const revalidate = 60; // ISR: salas atualizam a cada 60s

export default async function Home() {
  const supabase = createClient();

  const { data: rooms } = await supabase
    .from("rooms")
    .select("id,slug,name,category,description,price_hour,available,accent,icon,specialties,image_url")
    .order("sort", { ascending: true });

  let account = null;
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name,status,role")
      .eq("id", user.id)
      .single();
    account = profile || null;
  }

  return <Landing rooms={rooms || []} account={account} />;
}
