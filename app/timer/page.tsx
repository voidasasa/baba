"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

function formatSeconds(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
}

function formatInputTime(digits: string) {
  const cleanDigits = digits.replace(/\D/g, "").slice(0, 4);

  if (cleanDigits.length <= 2) {
    return cleanDigits;
  }

  const minutes = cleanDigits.slice(0, cleanDigits.length - 2);
  const seconds = cleanDigits.slice(-2);

  return `${minutes}:${seconds}`;
}

function digitsToSeconds(digits: string) {
  const cleanDigits = digits.replace(/\D/g, "").slice(0, 4);

  if (!cleanDigits) return 0;

  if (cleanDigits.length <= 2) {
    return Number(cleanDigits);
  }

  const minutes = Number(cleanDigits.slice(0, cleanDigits.length - 2));
  const seconds = Number(cleanDigits.slice(-2));

  return minutes * 60 + Math.min(seconds, 59);
}

function playBeep() {
  const audioContext = new AudioContext();

  const notes = [
    { frequency: 660, start: 0, duration: 0.28 },
    { frequency: 880, start: 0.32, duration: 0.28 },
    { frequency: 990, start: 0.64, duration: 0.55 },
  ];

  notes.forEach((note) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = note.frequency;

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    const startTime = audioContext.currentTime + note.start;
    const endTime = startTime + note.duration;

    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.45, startTime + 0.03);
    gainNode.gain.exponentialRampToValueAtTime(0.001, endTime);

    oscillator.start(startTime);
    oscillator.stop(endTime);
  });

  setTimeout(() => {
    audioContext.close();
  }, 1600);
}

export default function TimerPage() {
  const router = useRouter();

  const [checkingUser, setCheckingUser] = useState(true);

  const [timeDigits, setTimeDigits] = useState("1500");
  const [remainingSeconds, setRemainingSeconds] = useState(15 * 60);
  const [initialSeconds, setInitialSeconds] = useState(15 * 60);

  const [isRunning, setIsRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const displayTime = hasStarted
    ? formatSeconds(remainingSeconds)
    : formatInputTime(timeDigits);

  const progress = useMemo(() => {
    if (initialSeconds <= 0) return 0;

    return Math.max(0, Math.min(100, (remainingSeconds / initialSeconds) * 100));
  }, [remainingSeconds, initialSeconds]);

  async function checkUser() {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      router.replace("/login");
      return;
    }

    setCheckingUser(false);
  }

  function handleTimeChange(value: string) {
    if (hasStarted || isRunning) return;

    const onlyNumbers = value.replace(/\D/g, "").slice(0, 4);

    setTimeDigits(onlyNumbers);

    const seconds = digitsToSeconds(onlyNumbers);
    setRemainingSeconds(seconds);
    setInitialSeconds(seconds);
  }

  function startTimer() {
    if (!hasStarted) {
      const seconds = digitsToSeconds(timeDigits);

      if (seconds <= 0) {
        alert("Defina um tempo maior que 00:00 antes de iniciar.");
        return;
      }

      setRemainingSeconds(seconds);
      setInitialSeconds(seconds);
    }

    setHasStarted(true);
    setIsRunning(true);
  }

  function pauseTimer() {
    setIsRunning(false);
  }

  function resetTimer() {
    setIsRunning(false);
    setHasStarted(false);
    setTimeDigits("0000");
    setRemainingSeconds(0);
    setInitialSeconds(0);
  }

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setRemainingSeconds((currentSeconds) => {
        if (currentSeconds <= 1) {
          clearInterval(interval);

          setIsRunning(false);
          setHasStarted(false);
          setTimeDigits("0000");
          setInitialSeconds(0);

          playBeep();

          return 0;
        }

        return currentSeconds - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  if (checkingUser) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-zinc-500">Carregando timer...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-zinc-950">
      <header className="flex items-center justify-between border-b border-zinc-100 px-6 py-5">
        <Link href="/ranking" className="text-xl font-black">
          Baba<span className="text-green-600">Concept</span>
        </Link>

        
      </header>

    <section className="px-5 py-6">

        <Link
          href="/ranking"
          className="inline-block rounded-xl bg-zinc-100 px-4 py-2 text-sm font-bold"
        >
          ← Voltar
        </Link>
    </section>
      

      <section className="flex min-h-[calc(100vh-73px)] flex-col items-center px-6 py-10">

        

        <div className="relative flex h-52 w-52 items-center justify-center rounded-full border-4 border-zinc-900">
          <div
            className="absolute inset-[-4px] rounded-full border-4 border-green-500 transition-all"
            style={{
              opacity: progress > 0 && hasStarted ? 0.8 : 0,
            }}
          />

          <input
            value={displayTime}
            onChange={(e) => handleTimeChange(e.target.value)}
            onFocus={(e) => e.currentTarget.select()}
            disabled={hasStarted}
            inputMode="numeric"
            className="relative z-10 w-40 bg-transparent text-center text-5xl font-black text-zinc-900 outline-none disabled:text-zinc-900"
            placeholder="15:00"
          />
        </div>

        <p className="mt-6 text-2xl font-black">Timer</p>

        <div className="mt-10 flex w-full max-w-xs flex-col gap-4">
          {!isRunning && (
            <button
              onClick={startTimer}
              className="w-full rounded-2xl bg-green-600 px-5 py-5 text-3xl font-black text-white shadow-md active:scale-95"
            >
              Start
            </button>
          )}

          {isRunning && (
            <button
              onClick={pauseTimer}
              className="w-full rounded-2xl bg-yellow-400 px-5 py-5 text-3xl font-black text-yellow-950 shadow-md active:scale-95"
            >
              Pause
            </button>
          )}

          <button
            onClick={resetTimer}
            className="w-full rounded-2xl bg-red-600 px-5 py-5 text-3xl font-black text-white shadow-md active:scale-95"
          >
            Reset
          </button>
        </div>

        <div className="mt-10 h-4 w-4 rounded-full border-2 border-zinc-900" />

        <p className="mt-8 max-w-xs text-center text-xs text-zinc-400">
          Digite apenas números. Exemplo: digite 1500 para 15:00 ou 0530 para
          05:30.
        </p>
      </section>
    </main>
  );
}