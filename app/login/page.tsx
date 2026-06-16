"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();

  if (!email.trim() || !password.trim()) {
    alert("Preencha email e senha.");
    return;
  }

  setLoading(true);

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  setLoading(false);

  if (error) {
    alert("Erro no login: " + error.message);
    return;
  }

  router.push("/ranking");
}

  return (
    <main className="min-h-screen bg-white text-zinc-950">
      <header className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
        <Link href="/" className="text-xl font-black">
          Baba<span className="text-green-600">Concept</span>
        </Link>

      
      </header>

      <section className="px-5 py-10">
        <div className="mx-auto max-w-md">
          <div className="text-center">
            <h1 className="text-3xl font-black">Bem vindo!</h1>
            <p className="mt-2 text-sm text-zinc-500">
              Faça login para continuar.
            </p>
          </div>

          <form onSubmit={handleLogin} className="mt-8 space-y-4">
            <div>
              <label className="text-sm font-bold text-zinc-700">
                Email
              </label>

              <input
                type="email"
                placeholder="Coloque seu Email"
                className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-4 outline-none focus:border-green-600"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-bold text-zinc-700">
                Senha
              </label>

              <input
                type="password"
                placeholder="Coloque sua Senha"
                className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-4 outline-none focus:border-green-600"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              disabled={loading}
              className="w-full rounded-xl bg-green-600 px-5 py-4 font-bold text-white shadow-md disabled:opacity-60"
            >
              {loading ? "Entrando..." : "Login"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-500">
            não tem uma conta?{" "}
            <Link href="/signup" className="font-bold text-green-600">
              Cadastrar
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}