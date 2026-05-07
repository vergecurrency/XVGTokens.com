import { BarChart3, Wallet } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPublicClient, formatUnits, http, parseAbi } from "viem";
import { useAccount } from "wagmi";
import { type TokenDefinition } from "@/data/tokens";

const PORTFOLIO_BALANCE_ABI = parseAbi([
  "function balanceOf(address account) view returns (uint256)",
]);

type PortfolioPageProps = {
  tokens: TokenDefinition[];
  onNavigate: (path: string) => void;
};

type PriceMap = Record<string, number>;

const portfolioRpcFallbacks: Partial<Record<TokenDefinition["slug"], string[]>> = {
  xvgpoly: ["https://polygon-bor-rpc.publicnode.com"],
  xvgbsc: [
    "https://bsc-dataseed.bnbchain.org",
    "https://bsc-dataseed1.bnbchain.org",
    "https://bsc-dataseed.binance.org",
  ],
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

function formatUsdValue(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: value >= 1 ? 2 : 4,
    maximumFractionDigits: value >= 1 ? 2 : 6,
  }).format(value);
}

function getCoinGeckoCoinId(token: TokenDefinition) {
  const marketLink = token.links.find(
    (link) => link.kind === "market" && link.label === "CoinGecko" && link.href.includes("/coins/"),
  );

  if (!marketLink) {
    return null;
  }

  const match = marketLink.href.match(/\/coins\/([^/?#]+)/i);
  return match?.[1] ?? null;
}

function getPortfolioRpcUrls(token: TokenDefinition) {
  return Array.from(
    new Set([token.wallet.rpcUrl, ...(portfolioRpcFallbacks[token.slug] ?? [])].filter(Boolean)),
  );
}

export function PortfolioPage({ tokens, onNavigate }: PortfolioPageProps) {
  const { address, isConnected } = useAccount();
  const [pricesByCoinId, setPricesByCoinId] = useState<PriceMap>({});
  const [balancesBySlug, setBalancesBySlug] = useState<Record<string, bigint>>({});
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);

  const tokenCoinIds = useMemo(
    () =>
      tokens.map((token) => ({
        slug: token.slug,
        coinId: getCoinGeckoCoinId(token),
      })),
    [tokens],
  );

  useEffect(() => {
    const coinIds = Array.from(new Set(tokenCoinIds.map((entry) => entry.coinId).filter((value): value is string => Boolean(value))));

    if (!coinIds.length) {
      setPricesByCoinId({});
      return;
    }

    const controller = new AbortController();

    async function loadPrices() {
      try {
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?vs_currencies=usd&ids=${encodeURIComponent(coinIds.join(","))}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error(`CoinGecko request failed with ${response.status}`);
        }

        const payload = (await response.json()) as Record<string, { usd?: number }>;
        const nextPrices = Object.fromEntries(
          Object.entries(payload)
            .map(([coinId, value]) => [coinId, value?.usd])
            .filter((entry): entry is [string, number] => Number.isFinite(entry[1])),
        );

        setPricesByCoinId(nextPrices);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        console.error("Failed loading portfolio USD prices", error);
        setPricesByCoinId({});
      }
    }

    void loadPrices();

    return () => controller.abort();
  }, [tokenCoinIds]);

  useEffect(() => {
    if (!address) {
      setBalancesBySlug({});
      setIsBalanceLoading(false);
      return;
    }

    let cancelled = false;
    const account = address;

    async function loadBalances() {
      setIsBalanceLoading(true);

      try {
        const entries = await Promise.all(
          tokens.map(async (token) => {
            try {
              let lastError: unknown = null;

              for (const rpcUrl of getPortfolioRpcUrls(token)) {
                const client = createPublicClient({
                  transport: http(rpcUrl, {
                    timeout: 12_000,
                  }),
                  batch: {
                    multicall: false,
                  },
                });

                try {
                  const balance = await client.readContract({
                    abi: PORTFOLIO_BALANCE_ABI,
                    address: token.contractAddress as `0x${string}`,
                    functionName: "balanceOf",
                    args: [account],
                  });

                  return [token.slug, typeof balance === "bigint" ? balance : 0n] as const;
                } catch (error) {
                  lastError = error;
                }
              }

              throw lastError;
            } catch (error) {
              console.error(`Failed loading ${token.symbol} portfolio balance`, error);
              return [token.slug, 0n] as const;
            }
          }),
        );

        if (!cancelled) {
          setBalancesBySlug(Object.fromEntries(entries));
        }
      } finally {
        if (!cancelled) {
          setIsBalanceLoading(false);
        }
      }
    }

    void loadBalances();

    return () => {
      cancelled = true;
    };
  }, [address, tokens]);

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
          <div className="portfolio-hero__status">
            <Wallet className="h-4 w-4" />
            {isConnected ? "Wallet connected" : "Use the navbar wallet button to load balances"}
          </div>
        </div>
      </section>

      <section className="portfolio-list">
        {tokens.map((token, index) => {
          const balanceValue = balancesBySlug[token.slug] ?? 0n;
          const coinId = tokenCoinIds[index]?.coinId;
          const tokenPriceUsd = coinId ? pricesByCoinId[coinId] : undefined;
          const balanceDecimal = Number.parseFloat(formatUnits(balanceValue, 18));
          const usdValue =
            Number.isFinite(balanceDecimal) && tokenPriceUsd !== undefined
              ? balanceDecimal * tokenPriceUsd
              : null;

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
                  isBalanceLoading ? (
                    <span className="portfolio-row__loading">Checking...</span>
                  ) : (
                    <>
                      <strong>{formatBalance(balanceValue)} {token.symbol}</strong>
                      {usdValue !== null ? <span className="portfolio-row__usd">{formatUsdValue(usdValue)}</span> : null}
                    </>
                  )
                ) : (
                  <>
                    <strong>0.00 {token.symbol}</strong>
                    <span className="portfolio-row__usd">$0.00</span>
                  </>
                )}
              </div>
            </button>
          );
        })}
      </section>
    </main>
  );
}
