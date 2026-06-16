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
  user_id?: string | null;
};

export default function RankingPage() {
  const router = useRouter();

  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const currentPlayerRank =
  currentPlayer
    ? players.findIndex((player) => player.id === currentPlayer.id) + 1
    : null;

  function avatarUrl(player?: Player | null, size = 100) {
    const letter = player?.name?.[0] || "P";

    return (
      player?.photo_url ||
      `https://placehold.co/${size}x${size}?text=${letter}`
    );
  }

  async function loadCurrentPlayer(userId: string) {
    const { data, error } = await supabase
      .from("players")
      .select("id, name, nickname, photo_url, goals, matches, region, house, user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      alert("Erro ao carregar seu jogador: " + error.message);
      return;
    }

    setCurrentPlayer(data);
  }

  async function loadPlayers() {
    const { data, error } = await supabase
      .from("players")
      .select("id, name, nickname, photo_url, goals, matches, region, house, user_id")
      .order("goals", { ascending: false });

    if (error) {
      alert("Erro ao carregar jogadores: " + error.message);
      return;
    }

    setPlayers(data || []);
  }

  async function checkLoginAndLoadRanking() {
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      router.replace("/login");
      return;
    }

    setUserEmail(userData.user.email || null);

    await loadCurrentPlayer(userData.user.id);
    await loadPlayers();

    setLoading(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

function getRankStyle(index: number) {
  if (index === 0) {
    return "bg-yellow-50";
  }

  if (index === 1) {
    return "bg-zinc-100";
  }

  if (index === 2) {
    return "bg-orange-50";
  }

  return "bg-white";
}

function getRankBadge(index: number) {
  if (index === 0) {
    return "🥇";
  }

  if (index === 1) {
    return "🥈";
  }

  if (index === 2) {
    return "🥉";
  }

  return index + 1;
}

function getRankAppearance(rank: number | null) {
  if (rank === 1) {
    return {
      medal: "🥇",
      badgeText: "#1",
      badgeClass: "bg-yellow-400 text-yellow-950",
      nameClass: "text-yellow-500 drop-shadow-sm",
    };
  }

  if (rank === 2) {
    return {
      medal: "🥈",
      badgeText: "#2",
      badgeClass: "bg-zinc-300 text-zinc-900",
      nameClass: "text-zinc-500",
    };
  }

  if (rank === 3) {
    return {
      medal: "🥉",
      badgeText: "#3",
      badgeClass: "bg-orange-300 text-orange-950",
      nameClass: "text-orange-600",
    };
  }

  return {
    medal: "",
    badgeText: rank ? `#${rank}` : "#-",
    badgeClass: "bg-green-600 text-white",
    nameClass: "text-zinc-950",
  };
}

const currentRankAppearance = getRankAppearance(currentPlayerRank);


  useEffect(() => {
    checkLoginAndLoadRanking();
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white text-zinc-950">
        <p className="text-zinc-500">Carregando ranking...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-zinc-950">
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <aside className="w-72 bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black">
                Baba<span className="text-green-600">Concept</span>
              </h2>

              <button
                onClick={() => setMenuOpen(false)}
                className="text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="mt-8 flex items-center gap-3">
              <img
                src={avatarUrl(currentPlayer, 80)}
                alt={currentPlayer?.name || "Player"}
                className="h-12 w-12 rounded-full border-2 border-green-600 object-cover"
                onError={(e) => {
                  e.currentTarget.src = `https://placehold.co/80x80?text=${
                    currentPlayer?.name?.[0] || "P"
                  }`;
                }}
              />

              <div>
                <p className="font-black">
                  {currentPlayer?.name || "Player"}
                </p>
                <span
    className={`rounded-md px-2 py-1 text-xs font-bold ${currentRankAppearance.badgeClass}`}
  >
    {currentRankAppearance.badgeText}
  </span>
              </div>
            </div>

            <nav className="mt-8 space-y-3">
          

              
              <Link
              href="/profile"
              onClick={() => setMenuOpen(false)}
              className="block rounded-xl px-4 py-3 font-bold text-zinc-700"
            >
              Perfil
            </Link>     

            <Link
              href="/admin"
              onClick={() => setMenuOpen(false)}
              className="block rounded-xl px-4 py-3 font-bold text-zinc-700"
            >
              Admin
            </Link>

            <button
                onClick={logout}
                className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left font-bold text-red-600"
              >
                Sair
              </button>
              
            </nav>

           
          </aside>

          <button
            onClick={() => setMenuOpen(false)}
            className="flex-1 bg-black/30"
          />
        </div>
      )}

      <header className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
        <h1 className="text-xl font-black">
          Baba<span className="text-green-600">Concept</span>
        </h1>

        <button
          onClick={() => setMenuOpen(true)}
          className="rounded-xl bg-zinc-100 px-3 py-2 text-2xl leading-none"
        >
          ☰
        </button>
      </header>

      <section className="px-5 py-6">
        <h1 className="text-3xl font-black">Ranking</h1>

        <div className="mt-5 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-4">
            <img
              src={avatarUrl(currentPlayer, 160)}
              alt={currentPlayer?.name || "Player"}
              className="h-20 w-20 rounded-full border-4 border-green-600 bg-zinc-200 object-cover"
              onError={(e) => {
                e.currentTarget.src = `https://placehold.co/160x160?text=${
                  currentPlayer?.name?.[0] || "P"
                }`;
              }}
            />

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
  {currentRankAppearance.medal && (
    <span className="text-lg">{currentRankAppearance.medal}</span>
  )}

  <h2
    className={`truncate text-xl font-black ${currentRankAppearance.nameClass}`}
  >
    {currentPlayer?.nickname || currentPlayer?.name || "Yourname"}
  </h2>

  <span
    className={`rounded-md px-2 py-1 text-xs font-bold ${currentRankAppearance.badgeClass}`}
  >
    {currentRankAppearance.badgeText}
  </span>
</div>

              <div className="mt-3 grid grid-cols-4 gap-1">
  <div className="min-w-0 rounded-lg border border-zinc-100 p-2 text-center">
    <p className="text-xs font-black leading-tight">
      {currentPlayer?.goals ?? 0}
    </p>
    <p className="text-[9px] text-zinc-500">Gols</p>
  </div>

  <div className="min-w-0 rounded-lg border border-zinc-100 p-2 text-center">
    <p className="text-xs font-black leading-tight">
      {currentPlayer?.matches ?? 0}
    </p>
    <p className="text-[9px] text-zinc-500">Partidas</p>
  </div>

  <div className="min-w-0 rounded-lg border border-zinc-100 p-2 text-center">
    <p className="text-[7px] font-black leading-tight break-words">
      {currentPlayer?.region || "-"}
    </p>
    <p className="text-[9px] text-zinc-500">Condomínio</p>
  </div>

  <div className="min-w-0 rounded-lg border border-zinc-100 p-2 text-center">
    <p className="text-xs font-black leading-tight">
      {currentPlayer?.house || "-"}
    </p>
    <p className="text-[9px] text-zinc-500">Casa</p>
  </div>
</div>
            </div>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm">
          <table className="w-full border-collapse text-[10px]">
            <thead>
              <tr className="border-b border-zinc-100 text-left text-zinc-500">
                <th className="px-2 py-3 text-center">Raking</th>
                <th className="px-2 py-3">Player</th>
                <th className="px-2 py-3 text-center">Gols</th>
                <th className="px-2 py-3 text-center">Partidas</th>
                <th className="px-2 py-3 text-center">Condomínio</th>
                <th className="px-2 py-3 text-center">Casa</th>
              </tr>
            </thead>

            <tbody>
              {players.map((player, index) => (
                <tr
                    key={player.id}
                    onClick={() => router.push(`/player/${player.id}`)}
                    className={`cursor-pointer border-b border-zinc-100 last:border-b-0 ${getRankStyle(index)}`}
                >
                  <td className="px-2 py-2 text-center font-black">
                  <span
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm ${
                      index === 0
                        ? "bg-yellow-200"
                        : index === 1
                        ? "bg-zinc-300"
                        : index === 2
                        ? "bg-orange-200"
                        : "bg-transparent"
                    }`}
                  >
                    {getRankBadge(index)}
                  </span>
                </td>

                  <td className="px-2 py-2">
                    <div className="flex items-center gap-2">
                      <img
                        src={avatarUrl(player, 80)}
                        alt={player.name}
                        className="h-6 w-6 rounded-full bg-zinc-200 object-cover"
                        onError={(e) => {
                          e.currentTarget.src = `https://placehold.co/80x80?text=${
                            player.name?.[0] || "P"
                          }`;
                        }}
                      />

                     <span
                        className={`max-w-[70px] truncate font-bold ${
                          index < 3 ? "text-zinc-950" : "text-zinc-800"
                        }`}
                      >
                        {player.nickname || player.name}
                      </span>
                    </div>
                  </td>

                  <td className="px-2 py-2 text-center font-bold">
                    {player.goals}
                  </td>

                  <td className="px-2 py-2 text-center font-bold">
                    {player.matches}
                  </td>

                  <td className="px-2 py-2 text-center">
                    {player.region || "-"}
                  </td>

                  <td className="px-2 py-2 text-center">
                    {player.house || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}