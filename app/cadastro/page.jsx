import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppTop from "@/components/app/AppTop";
import Onboarding from "@/components/Onboarding";

export const metadata = { title: "Cadastro" };

export default async function CadastroPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let initial = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id,full_name,email,phone,cpf,council_type,council_number,area,status")
      .eq("id", user.id)
      .single();
    // já enviou o cadastro / aprovado / bloqueado → vai para a conta
    if (profile && ["pending", "approved", "blocked"].includes(profile.status)) redirect("/conta");
    initial = profile ? { ...profile } : { id: user.id, email: user.email };
  }

  return (
    <>
      <AppTop />
      <Onboarding initial={initial} />
    </>
  );
}
