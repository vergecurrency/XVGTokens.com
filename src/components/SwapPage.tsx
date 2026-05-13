import { SwapWidget } from "@/components/SwapWidget";

type SwapPageProps = {
  onNavigate: (path: string) => void;
};

export function SwapPage({ onNavigate }: SwapPageProps) {
  return (
    <main className="swap-page">
      <SwapWidget onNavigate={onNavigate} />
    </main>
  );
}
