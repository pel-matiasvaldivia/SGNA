"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from 'next/link';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      if ((session.user as any).role === "superadmin") {
        router.push("/dashboard/admin");
      } else {
        router.push("/dashboard");
      }
    }
  }, [session, status, router]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-muted/30">
      <div className="max-w-3xl text-center space-y-6 p-6">
        <h1 className="text-4xl md:text-6xl font-heading font-bold text-primary">
          PROMPT MAESTRO
        </h1>
        <p className="text-xl text-muted-foreground font-sans">
          Plataforma Multitenante de Gestión ISO & Huella de Carbono.
        </p>
        
        <div className="flex gap-4 justify-center mt-8">
          <Link 
            href="/login" 
            className="px-6 py-3 bg-primary text-primary-foreground rounded-md font-semibold hover:bg-primary/90 transition"
          >
            Iniciar Sesión
          </Link>
          <Link 
            href="/dashboard" 
            className="px-6 py-3 bg-surface text-foreground border border-border rounded-md font-semibold hover:bg-muted transition"
          >
            Ir al Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
