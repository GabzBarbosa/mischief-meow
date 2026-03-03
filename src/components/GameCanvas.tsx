import { useEffect, useRef } from 'react';
import { Game } from '@/game/Game';

const GameCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = 800;
    canvas.height = 480;

    const game = new Game(canvas);
    gameRef.current = game;

    // Start at title screen
    game.frameCount = 0;
    game.gameState = 'title';
    const loop = () => {
      game.render();
      game.frameCount++;
      if (game.gameState === 'title' || game.gameState === 'charSelect') {
        game.keysJustPressed.clear();
        requestAnimationFrame(loop);
      }
    };
    loop();

    return () => {
      game.destroy();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full max-w-[800px] aspect-[800/480] pixel-border game-glow"
      style={{ imageRendering: 'pixelated' }}
    />
  );
};

export default GameCanvas;
