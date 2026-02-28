import GameCanvas from '@/components/GameCanvas';

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-4">
      <GameCanvas />
      <div className="flex gap-6 text-[8px] font-pixel text-muted-foreground">
        <span>← → Mover</span>
        <span>ESPAÇO Pular</span>
        <span>↓ Agachar</span>
        <span>SHIFT Correr</span>
        <span>E Empurrar</span>
      </div>
    </div>
  );
};

export default Index;
