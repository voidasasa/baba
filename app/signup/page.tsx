"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";
import { House } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [region, setRegion] = useState("");
  const [house, setHouse] = useState("");

  const [photo, setPhoto] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);

  async function uploadPhoto(file: File, userId: string) {
  const fileExt = file.name.split(".").pop() || "jpg";
  const fileName = `${userId}-${crypto.randomUUID()}.${fileExt}`;
  const filePath = `players/${fileName}`;

  const { error } = await supabase.storage
    .from("player-photos")
    .upload(filePath, file);

  if (error) {
    throw error;
  }

  const { data } = supabase.storage
    .from("player-photos")
    .getPublicUrl(filePath);

  return data.publicUrl;
}

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim() || !email.trim() || !password.trim() || !region.trim() || !house.trim()) {
      alert("Preencha Todos os Campos.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (error) {
        alert("Erro ao criar conta: " + error.message);
        setLoading(false);
        return;
      }

      if (!data.user) {
        alert("Conta criada, mas não foi possível pegar o usuário.");
        setLoading(false);
        return;
      }

      if (!data.session) {
        alert(
          "Conta criada. Confirme seu email antes de continuar. Para o MVP, desative a confirmação de email no Supabase."
        );
        setLoading(false);
        return;
      }

      let photoUrl: string | null = null;

      if (photo) {
        photoUrl = await uploadPhoto(photo, data.user.id);
      }

      const { error: playerError } = await supabase.from("players").insert({
        user_id: data.user.id,
        email,
        name,
        nickname: null,
        region,
        house,
        photo_url: photoUrl,
        goals: 0,
        matches: 0,
      });

      if (playerError) {
        alert("Conta criada, mas erro ao criar jogador: " + playerError.message);
        setLoading(false);
        return;
      }

      router.push("/ranking");
    } catch (err) {
      if (err instanceof Error) {
        alert("Erro: " + err.message);
      } else {
        alert("Erro desconhecido.");
      }
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-white text-zinc-950">
      <header className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
        <Link href="/" className="text-xl font-black">
          Soccer<span className="text-green-600">Web</span>
        </Link>

        
      </header>

      <section className="px-5 py-8">
        <div className="mx-auto max-w-md">
          <div className="text-center">
            <h1 className="text-3xl font-black">Crie sua conta</h1>
            <p className="mt-2 text-sm text-zinc-500">
              e comece sua jornada.
            </p>
          </div>

          <form onSubmit={handleSignup} className="mt-8 space-y-4">
            <div>
              <label className="text-sm font-bold text-zinc-700">
                Nome ou Apelido
              </label>

              <input
                placeholder="Coloque seu nome"
                className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-4 outline-none focus:border-green-600"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-bold text-zinc-700">
                Email
              </label>

              <input
                type="email"
                placeholder="Coloque seu email"
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
                placeholder="Coloque sua senha"
                className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-4 outline-none focus:border-green-600"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-bold text-zinc-700">
                Condomínio
              </label>

              <select
                className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-4 outline-none focus:border-green-600"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              >
                <option value="">Selecione seu condomínio</option>
                <option value="Harmonia">Harmonia</option>
                <option value="Alegria">Alegria</option>
                <option value="Sintonia">Sintonia</option>
                <option value="Felicidade">Felicidade</option>
                <option value="Visitante">Visitante</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-bold text-zinc-700">
                Casa
              </label>

             <input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Coloque sua casa"
                  className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-4 outline-none focus:border-green-600"
                  value={house}
                  onChange={(e) => {
                    const onlyNumbers = e.target.value.replace(/\D/g, "").slice(0, 4);
                    setHouse(onlyNumbers);
                  }}
                />
            </div>

            <div>
              <label className="text-sm font-bold text-zinc-700">
                Enviar uma foto "*OPICIONAL"
              </label>

              <input
                type="file"
                accept="image/*"
                className="mt-2 w-full rounded-xl border border-dashed border-green-500 px-4 py-4 text-sm"
                onChange={(e) => setPhoto(e.target.files?.[0] || null)}
              />
            </div>

            <button
              disabled={loading}
              className="w-full rounded-xl bg-green-600 px-5 py-4 font-bold text-white shadow-md disabled:opacity-60"
            > 
              {loading ? "Criando conta..." : "Criar Conta"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-500">
            Já tem uma conta?{" "}
            <Link href="/login" className="font-bold text-green-600">
              Login
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}