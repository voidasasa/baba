"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ChangeNamePage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadUserName() {
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      router.replace("/login");
      return;
    }

    const { data, error } = await supabase
      .from("players")
      .select("name")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (error) {
      alert("Erro ao carregar nome: " + error.message);
      setLoading(false);
      return;
    }

    setName(data?.name || "");
    setLoading(false);
  }

  async function handleChangeName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const newName = name.trim();

    if (newName.length < 2) {
      alert("Digite um nome válido.");
      return;
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      router.replace("/login");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("players")
      .update({
        name: newName,
      })
      .eq("user_id", userData.user.id);

    setSaving(false);

    if (error) {
      alert("Erro ao trocar nome: " + error.message);
      return;
    }

    alert("Nome alterado com sucesso!");
    router.push("/profile");
  }

  useEffect(() => {
    loadUserName();
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-zinc-500">Carregando...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-zinc-950">
      <header className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
        <Link href="/profile" className="text-xl font-black">
          Baba<span className="text-green-600">Concept</span>
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
            <h1 className="text-3xl font-black">Trocar nome</h1>

            <form onSubmit={handleChangeName} className="mt-8 space-y-4">
              <div>
                <label className="text-sm font-bold text-zinc-700">
                  Digite seu nome
                </label>

                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Digite seu nome"
                  className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-4 outline-none focus:border-green-600"
                />
              </div>

              <button
                disabled={saving}
                className="w-full rounded-xl bg-green-600 px-5 py-4 font-bold text-white shadow-md disabled:opacity-60"
              >
                {saving ? "Salvando..." : "Confirmar"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}