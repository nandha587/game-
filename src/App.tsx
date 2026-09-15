/**
 * Cosmic Defender - Retro Space Arcade Game
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, Difficulty, Perk, HighScore } from './types';
import {
  GameWorld,
  createInitialWorld,
  startWave,
  updateGame,
  renderGame,
  triggerSuperBomb,
} from './game/engine';
import { AVAILABLE_PERKS } from './game/constants';
import { sounds } from './audio';
import { HUD } from './components/HUD';
import { StartScreen } from './components/StartScreen';
import { UpgradeModal } from './components/UpgradeModal';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal } from './components/PauseModal';
import { ControlsOverlay } from './components/ControlsOverlay';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<GameWorld | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  // Game UI States
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [difficulty, setDifficulty] = useState<Difficulty>('STANDARD');
  const [isMuted, setIsMuted] = useState<boolean>(sounds.isMuted());
  const [wavePerks, setWavePerks] = useState<Perk[]>([]);
  const [highScores, setHighScores] = useState<HighScore[]>([]);
  const [isNewHighScore, setIsNewHighScore] = useState<boolean>(false);

  // Synced snapshot for React HUD (updated at throttled intervals)
  const [hudState, setHudState] = useState<{
    player: GameWorld['player'] | null;
    wave: number;
  }>({
    player: null,
    wave: 1,
  });

  // Load high scores from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cosmic_defender_highscores');
      if (saved) {
        setHighScores(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  const saveScore = useCallback((score: number, wave: number, diff: Difficulty) => {
    try {
      const newEntry: HighScore = {
        score,
        wave,
        difficulty: diff,
        date: new Date().toLocaleDateString(),
      };
      const updated = [...highScores, newEntry]
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
      setHighScores(updated);
      localStorage.setItem('cosmic_defender_highscores', JSON.stringify(updated));

      if (highScores.length === 0 || score > highScores[0].score) {
        setIsNewHighScore(true);
      } else {
        setIsNewHighScore(false);
      }
    } catch {
      // ignore
    }
  }, [highScores]);

  // Start new game session
  const handleStartGame = useCallback(
    (chosenDifficulty: Difficulty) => {
      if (!canvasRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const width = Math.max(320, Math.floor(rect.width));
      const height = Math.max(480, Math.floor(rect.height));

      const world = createInitialWorld(width, height, chosenDifficulty);
      worldRef.current = world;

      startWave(world);
      setHudState({ player: { ...world.player }, wave: world.wave });
      setGameState('PLAYING');
      lastTimeRef.current = performance.now();
    },
    [],
  );

  // Resume paused game
  const handleResumeGame = useCallback(() => {
    if (worldRef.current) {
      worldRef.current.isPaused = false;
    }
    setGameState('PLAYING');
    lastTimeRef.current = performance.now();
  }, []);

  // Pause game
  const handlePauseGame = useCallback(() => {
    if (gameState === 'PLAYING') {
      if (worldRef.current) {
        worldRef.current.isPaused = true;
      }
      setGameState('PAUSED');
    } else if (gameState === 'PAUSED') {
      handleResumeGame();
    }
  }, [gameState, handleResumeGame]);

  // Restart current game
  const handleRestart = useCallback(() => {
    handleStartGame(difficulty);
  }, [difficulty, handleStartGame]);

  // Return to home menu
  const handleHome = useCallback(() => {
    setGameState('MENU');
  }, []);

  // Audio mute toggle
  const handleToggleMute = useCallback(() => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  }, []);

  // Super Bomb trigger
  const handleTriggerBomb = useCallback(() => {
    if (worldRef.current && gameState === 'PLAYING') {
      triggerSuperBomb(worldRef.current);
    }
  }, [gameState]);

  // Choose perk upgrade between waves
  const handleSelectPerk = useCallback((perk: Perk) => {
    if (!worldRef.current) return;
    const world = worldRef.current;
    perk.effect(world.player);
    world.wave++;
    startWave(world);
    setGameState('PLAYING');
    lastTimeRef.current = performance.now();
  }, []);

  // Resize canvas according to container
  useEffect(() => {
    const updateDimensions = () => {
      if (!containerRef.current || !canvasRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = Math.max(320, Math.floor(rect.width));
      const height = Math.max(480, Math.floor(rect.height));

      const canvas = canvasRef.current;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }

      if (worldRef.current) {
        worldRef.current.width = width;
        worldRef.current.height = height;
      }
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener('resize', updateDimensions);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyP' || e.code === 'Escape') {
        e.preventDefault();
        handlePauseGame();
        return;
      }

      if (e.code === 'KeyM') {
        handleToggleMute();
        return;
      }

      if (e.code === 'Space') {
        if (gameState === 'GAME_OVER') {
          handleRestart();
          return;
        }
      }

      if (e.code === 'KeyK' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        if (gameState === 'PLAYING') {
          handleTriggerBomb();
          return;
        }
      }

      if (worldRef.current) {
        worldRef.current.keysPressed[e.code] = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (worldRef.current) {
        worldRef.current.keysPressed[e.code] = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, handlePauseGame, handleToggleMute, handleRestart, handleTriggerBomb]);

  // Touch & Drag Controls
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!worldRef.current || gameState !== 'PLAYING') return;
    const touch = e.touches[0];
    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
    worldRef.current.touchControl.active = true;
    worldRef.current.touchControl.shooting = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!worldRef.current || !touchStartPosRef.current || gameState !== 'PLAYING') return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartPosRef.current.x;
    const dy = touch.clientY - touchStartPosRef.current.y;

    // Relative virtual joystick delta (scaled for responsive control)
    const factor = 0.02;
    worldRef.current.touchControl.dx = Math.max(-1, Math.min(1, dx * factor));
    worldRef.current.touchControl.dy = Math.max(-1, Math.min(1, dy * factor));
  };

  const handleTouchEnd = () => {
    if (!worldRef.current) return;
    touchStartPosRef.current = null;
    worldRef.current.touchControl.active = false;
    worldRef.current.touchControl.shooting = false;
    worldRef.current.touchControl.dx = 0;
    worldRef.current.touchControl.dy = 0;
  };

  // Main 60FPS Game Loop
  useEffect(() => {
    let lastHudSync = 0;

    const loop = (time: number) => {
      const dt = Math.min(0.1, (time - lastTimeRef.current) / 1000);
      lastTimeRef.current = time;

      const world = worldRef.current;
      const canvas = canvasRef.current;

      if (world && canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          if (gameState === 'PLAYING') {
            const { waveCleared, playerDead } = updateGame(world, dt, time);

            if (playerDead) {
              setGameState('GAME_OVER');
              saveScore(world.player.score, world.wave, world.difficulty);
            } else if (waveCleared) {
              // Roll 3 distinct perks
              const shuffled = [...AVAILABLE_PERKS].sort(() => 0.5 - Math.random());
              setWavePerks(shuffled.slice(0, 3));
              setGameState('UPGRADE_SELECT');
            }

            // Sync HUD state ~15 times per sec
            if (time - lastHudSync > 66) {
              setHudState({
                player: { ...world.player },
                wave: world.wave,
              });
              lastHudSync = time;
            }
          }

          // Always render world scene (even in pause or upgrade for aesthetic backdrop)
          renderGame(ctx, world);
        }
      }

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [gameState, saveScore]);

  const bestScore = highScores.length > 0 ? highScores[0].score : 0;

  return (
    <div
      ref={containerRef}
      className="relative w-screen h-screen overflow-hidden bg-slate-950 select-none touch-none font-sans"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* Game Canvas */}
      <canvas ref={canvasRef} className="block w-full h-full cursor-crosshair" />

      {/* In-Game Active HUD */}
      {gameState === 'PLAYING' && hudState.player && (
        <>
          <HUD
            player={hudState.player}
            wave={hudState.wave}
            highScore={bestScore}
            difficulty={difficulty}
            isMuted={isMuted}
            isPaused={false}
            onToggleMute={handleToggleMute}
            onTogglePause={handlePauseGame}
            onTriggerBomb={handleTriggerBomb}
          />
          <ControlsOverlay
            bombReady={hudState.player.bombCharge >= 100}
            bombCharge={hudState.player.bombCharge}
            onTriggerBomb={handleTriggerBomb}
          />
        </>
      )}

      {/* Start Menu Overlay */}
      {gameState === 'MENU' && (
        <StartScreen
          onStart={handleStartGame}
          selectedDifficulty={difficulty}
          setSelectedDifficulty={setDifficulty}
          highScores={highScores}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Upgrade Roguelite Perk Selection Overlay */}
      {gameState === 'UPGRADE_SELECT' && (
        <UpgradeModal
          perks={wavePerks}
          wave={hudState.wave + 1}
          onSelectPerk={handleSelectPerk}
        />
      )}

      {/* Pause Screen Overlay */}
      {gameState === 'PAUSED' && (
        <PauseModal
          onResume={handleResumeGame}
          onRestart={handleRestart}
          onHome={handleHome}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Game Over Modal */}
      {gameState === 'GAME_OVER' && hudState.player && (
        <GameOverModal
          player={hudState.player}
          wave={hudState.wave}
          difficulty={difficulty}
          isNewHighScore={isNewHighScore}
          onRestart={handleRestart}
          onHome={handleHome}
        />
      )}
    </div>
  );
}
