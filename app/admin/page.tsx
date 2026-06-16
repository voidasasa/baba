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
  
};

export default function AdminPage() {
  const router = useRouter();

  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [playedAt, setPlayedAt] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  const [selectedPlayers, setSelectedPlayers] = useState<Record<string, boolean>>(
    {}
  );

  const [goalsByPlayer, setGoalsByPlayer] = useState<Record<string, string>>({});

  const [saving, setSaving] = useState(false);

  function avatarUrl(player: Player) {
    return (
      player.photo_url ||
      `https://placehold.co/100x100?text=${player.name?.[0] || "P"}`
    );
  }

  async function checkAdminAndLoad() {
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      router.replace("/login");
      return;
    }

    const { data: adminData, error: adminError } = await supabase
      .from("admins")
      .select("user_id")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (adminError) {
      alert("Erro ao verificar admin: " + adminError.message);
      setLoading(false);
      return;
    }

    if (!adminData) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    setIsAdmin(true);
    await loadPlayers();
    setLoading(false);
  }

  async function loadPlayers() {
    const { data, error } = await supabase
      .from("players")
      .select("id, name, nickname, photo_url, goals, matches, region, house")
      .order("goals", { ascending: false });

    if (error) {
      alert("Erro ao carregar jogadores: " + error.message);
      return;
    }

    setPlayers(data || []);
  }

  function togglePlayer(playerId: string) {
    setSelectedPlayers((current) => ({
      ...current,
      [playerId]: !current[playerId],
    }));
  }

  function changeGoals(playerId: string, value: string) {
    const onlyNumbers = value.replace(/\D/g, "");

    setGoalsByPlayer((current) => ({
      ...current,
      [playerId]: onlyNumbers,
    }));
  }

  async function registerMatch() {
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      router.replace("/login");
      return;
    }

    const selected = players.filter((player) => selectedPlayers[player.id]);

    if (selected.length === 0) {
      alert("Marque pelo menos um jogador que participou da partida.");
      return;
    }

    const confirmRegister = confirm(
      `Registrar partida com ${selected.length} jogador(es)?`
    );

    if (!confirmRegister) return;

    setSaving(true);

    const { data: matchData, error: matchError } = await supabase
      .from("matches")
      .insert({
        played_at: playedAt,
        created_by: userData.user.id,
      })
      .select("id")
      .single();

    if (matchError) {
      alert("Erro ao criar partida: " + matchError.message);
      setSaving(false);
      return;
    }

    const matchRows = selected.map((player) => ({
      match_id: matchData.id,
      player_id: player.id,
      goals: Number(goalsByPlayer[player.id] || 0),
      played: true,
    }));

    const { error: matchPlayersError } = await supabase
      .from("match_players")
      .insert(matchRows);

    if (matchPlayersError) {
      alert("Erro ao registrar jogadores da partida: " + matchPlayersError.message);
      setSaving(false);
      return;
    }

    const updateResults = await Promise.all(
      selected.map((player) => {
        const goalsToAdd = Number(goalsByPlayer[player.id] || 0);

        return supabase
          .from("players")
          .update({
            goals: player.goals + goalsToAdd,
            matches: player.matches + 1,
          })
          .eq("id", player.id);
      })
    );

    const updateError = updateResults.find((result) => result.error);

    if (updateError?.error) {
      alert("Partida criada, mas erro ao atualizar ranking: " + updateError.error.message);
      setSaving(false);
      return;
    }

    alert("Partida registrada com sucesso!");

    setSelectedPlayers({});
    setGoalsByPlayer({});

    await loadPlayers();

    setSaving(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-zinc-500">Carregando admin...</p>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-white px-5 py-10 text-zinc-950">
        <div className="mx-auto max-w-md rounded-3xl border border-zinc-100 bg-white p-5 shadow-sm">
          <h1 className="text-2xl font-black">Acesso negado</h1>

          <p className="mt-3 text-sm text-zinc-500">
            Sua conta não tem permissão de administrador.
          </p>

          <Link
            href="/ranking"
            className="mt-6 block rounded-xl bg-green-600 px-5 py-4 text-center font-bold text-white"
          >
            Voltar para o ranking
          </Link>
        </div>
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

      <section className="px-5 py-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black">Admin</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Registrar gols e partidas
            </p>
          </div>

          <Link
            href="/ranking"
            className="rounded-xl bg-zinc-100 px-4 py-2 text-sm font-bold"
          >
            Ranking
          </Link>
        </div>

        <div className="mt-6 rounded-3xl border border-zinc-100 bg-white p-4 shadow-sm">
          <label className="text-sm font-bold text-zinc-700">
            Data da partida
          </label>

          <input
            type="date"
            value={playedAt}
            onChange={(e) => setPlayedAt(e.target.value)}
            className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-3 outline-none focus:border-green-600"
          />
        </div>

        <div className="mt-5 space-y-3">
          {players.map((player) => {
            const selected = !!selectedPlayers[player.id];

            return (
              <div
                key={player.id}
                className={`rounded-2xl border p-4 shadow-sm ${
                  selected
                    ? "border-green-500 bg-green-50"
                    : "border-zinc-100 bg-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => togglePlayer(player.id)}
                    className="h-5 w-5 accent-green-600"
                  />

                  <img
                    src={avatarUrl(player)}
                    alt={player.name}
                    className="h-12 w-12 rounded-full bg-zinc-200 object-cover"
                    onError={(e) => {
                      e.currentTarget.src = `https://placehold.co/100x100?text=${
                        player.name?.[0] || "P"
                      }`;
                    }}
                  />

                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-black">
                      {player.nickname || player.name}
                    </h2>

                    <p className="text-xs text-zinc-500">
                      Total: {player.goals} gols · {player.matches} partidas
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="text-xs font-bold text-zinc-600">
                    Gols nessa partida
                  </label>

                  <input
                    inputMode="numeric"
                    placeholder="0"
                    value={goalsByPlayer[player.id] || ""}
                    onChange={(e) => changeGoals(player.id, e.target.value)}
                    disabled={!selected}
                    className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-3 text-lg font-black outline-none focus:border-green-600 disabled:bg-zinc-100 disabled:text-zinc-400"
                  />
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={registerMatch}
          disabled={saving}
          className="mt-6 w-full rounded-2xl bg-green-600 px-5 py-4 font-black text-white shadow-md disabled:opacity-60"
        >
          {saving ? "Registrando..." : "Registrar partida"}
        </button>
      </section>
    </main>
  );
}