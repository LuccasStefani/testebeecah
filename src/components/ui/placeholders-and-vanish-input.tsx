"use client";

import { storeContent } from "@/src/content/store";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type PlaceholdersAndVanishInputProps = {
  placeholders: string[];

  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;

  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void;

  onTrigger?: () => void;

  triggerMode?: boolean;
};

type Particle = {
  x: number;
  y: number;
  r: number;
  color: string;
};

export function PlaceholdersAndVanishInput({
  placeholders,
  onChange,
  onSubmit,
  onTrigger,
  triggerMode = false,
}: PlaceholdersAndVanishInputProps) {
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);

  const [value, setValue] = useState("");
  const [animating, setAnimating] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const newDataRef = useRef<Particle[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);

  /* =========================================
     PLACEHOLDERS

     Troca a cada 5,5 segundos.
  ========================================= */

  const startPlaceholderAnimation = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (placeholders.length <= 1) {
      return;
    }

    intervalRef.current = setInterval(() => {
      setCurrentPlaceholder((current) => (current + 1) % placeholders.length);
    }, 5500);
  }, [placeholders]);

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState !== "visible") {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);

          intervalRef.current = null;
        }

        return;
      }

      startPlaceholderAnimation();
    }

    startPlaceholderAnimation();

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [startPlaceholderAnimation]);

  /* =========================================
     DESENHA TEXTO NO CANVAS
  ========================================= */

  const draw = useCallback(() => {
    if (!inputRef.current) return;

    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 800;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const computedStyles = getComputedStyle(inputRef.current);

    const fontSize = parseFloat(computedStyles.getPropertyValue("font-size"));

    ctx.font = `${fontSize * 2}px ${computedStyles.fontFamily}`;

    /*
     * Canvas precisa receber uma cor
     * concreta para desenhar as partículas.
     */

    ctx.fillStyle = "#FFFFFF";

    ctx.fillText(value, 16, 40);

    const imageData = ctx.getImageData(0, 0, 800, 800);

    const pixelData = imageData.data;

    const particles: Particle[] = [];

    for (let y = 0; y < 800; y++) {
      const row = 4 * y * 800;

      for (let x = 0; x < 800; x++) {
        const index = row + 4 * x;

        if (
          pixelData[index] !== 0 &&
          pixelData[index + 1] !== 0 &&
          pixelData[index + 2] !== 0
        ) {
          particles.push({
            x,
            y,
            r: 1,

            color: `rgba(
              ${pixelData[index]},
              ${pixelData[index + 1]},
              ${pixelData[index + 2]},
              ${pixelData[index + 3]}
            )`,
          });
        }
      }
    }

    newDataRef.current = particles;
  }, [value]);

  useEffect(() => {
    /*
     * No triggerMode não existe texto digitado,
     * então não precisamos processar o canvas.
     */

    if (triggerMode) return;

    draw();
  }, [value, draw, triggerMode]);

  /* =========================================
     EFEITO VANISH
  ========================================= */

  const animate = (start: number) => {
    const animateFrame = (position: number = 0) => {
      requestAnimationFrame(() => {
        const remainingParticles: Particle[] = [];

        for (let index = 0; index < newDataRef.current.length; index++) {
          const current = newDataRef.current[index];

          if (current.x < position) {
            remainingParticles.push(current);

            continue;
          }

          if (current.r <= 0) {
            current.r = 0;
            continue;
          }

          current.x += Math.random() > 0.5 ? 1 : -1;

          current.y += Math.random() > 0.5 ? 1 : -1;

          current.r -= 0.05 * Math.random();

          remainingParticles.push(current);
        }

        newDataRef.current = remainingParticles;

        const ctx = canvasRef.current?.getContext("2d");

        if (ctx) {
          ctx.clearRect(position, 0, 800, 800);

          newDataRef.current.forEach((particle) => {
            if (particle.x > position) {
              ctx.beginPath();

              ctx.rect(particle.x, particle.y, particle.r, particle.r);

              ctx.fillStyle = particle.color;

              ctx.strokeStyle = particle.color;

              ctx.stroke();
            }
          });
        }

        if (newDataRef.current.length > 0) {
          animateFrame(position - 8);
        } else {
          setValue("");
          setAnimating(false);
        }
      });
    };

    animateFrame(start);
  };

  /* =========================================
     VANISH + SUBMIT

     Só é usado no modo de input normal.
  ========================================= */

  const vanishAndSubmit = () => {
    if (triggerMode || !value.trim() || animating) {
      return;
    }

    setAnimating(true);

    draw();

    if (!inputRef.current) {
      setAnimating(false);
      return;
    }

    const maxX = newDataRef.current.reduce(
      (previous, current) => (current.x > previous ? current.x : previous),
      0,
    );

    animate(maxX);
  };

  /* =========================================
     ENTER
  ========================================= */

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (triggerMode) return;

    if (event.key === "Enter" && !animating) {
      vanishAndSubmit();
    }
  }

  /* =========================================
     SUBMIT NORMAL
  ========================================= */

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    /*
     * No Header, o componente estará em
     * triggerMode e nunca executará busca aqui.
     */

    if (triggerMode) {
      onTrigger?.();
      return;
    }

    if (!value.trim() || animating) {
      return;
    }

    onSubmit?.(event);

    vanishAndSubmit();
  }

  /* =========================================
     CLIQUE NO CAMPO EM TRIGGER MODE
  ========================================= */

  function handleTrigger() {
    if (!triggerMode) return;

    onTrigger?.();
  }

  return (
    <form
      onSubmit={handleSubmit}
      onClick={handleTrigger}
      className={cn(
        "relative mx-auto h-11 w-full overflow-hidden rounded-xl",
        "bg-beecah-black",
        "transition duration-200",
        triggerMode && "cursor-pointer hover:opacity-90",
      )}
    >
      {/* =====================================
          CANVAS / VANISH
      ====================================== */}

      {!triggerMode && (
        <canvas
          ref={canvasRef}
          className={cn(
            "pointer-events-none absolute left-2 top-[20%]",
            "origin-top-left scale-50",
            "pr-20 text-base",
            !animating ? "opacity-0" : "opacity-100",
          )}
        />
      )}

      {/* =====================================
          INPUT
      ====================================== */}

      <input
        ref={inputRef}
        value={value}
        type="text"
        readOnly={triggerMode}
        tabIndex={triggerMode ? -1 : 0}
        aria-label={
          triggerMode ? storeContent.abrirBuscaDePerfumes : storeContent.buscarPerfume2
        }
        autoComplete="off"
        onChange={(event) => {
          if (triggerMode || animating) {
            return;
          }

          setValue(event.target.value);

          onChange?.(event);
        }}
        onKeyDown={triggerMode ? undefined : handleKeyDown}
        className={cn(
          "relative z-40 h-full w-full",
          "rounded-xl border-none bg-transparent",
          "pl-4 pr-12",
          "text-sm font-normal text-beecah-white",
          "outline-none focus:outline-none focus:ring-0",
          animating && "text-transparent",
          triggerMode && "cursor-pointer caret-transparent",
        )}
      />

      {/* =====================================
          BOTÃO DIREITO
      ====================================== */}

      <button
        type={triggerMode ? "button" : "submit"}
        disabled={triggerMode ? false : !value.trim() || animating}
        onClick={(event) => {
          if (!triggerMode) return;

          event.preventDefault();
          event.stopPropagation();

          onTrigger?.();
        }}
        aria-label={triggerMode ? storeContent.abrirBusca : storeContent.buscar}
        className={cn(
          "absolute right-1.5 top-1/2 z-50",
          "flex h-8 w-8 -translate-y-1/2",
          "items-center justify-center rounded-lg",
          "bg-beecah-white text-beecah-black",
          "transition duration-200",
          "hover:opacity-90",
          !triggerMode && "disabled:bg-white/10 disabled:text-white/50",
        )}
      >
        {triggerMode ? (
          /* =================================
             LUPA NO HEADER
          ================================== */

          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="7" />

            <path d="m20 20-3.5-3.5" />
          </svg>
        ) : (
          /* =================================
             SETA ORIGINAL
          ================================== */

          <motion.svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />

            <motion.path
              d="M5 12l14 0"
              initial={{
                strokeDasharray: "50%",
                strokeDashoffset: "50%",
              }}
              animate={{
                strokeDashoffset: value ? 0 : "50%",
              }}
              transition={{
                duration: 0.3,
                ease: "linear",
              }}
            />

            <path d="M13 18l6 -6" />
            <path d="M13 6l6 6" />
          </motion.svg>
        )}
      </button>

      {/* =====================================
          PLACEHOLDERS
      ====================================== */}

      <div className="pointer-events-none absolute inset-0 z-30 flex items-center rounded-xl">
        <AnimatePresence mode="wait">
          {!value && placeholders.length > 0 && (
            <motion.p
              key={`current-placeholder-${currentPlaceholder}`}
              initial={{
                y: 5,
                opacity: 0,
              }}
              animate={{
                y: 0,
                opacity: 1,
              }}
              exit={{
                y: -10,
                opacity: 0,
              }}
              transition={{
                duration: 0.45,
                ease: "easeInOut",
              }}
              className={cn(
                "w-[calc(100%-3rem)] truncate",
                "pl-4 text-left",
                "text-sm font-normal",
                "text-white/55",
              )}
            >
              {placeholders[currentPlaceholder]}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </form>
  );
}
