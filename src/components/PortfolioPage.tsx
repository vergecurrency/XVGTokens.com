import { BarChart3, Wallet } from "lucide-react";
import { formatUnits, parseAbi } from "viem";
import { useAccount, useReadContracts } from "wagmi";
import { WalletConnectTrigger } from "@/components/WalletConnectTrigger";
import { type TokenDefinition } from "@/data/tokens";

const PORTFOLIO_BALANCE_ABI = parseAbi([
  "function balanceOf(address account) view returns (uint256)",
]);

type PortfolioPageProps = {
  tokens: TokenDefinition[];
  onNavigate: (path: string) => void;
};

function formatBalance(value: bigint) {
  const formatted = Number.parseFloat(formatUnits(value, 18));

  if (!Number.isFinite(formatted) || formatted <= 0) {
    return "0.00";
  }

  if (formatted >= 1000) {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(formatted);
  }

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(formatted);
}

export function PortfolioPage({ tokens, onNavigate }: PortfolioPageProps) {
  const { address, isConnected } = useAccount();

  const { data, isLoading, isFetching } = useReadContracts({
    allowFailure: true,
    contracts: address
      ? tokens.map((token) => ({
          abi: PORTFOLIO_BALANCE_ABI,
          address: token.contractAddress as `0x${string}`,
          functionName: "balanceOf",
          args: [address],
          chainId: Number.parseInt(token.wallet.chainId, 16),
        }))
      : [],
    query: {
      enabled: Boolean(address),
    },
  });

  return (
    <main className="portfolio-page">
      <section className="portfolio-hero">
        <div className="portfolio-hero__copy">
          <div className="portfolio-hero__eyebrow">
            <BarChart3 className="h-4 w-4" />
            Multi-Chain Portfolio
          </div>
          <h1 className="portfolio-hero__title">Your XVG token balances across every chain.</h1>
          <p className="portfolio-hero__body">
            Connect a wallet and this page will check your balance for each XVG token deployment on
            the site, chain by chain.
          </p>
        </div>
        <div className="portfolio-hero__actions">
          <WalletConnectTrigger />
          <div className="portfolio-hero__status">
            <Wallet className="h-4 w-4" />
            {isConnected ? "Wallet connected" : "Connect wallet to load balances"}
          </div>
        </div>
      </section>

      <section className="portfolio-list">
        {tokens.map((token, index) => {
          const balanceResult = data?.[index];
          const balanceValue =
            balanceResult?.status === "success" && typeof balanceResult.result === "bigint"
              ? balanceResult.result
              : 0n;

          return (
            <button
              key={token.slug}
              type="button"
              className="portfolio-row"
              onClick={() => onNavigate(`/${token.slug}`)}
            >
              <div className="portfolio-row__token">
                <img src={token.icon} alt="" className="portfolio-row__icon" />
                <div className="portfolio-row__copy">
                  <strong>${token.symbol}</strong>
                  <span>{token.chainMenuLabel}</span>
                </div>
              </div>
              <div className="portfolio-row__balance">
                {address ? (
                  isLoading || isFetching ? (
                    <span className="portfolio-row__loading">Checking...</span>
                  ) : (
                    `${formatBalance(balanceValue)} ${token.symbol}`
                  )
                ) : (
                  `0.00 ${token.symbol}`
                )}
              </div>
            </button>
          );
        })}
      </section>
    </main>
  );
}
