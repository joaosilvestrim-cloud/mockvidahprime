import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppTop from "@/components/app/AppTop";
import LoginForm from "@/components/LoginForm";

export const metadata = { title: "Entrar" };

export default async function EntrarPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/conta");
  return (
    <>
      <AppTop />
      <LoginForm />
    </>
  );
}
