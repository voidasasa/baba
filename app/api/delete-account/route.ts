import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    return NextResponse.json(
      {
        error:
          "Configuração ausente. Verifique NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY.",
      },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json(
      { error: "Token de autenticação ausente." },
      { status: 401 }
    );
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey);

  const { data: userData, error: userError } =
    await userClient.auth.getUser(token);

  if (userError || !userData.user) {
    return NextResponse.json(
      { error: "Usuário não autenticado ou token inválido." },
      { status: 401 }
    );
  }

  const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

  const userId = userData.user.id;

  const { data: playerData, error: playerFindError } = await adminClient
    .from("players")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (playerFindError) {
    return NextResponse.json(
      { error: "Erro ao encontrar jogador: " + playerFindError.message },
      { status: 500 }
    );
  }

  if (playerData?.id) {
    const { error: deleteMatchPlayersError } = await adminClient
      .from("match_players")
      .delete()
      .eq("player_id", playerData.id);

    if (deleteMatchPlayersError) {
      return NextResponse.json(
        {
          error:
            "Erro ao deletar histórico de partidas do jogador: " +
            deleteMatchPlayersError.message,
        },
        { status: 500 }
      );
    }
  }

  const { error: deleteAdminError } = await adminClient
    .from("admins")
    .delete()
    .eq("user_id", userId);

  if (deleteAdminError) {
    return NextResponse.json(
      { error: "Erro ao remover admin: " + deleteAdminError.message },
      { status: 500 }
    );
  }

  const { error: deletePlayerError } = await adminClient
    .from("players")
    .delete()
    .eq("user_id", userId);

  if (deletePlayerError) {
    return NextResponse.json(
      { error: "Erro ao deletar perfil: " + deletePlayerError.message },
      { status: 500 }
    );
  }

  const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(
    userId
  );

  if (deleteUserError) {
    return NextResponse.json(
      { error: "Erro ao deletar usuário Auth: " + deleteUserError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}