import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-zinc-950">
      <header className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
        <h1 className="text-xl font-black">
          Baba<span className="text-green-600">Concept</span>
        </h1>

        
      </header>

      <section className="px-5 pt-10 pb-6">
        <h2 className="text-5xl font-black leading-tight">
          Baba<span className="text-green-600">Concept</span>
        </h2>

        <p className="mt-4 text-zinc-600">
          Seu ranking pessoal.
          <br />
          Faça suas competições.
        </p>

        <div className="mt-8 space-y-3">
          <Link
            href="/login"
            className="block w-full rounded-xl bg-green-600 px-5 py-4 text-center font-bold text-white shadow-md"
          >
            Login
          </Link>

          <Link
            href="/signup"
            className="block w-full rounded-xl border border-green-600 px-5 py-4 text-center font-bold text-green-700"
          >
            Criar conta
          </Link>

        
        </div>
      </section>

      <section className="mx-5 mt-4 rounded-3xl bg-gradient-to-b from-green-100 to-green-600 p-5 shadow-lg">
        <div className="rounded-2xl bg-white/90 p-5">
          <div className="text-7xl text-center">⚽</div>

         
        </div>
      </section>
    </main>
  );
}