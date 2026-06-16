"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Player = {
  id: string;
  name: string;
  nickname: string | null;
  photo_url: string | null;
  goals: number;
  matches: number;
  region: string | null;
  house: string | null;
  email: string | null;
  user_id: string | null;
  quote_text: string | null;
  about_text: string | null;
};

export default function ProfilePage() {
  const router = useRouter();

  const [player, setPlayer] = useState<Player | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [loading, setLoading] = useState(true);

  const [quoteText, setQuoteText] = useState("");
  const [aboutText, setAboutText] = useState("");
  const [savingTexts, setSavingTexts] = useState(false);

  function getAvatarUrl() {
    return (
      player?.photo_url ||
      `https://placehold.co/200x200?text=${player?.name?.[0] || "P"}`
    );
  }

  async function loadProfile() {
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      router.replace("/login");
      return;
    }

    setUserEmail(userData.user.email || null);

    const { data, error } = await supabase
      .from("players")
      .select(
        "id, name, nickname, photo_url, goals, matches, region, house, email, user_id, quote_text, about_text"
      )
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (error) {
      alert("Erro ao carregar perfil: " + error.message);
      setLoading(false);
      return;
    }

    setPlayer(data);

    // Deixa vazio no formulário se o usuário ainda não escreveu nada.
    setQuoteText(data?.quote_text || "");
    setAboutText(data?.about_text || "");

    setLoading(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  async function changeProfilePhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];

    if (!file) return;

    input.value = "";

    if (!player) {
      alert("Nenhum jogador encontrado para atualizar a foto.");
      return;
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      router.replace("/login");
      return;
    }

    try {
      setUploadingPhoto(true);

      const fileExt = file.name.split(".").pop() || "jpg";
      const fileName = `${userData.user.id}-${Date.now()}.${fileExt}`;
      const filePath = `players/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("player-photos")
        .upload(filePath, file);

      if (uploadError) {
        alert("Erro ao enviar foto: " + uploadError.message);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("player-photos")
        .getPublicUrl(filePath);

      const photoUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("players")
        .update({
          photo_url: photoUrl,
        })
        .eq("user_id", userData.user.id);

      if (updateError) {
        alert(
          "Foto enviada, mas erro ao atualizar perfil: " + updateError.message
        );
        return;
      }

      setPlayer({
        ...player,
        photo_url: photoUrl,
      });

      alert("Foto atualizada com sucesso!");
    } catch (err) {
      if (err instanceof Error) {
        alert("Erro: " + err.message);
      } else {
        alert("Erro desconhecido ao trocar foto.");
      }
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function saveProfileTexts() {
    if (!player) {
      alert("Nenhum jogador encontrado.");
      return;
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      router.replace("/login");
      return;
    }

    setSavingTexts(true);

    const { error } = await supabase
      .from("players")
      .update({
        quote_text: quoteText.trim() || null,
        about_text: aboutText.trim() || null,
      })
      .eq("user_id", userData.user.id);

    setSavingTexts(false);

    if (error) {
      alert("Erro ao salvar textos: " + error.message);
      return;
    }

    setPlayer({
      ...player,
      quote_text: quoteText.trim() || null,
      about_text: aboutText.trim() || null,
    });

    alert("Perfil atualizado com sucesso!");
  }

  async function deleteAccount() {
  const confirmDelete = confirm(
    "Tem certeza que deseja deletar sua conta? Essa ação não pode ser desfeita."
  );

  if (!confirmDelete) return;

  const secondConfirm = confirm(
    "Confirme novamente: sua conta, perfil e dados serão removidos."
  );

  if (!secondConfirm) return;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    router.replace("/");
    return;
  }

  setDeletingAccount(true);

  try {
    const response = await fetch("/api/delete-account", {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      alert(result.error || "Erro ao deletar conta.");
      return;
    }

    await supabase.auth.signOut();

    alert("Conta deletada com sucesso.");

    router.replace("/");
  } catch (err) {
    if (err instanceof Error) {
      alert("Erro ao deletar conta: " + err.message);
    } else {
      alert("Erro desconhecido ao deletar conta.");
    }
  } finally {
    setDeletingAccount(false);
  }
}

  useEffect(() => {
    loadProfile();
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-zinc-500">Carregando perfil...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-zinc-950">
      <header className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
        <Link href="/ranking" className="text-xl font-black">
          Baba<span className="text-green-600">Concept</span>
        </Link>

        <button
          onClick={logout}
          className="rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-600"
        >
          Sair
        </button>
      </header>

      <section className="px-5 py-6">
        <Link
          href="/ranking"
          className="inline-block rounded-xl bg-zinc-100 px-4 py-2 text-sm font-bold"
        >
          ← Voltar
        </Link>

        <div className="mt-6 rounded-3xl border border-zinc-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <img
              src={getAvatarUrl()}
              alt={player?.name || "Player"}
              className="h-24 w-24 rounded-full border-4 border-green-600 bg-zinc-200 object-cover"
              onError={(e) => {
                e.currentTarget.src = `https://placehold.co/200x200?text=${
                  player?.name?.[0] || "P"
                }`;
              }}
            />

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-2xl font-black">
                {player?.name || "Usuário sem jogador"}
              </h1>

              {player?.nickname && (
                <p className="text-sm text-zinc-500">
                  &quot;{player.nickname}&quot;
                </p>
              )}

              <p className="mt-1 break-all text-xs text-zinc-400">
                {userEmail}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <label className="cursor-pointer rounded-xl bg-green-600 px-3 py-2 text-xs font-bold text-white shadow-sm">
              {uploadingPhoto ? "Enviando..." : "Trocar foto"}

              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploadingPhoto}
                onChange={changeProfilePhoto}
              />
            </label>

            <Link
              href="/change-name"
              className="rounded-xl bg-zinc-950 px-3 py-2 text-xs font-bold text-white shadow-sm"
            >
              Trocar nome
            </Link>

            <Link
              href="/reset-password"
              className="rounded-xl bg-zinc-100 px-3 py-2 text-xs font-bold text-zinc-700 shadow-sm"
            >
              Trocar senha
            </Link>

            <button
              onClick={deleteAccount}
              disabled={deletingAccount}
              className="rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600 shadow-sm disabled:opacity-60"
            >
              {deletingAccount ? "Deletando..." : "Deletar conta"}
            </button>
          </div>

          {!player && (
            <p className="mt-5 rounded-xl bg-yellow-50 p-4 text-sm text-yellow-700">
              Essa conta ainda não tem um jogador ligado na tabela players.
            </p>
          )}

          {player && (
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-zinc-50 p-4">
                <p className="text-2xl font-black text-green-600">
                  {player.goals}
                </p>
                <p className="text-sm text-zinc-500">Gols</p>
              </div>

              <div className="rounded-2xl bg-zinc-50 p-4">
                <p className="text-2xl font-black text-green-600">
                  {player.matches}
                </p>
                <p className="text-sm text-zinc-500">Partidas</p>
              </div>

              <div className="rounded-2xl bg-zinc-50 p-4">
                <p className="text-xl font-black text-green-600">
                  {player.region || "-"}
                </p>
                <p className="text-sm text-zinc-500">Condomínio</p>
              </div>

              <div className="rounded-2xl bg-zinc-50 p-4">
                <p className="text-xl font-black text-green-600">
                  {player.house || "-"}
                </p>
                <p className="text-sm text-zinc-500">Casa</p>
              </div>
            </div>
          )}

          <div className="mt-6 rounded-3xl border border-zinc-100 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black">Editar perfil público</h2>

            <div className="mt-5 space-y-4">
              <div>
                <label className="text-sm font-bold text-zinc-700">
                  Frase do perfil
                </label>

                <input
                  value={quoteText}
                  onChange={(e) => setQuoteText(e.target.value)}
                  placeholder="O jogador não registrou um recado."
                  className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-3 outline-none focus:border-green-600"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-zinc-700">
                  Sobre você
                </label>

                <textarea
                  value={aboutText}
                  onChange={(e) => setAboutText(e.target.value)}
                  placeholder="O jogador não registrou uma descrição."
                  rows={5}
                  className="mt-2 w-full resize-none rounded-xl border border-zinc-200 px-4 py-3 outline-none focus:border-green-600"
                />
              </div>

              <button
                onClick={saveProfileTexts}
                disabled={savingTexts}
                className="w-full rounded-xl bg-green-600 px-5 py-4 font-bold text-white shadow-md disabled:opacity-60"
              >
                {savingTexts ? "Salvando..." : "Salvar textos"}
              </button>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <Link
              href="/ranking"
              className="block rounded-xl border border-zinc-200 px-5 py-4 text-center font-bold"
            >
              Ver ranking
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}