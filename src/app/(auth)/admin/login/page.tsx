import { authOptions } from "@/lib/auth";
import SignInButtons from "./SignInButtons";

export default async function LoginPage() {
  const providers = authOptions.providers.map((p: any) => ({
    id: p.id,
    name: p.name,
    type: p.type,
  }));

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[--color-bg-base] relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] max-w-2xl max-h-2xl rounded-full bg-theme-500/10 blur-[120px] pointer-events-none" />
      
      <div className="glass-card w-full max-w-md p-8 relative z-10 text-center">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[--color-text-base] mb-2">Admin Login</h1>
          <p className="text-[--color-text-muted]">Sign in with Planning Center to access the Prayer Wall dashboard.</p>
        </div>
        
        <SignInButtons providers={providers} />
        
        <div className="mt-8 pt-6 border-t border-[--color-border-base] text-sm text-[--color-text-muted]">
          <p>This area is restricted to authorized personnel only.</p>
        </div>
      </div>
    </div>
  );
}
