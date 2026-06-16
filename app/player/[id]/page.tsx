"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Goal, Footprints, Globe2, ShieldCheck } from "lucide-react";
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
  quote_text: string | null;
    about_text: string | null;
};

export default function PlayerPage() {
  const params = useParams();
  const router = useRouter();
  const playerId = params.id as string;

  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);

  function avatarUrl() {
    return (
      player?.photo_url ||
      `https://placehold.co/200x200?text=${player?.name?.[0] || "P"}`
    );
  }

  async function checkLoginAndLoadPlayer() {
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      router.replace("/login");
      return;
    }

    const { data, error } = await supabase
      .from("players")
      .select("id, name, nickname, photo_url, goals, matches, region, house, quote_text, about_text")
      .eq("id", playerId)
      .single();

    if (error) {
      alert("Erro ao carregar jogador: " + error.message);
      setLoading(false);
      return;
    }

    setPlayer(data);
    setLoading(false);
  }

  useEffect(() => {
    if (playerId) {
      checkLoginAndLoadPlayer();
    }
  }, [playerId]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-zinc-500">Carregando jogador...</p>
      </main>
    );
  }

  if (!player) {
    return (
      <main className="min-h-screen bg-white p-5">
        <p className="font-bold">Jogador não encontrado.</p>

        <Link
          href="/ranking"
          className="mt-4 inline-block rounded-xl bg-green-600 px-4 py-3 font-bold text-white"
        >
          Voltar ao ranking
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-zinc-950">
      <header className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
        <Link href="/ranking" className="text-xl font-black">
          Baba<span className="text-green-600">Concept</span>
        </Link>

        
      </header>

      <section className="bg-gradient-to-b from-green-50 via-green-50 to-white px-5 py-5">
        <Link
          href="/ranking"
          className="inline-flex rounded-xl bg-white px-4 py-2 text-sm font-bold shadow-sm"
        >
          ← Voltar
        </Link>

        <div className="mt-6 flex items-center gap-5">
          <img
            src={avatarUrl()}
            alt={player.name}
            className="h-24 w-24 rounded-full border-4 border-green-600 bg-zinc-200 object-cover"
            onError={(e) => {
              e.currentTarget.src = `https://placehold.co/200x200?text=${
                player.name?.[0] || "P"
              }`;
            }}
          />

          <div className="min-w-0">
            <h1 className="truncate text-4xl font-black">
              {player.nickname || player.name}
            </h1>

            <p className="mt-1 text-base font-semibold italic text-green-700">
              “{player.quote_text || "O jogador não registrou um recado."}”
            </p>
          </div>
        </div>

        <div className="mt-7 grid grid-cols-4 gap-2">
          <StatCard
            icon={<Goal size={23} />}
            value={player.goals}
            label="Gols"
          />

          <StatCard
            icon={<Footprints size={23} />}
            value={player.matches}
            label="Partidas"
          />

          <StatCard
            icon={<Globe2 size={23} />}
            value={player.region || "-"}
            label="Condomínio"
          />

          <StatCard
            icon={<ShieldCheck size={23} />}
            value={player.house || "-"}
            label="Casa"
          />
        </div>

        <div className="mt-7 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black">Descrição</h2>

          <p className="mt-3 text-sm text-zinc-600">
           {player.about_text ||
           "O jogador não registrou uma descrição."}
</p>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl bg-gradient-to-br from-green-200 via-green-500 to-zinc-900 shadow-sm">
          <div className="flex h-48 items-center justify-center bg-black/10">
            <div className="text-center">
              <div className="text-7xl">⚽</div>
              <p className="mt-3 text-sm font-bold text-white">
                Perfil do Jogador
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
}) {
  return (
    <div className="rounded-xl bg-white p-3 text-center shadow-sm">
      <div className="mx-auto flex h-8 w-8 items-center justify-center text-green-600">
        {icon}
      </div>

      <p className="mt-1 truncate text-sm font-black text-zinc-950">
        {value}
      </p>

      <p className="text-[10px] text-zinc-500">{label}</p>
    </div>
  );
}