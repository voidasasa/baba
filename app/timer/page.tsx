"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type WakeLockSentinelType = {
  release: () => Promise<void>;
};

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

export default function TimerPage() {
  const router = useRouter();

  const wakeLockRef = useRef<WakeLockSentinelType | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const alarmOscillatorsRef = useRef<OscillatorNode[]>([]);
  const alarmMasterGainRef = useRef<GainNode | null>(null);
  const alarmCleanupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const keepAliveRef = useRef<{
    oscillator: OscillatorNode;
    gainNode: GainNode;
  } | null>(null);

  const deadlineRef = useRef<number | null>(null);

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

  async function getAudioContext() {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;

    if (!AudioContextClass) return null;

    if (
      !audioContextRef.current ||
      audioContextRef.current.state === "closed"
    ) {
      audioContextRef.current = new AudioContextClass();
    }

    if (audioContextRef.current.state === "suspended") {
      await audioContextRef.current.resume();
    }

    return audioContextRef.current;
  }

  function startKeepAlive(audioContext: AudioContext) {
    if (keepAliveRef.current) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = 20;

    gainNode.gain.value = 0.00001;

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();

    keepAliveRef.current = {
      oscillator,
      gainNode,
    };
  }

  function stopKeepAlive() {
    if (!keepAliveRef.current) return;

    try {
      keepAliveRef.current.oscillator.stop();
    } catch {}

    try {
      keepAliveRef.current.oscillator.disconnect();
      keepAliveRef.current.gainNode.disconnect();
    } catch {}

    keepAliveRef.current = null;
  }

  function cancelScheduledAlarm() {
    if (alarmCleanupTimeoutRef.current) {
      clearTimeout(alarmCleanupTimeoutRef.current);
      alarmCleanupTimeoutRef.current = null;
    }

    alarmOscillatorsRef.current.forEach((oscillator) => {
      try {
        oscillator.stop();
      } catch {}
      try {
        oscillator.disconnect();
      } catch {}
    });

    alarmOscillatorsRef.current = [];

    if (alarmMasterGainRef.current) {
      try {
        alarmMasterGainRef.current.disconnect();
      } catch {}

      alarmMasterGainRef.current = null;
    }
  }

  async function scheduleAlarmSound(secondsFromNow: number) {
    cancelScheduledAlarm();

    const audioContext = await getAudioContext();

    if (!audioContext) return;

    startKeepAlive(audioContext);

    const masterGain = audioContext.createGain();
    masterGain.gain.value = 1.8;
    masterGain.connect(audioContext.destination);

    alarmMasterGainRef.current = masterGain;

    const alarmStartTime = audioContext.currentTime + Math.max(0.1, secondsFromNow);

    const notes = [
      { frequency: 900, start: 0, duration: 0.35 },
      { frequency: 1200, start: 0.4, duration: 0.35 },
      { frequency: 900, start: 0.8, duration: 0.35 },
      { frequency: 1200, start: 1.2, duration: 0.35 },
      { frequency: 900, start: 1.6, duration: 0.45 },
      { frequency: 1200, start: 2.1, duration: 0.7 },
    ];

    notes.forEach((note) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = "square";
      oscillator.frequency.value = note.frequency;

      oscillator.connect(gainNode);
      gainNode.connect(masterGain);

      const startTime = alarmStartTime + note.start;
      const endTime = startTime + note.duration;

      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(1.3, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, endTime);

      oscillator.start(startTime);
      oscillator.stop(endTime);

      alarmOscillatorsRef.current.push(oscillator);
    });

    alarmCleanupTimeoutRef.current = setTimeout(() => {
      cancelScheduledAlarm();
      stopKeepAlive();
      void releaseWakeLock();
    }, (secondsFromNow + 4) * 1000);
  }

  async function requestWakeLock() {
    try {
      if ("wakeLock" in navigator && !wakeLockRef.current) {
        const wakeLock = await (
          navigator as Navigator & {
            wakeLock: {
              request: (type: "screen") => Promise<WakeLockSentinelType>;
            };
          }
        ).wakeLock.request("screen");

        wakeLockRef.current = wakeLock;
      }
    } catch (error) {
      console.log("Wake Lock não disponível:", error);
    }
  }

  async function releaseWakeLock() {
    try {
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    } catch (error) {
      console.log("Erro ao liberar Wake Lock:", error);
    }
  }

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

  function getSecondsLeft() {
    if (!deadlineRef.current) return remainingSeconds;

    return Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000));
  }

  async function startTimer() {
    let seconds: number;

    if (!hasStarted) {
      seconds = digitsToSeconds(timeDigits);

      if (seconds <= 0) {
        alert("Defina um tempo maior que 00:00 antes de iniciar.");
        return;
      }

      setRemainingSeconds(seconds);
      setInitialSeconds(seconds);
    } else {
      seconds = getSecondsLeft();

      if (seconds <= 0) {
        seconds = remainingSeconds;
      }
    }

    deadlineRef.current = Date.now() + seconds * 1000;

    await getAudioContext();
    await scheduleAlarmSound(seconds);
    await requestWakeLock();

    setHasStarted(true);
    setIsRunning(true);
  }

  async function pauseTimer() {
    const secondsLeft = getSecondsLeft();

    cancelScheduledAlarm();
    stopKeepAlive();

    deadlineRef.current = null;

    setRemainingSeconds(secondsLeft);
    setIsRunning(false);

    await releaseWakeLock();
  }

  async function resetTimer() {
    cancelScheduledAlarm();
    stopKeepAlive();

    deadlineRef.current = null;

    setIsRunning(false);
    setHasStarted(false);
    setTimeDigits("0000");
    setRemainingSeconds(0);
    setInitialSeconds(0);

    await releaseWakeLock();
  }

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      const secondsLeft = getSecondsLeft();

      setRemainingSeconds(secondsLeft);

      if (secondsLeft <= 0) {
        deadlineRef.current = null;

        setIsRunning(false);
        setHasStarted(false);
        setTimeDigits("0000");
        setInitialSeconds(0);
      }
    }, 250);

    return () => clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    async function handleVisibilityChange() {
      if (document.visibilityState === "visible" && isRunning) {
        await requestWakeLock();

        const audioContext = await getAudioContext();

        if (audioContext) {
          startKeepAlive(audioContext);
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isRunning]);

  useEffect(() => {
    return () => {
      cancelScheduledAlarm();
      stopKeepAlive();
      void releaseWakeLock();

      if (audioContextRef.current) {
        void audioContextRef.current.close();
      }
    };
  }, []);

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

        <Link
          href="/ranking"
          className="rounded-xl bg-zinc-100 px-4 py-3 text-sm font-bold"
        >
          Ranking
        </Link>
      </header>

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