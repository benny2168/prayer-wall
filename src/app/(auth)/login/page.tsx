import { authOptions } from "@/lib/auth";
import LoginClient from "./LoginClient";

export default async function LoginPage() {
  const providers = authOptions.providers.map((p: any) => ({
    id: p.id,
    name: p.name,
    type: p.type,
  }));

  return <LoginClient providers={providers} localAdminUsername={process.env.LOCAL_ADMIN_USERNAME || "admin"} />;
}
