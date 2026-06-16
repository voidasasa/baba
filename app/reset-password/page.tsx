"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [checkingUser, setCheckingUser] = useState(true);

  async function checkUser() {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      router.replace("/login");
      return;
    }

    setCheckingUser(false);
  }

  async function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password.length < 6) {
      alert("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      alert("As senhas não são iguais.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (error) {
      alert("Erro ao trocar senha: " + error.message);
      return;
    }

    alert("Senha alterada com sucesso!");
    router.push("/profile");
  }

  useEffect(() => {
    checkUser();
  }, []);

  if (checkingUser) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-zinc-500">Verificando usuário...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-zinc-950">
      <header className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
        <Link href="/ranking" className="text-xl font-black">
          Baba<span className="text-green-600">Concept</span>
        </Link>

        <Link href="/profile" className="text-sm font-bold text-zinc-500">
          Perfil
        </Link>
      </header>

      <section className="px-5 py-10">
        <div className="mx-auto max-w-md">
          <Link
            href="/profile"
            className="inline-block rounded-xl bg-zinc-100 px-4 py-2 text-sm font-bold"
          >
            ← Voltar
          </Link>

          <div className="mt-6 rounded-3xl border border-zinc-100 bg-white p-5 shadow-sm">
            <h1 className="text-3xl font-black">Trocar senha</h1>

            <p className="mt-2 text-sm text-zinc-500">
              Digite sua nova senha abaixo.
            </p>

            <form onSubmit={handleResetPassword} className="mt-8 space-y-4">
              <div>
                <label className="text-sm font-bold text-zinc-700">
                  Nova senha
                </label>

                <input
                  type="password"
                  placeholder="Digite a nova senha"
                  className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-4 outline-none focus:border-green-600"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-bold text-zinc-700">
                  Confirmar senha
                </label>

                <input
                  type="password"
                  placeholder="Confirme a nova senha"
                  className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-4 outline-none focus:border-green-600"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <button
                disabled={loading}
                className="w-full rounded-xl bg-green-600 px-5 py-4 font-bold text-white shadow-md disabled:opacity-60"
              >
                {loading ? "Salvando..." : "Salvar nova senha"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}