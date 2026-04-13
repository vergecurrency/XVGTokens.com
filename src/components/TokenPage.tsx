import { Check, ChevronLeft, Copy, ExternalLink, Sparkles, TrendingUp, Wallet } from "lucide-react";
import { type CSSProperties, type ReactNode, useEffect, useState } from "react";
import { socials, type TokenDefinition } from "@/data/tokens";

type TokenPageProps = {
  token: TokenDefinition;
  tokens: TokenDefinition[];
  onNavigate: (path: string) => void;
  children?: ReactNode;
};

type MarketChartPoint = {
  timestamp: number;
  price: number;
};

type MarketChartState = {
  points: MarketChartPoint[];
  loading: boolean;
  error: string | null;
};

const chartWidth = 720;
const chartHeight = 260;
const chartPadding = 18;

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: value >= 1 ? 2 : 6,
    maximumFractionDigits: value >= 1 ? 2 : 8,
  }).format(value);
}

function formatAxisPrice(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: value >= 0.01 ? 2 : 6,
    maximumFractionDigits: value >= 0.01 ? 4 : 8,
  }).format(value);
}

function formatChartDate(timestamp: number) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(timestamp);
}

function buildChartPath(points: MarketChartPoint[]) {
  if (points.length === 0) {
    return { linePath: "", areaPath: "", minPrice: 0, maxPrice: 0 };
  }

  const prices = points.map((point) => point.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceSpan = Math.max(maxPrice - minPrice, maxPrice * 0.02, 1e-9);
  const usableWidth = chartWidth - chartPadding * 2;
  const usableHeight = chartHeight - chartPadding * 2;

  const coordinates = points.map((point, index) => {
    const x =
      chartPadding + (points.length === 1 ? usableWidth / 2 : (index / (points.length - 1)) * usableWidth);
    const y =
      chartPadding + (1 - (point.price - minPrice) / priceSpan) * usableHeight;

    return { x, y };
  });

  const linePath = coordinates
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ");
  const firstPoint = coordinates[0];
  const lastPoint = coordinates[coordinates.length - 1];
  const baseline = chartHeight - chartPadding;
  const areaPath = `${linePath} L ${lastPoint.x.toFixed(2)} ${baseline} L ${firstPoint.x.toFixed(2)} ${baseline} Z`;

  return { linePath, areaPath, minPrice, maxPrice };
}

async function addTokenToWallet(token: TokenDefinition) {
  const wallet = window.ethereum as
    | { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> }
    | undefined;

  if (!wallet) {
    window.alert("MetaMask or another EVM wallet was not detected in this browser.");
    return;
  }

  try {
    await wallet.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: token.wallet.chainId,
          chainName: token.wallet.networkName,
          rpcUrls: [token.wallet.rpcUrl],
          nativeCurrency: {
            name: token.wallet.nativeSymbol,
            symbol: token.wallet.nativeSymbol,
            decimals: 18,
          },
          blockExplorerUrls: [token.wallet.explorerUrl],
        },
      ],
    });
  } catch (error) {
    console.error(`Failed adding ${token.symbol} network`, error);
  }

  try {
    await wallet.request({
      method: "wallet_watchAsset",
      params: [
        {
          type: "ERC20",
          options: {
            address: token.contractAddress,
            symbol: token.symbol,
            decimals: 18,
            image: `${window.location.origin}${token.icon}`,
          },
        },
      ],
    });
  } catch (error) {
    console.error(`Failed adding ${token.symbol} token`, error);
  }
}

export function TokenPage({ token, tokens, onNavigate, children }: TokenPageProps) {
  const currentIndex = tokens.findIndex((item) => item.slug === token.slug);
  const previousToken = currentIndex > 0 ? tokens[currentIndex - 1] : null;
  const nextToken = currentIndex < tokens.length - 1 ? tokens[currentIndex + 1] : null;
  const [contractCopied, setContractCopied] = useState(false);
  const [marketChart, setMarketChart] = useState<MarketChartState>({
    points: [],
    loading: Boolean(token.marketChartId),
    error: null,
  });

  useEffect(() => {
    if (!token.marketChartId) {
      setMarketChart({ points: [], loading: false, error: null });
      return;
    }

    const controller = new AbortController();

    async function loadMarketChart() {
      setMarketChart((current) => ({ ...current, loading: true, error: null }));

      try {
        const response = await fetch(
          `https://api.coingecko.com/api/v3/coins/${token.marketChartId}/market_chart?vs_currency=usd&days=30`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error(`CoinGecko request failed with ${response.status}`);
        }

        const payload = (await response.json()) as {
          prices?: Array<[number, number]>;
        };

        const points = (payload.prices ?? [])
          .filter((entry): entry is [number, number] => Array.isArray(entry) && entry.length === 2)
          .map(([timestamp, price]) => ({ timestamp, price }))
          .filter((point) => Number.isFinite(point.timestamp) && Number.isFinite(point.price));

        setMarketChart({
          points,
          loading: false,
          error: points.length ? null : "No chart data available right now.",
        });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        console.error(`Failed loading ${token.symbol} market chart`, error);
        setMarketChart({
          points: [],
          loading: false,
          error: "Chart data is temporarily unavailable.",
        });
      }
    }

    void loadMarketChart();

    return () => controller.abort();
  }, [token.marketChartId, token.symbol]);

  const chartPoints = marketChart.points;
  const firstPoint = chartPoints[0];
  const lastPoint = chartPoints[chartPoints.length - 1];
  const chartChange = firstPoint && lastPoint ? lastPoint.price - firstPoint.price : 0;
  const chartChangePercent =
    firstPoint && firstPoint.price > 0 ? (chartChange / firstPoint.price) * 100 : 0;
  const { linePath, areaPath, minPrice, maxPrice } = buildChartPath(chartPoints);
  const midPrice = minPrice + (maxPrice - minPrice) / 2;
  const isPositiveChart = chartChange >= 0;

  async function handleCopyContract() {
    try {
      await navigator.clipboard.writeText(token.contractAddress);
      setContractCopied(true);
      window.setTimeout(() => setContractCopied(false), 1800);
    } catch (error) {
      console.error(`Failed copying ${token.symbol} contract`, error);
    }
  }

  return (
    <main className="token-page">
      <section className="token-page__hero">
        <div className="token-page__hero-copy">
          <button type="button" className="token-back-link" onClick={() => onNavigate("/")}>
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
          <div className="token-page__eyebrow">{token.chainName}</div>
          <h1 className="token-page__title">${token.symbol}</h1>
          <p className="token-page__description">{token.description}</p>
          <div className="token-page__meta">
            <div className="token-page__meta-card">
              <span>Contract</span>
              <button
                type="button"
                className={`token-page__contract-copy ${contractCopied ? "is-copied" : ""}`}
                onClick={() => void handleCopyContract()}
              >
                <strong>{token.contractAddress}</strong>
                <span className="token-page__contract-copy-action">
                  {contractCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {contractCopied ? "Copied" : "Copy"}
                </span>
              </button>
            </div>
            <div className="token-page__meta-card">
              <span>Farm</span>
              <strong>{token.farmSlug ? "Live on this page" : "Not yet live"}</strong>
            </div>
          </div>
        </div>

        <div
          className={`token-page__art token-page__art--${token.glow}`}
          style={
            {
              "--token-landing-glow": token.landingGlow,
              "--token-landing-glow-secondary": token.landingGlowSecondary ?? token.landingGlow,
            } as CSSProperties
          }
          data-glow-mode={token.landingGlowMode ?? "solid"}
        >
          <div className="token-page__art-halo" />
          <img src={token.icon} alt="" className="token-page__art-icon" />
          <div className="token-page__art-chain">{token.chainName}</div>
        </div>
      </section>

      <section className="token-page__resources">
        <div className="token-page__section-head">
          <div>
            <div className="token-page__section-eyebrow">
              <Sparkles className="h-4 w-4" />
              Resources
            </div>
            <h2>Everything for ${token.symbol}</h2>
          </div>
          <button
            type="button"
            className="token-resource token-resource--wallet"
            onClick={() => void addTokenToWallet(token)}
          >
            <Wallet className="h-4 w-4" />
            Add to wallet
          </button>
        </div>

        <div className="token-resource-grid">
          {token.links.map((link) => {
            const isInternal = link.href.startsWith("#");

            return (
              <a
                key={`${token.slug}-${link.label}`}
                href={link.href}
                target={isInternal ? undefined : "_blank"}
                rel={isInternal ? undefined : "noreferrer"}
                className={`token-resource token-resource--${link.kind}`}
              >
                <span>{link.label}</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            );
          })}
        </div>
      </section>

      {token.marketChartId ? (
        <section className="token-page__resources token-page__chart-section">
          <div className="token-page__section-head">
            <div>
              <div className="token-page__section-eyebrow">
                <TrendingUp className="h-4 w-4" />
                Market
              </div>
              <h2>30 Day Price Chart</h2>
            </div>
            {lastPoint ? (
              <div className="token-page__chart-summary">
                <strong>{formatCurrency(lastPoint.price)}</strong>
                <span className={isPositiveChart ? "is-positive" : "is-negative"}>
                  {isPositiveChart ? "+" : ""}
                  {chartChangePercent.toFixed(2)}%
                </span>
              </div>
            ) : null}
          </div>

          {marketChart.loading ? (
            <div className="token-page__chart-state">Loading CoinGecko chart data...</div>
          ) : marketChart.error ? (
            <div className="token-page__chart-state token-page__chart-state--error">{marketChart.error}</div>
          ) : (
            <>
              <div className="token-page__chart-metrics">
                <div className="token-page__chart-metric">
                  <span>Current</span>
                  <strong>{lastPoint ? formatCurrency(lastPoint.price) : "-"}</strong>
                </div>
                <div className="token-page__chart-metric">
                  <span>30D Change</span>
                  <strong className={isPositiveChart ? "is-positive" : "is-negative"}>
                    {isPositiveChart ? "+" : ""}
                    {formatCurrency(chartChange)} ({chartChangePercent.toFixed(2)}%)
                  </strong>
                </div>
                <div className="token-page__chart-metric">
                  <span>Range</span>
                  <strong>
                    {formatCurrency(minPrice)} to {formatCurrency(maxPrice)}
                  </strong>
                </div>
              </div>

              <div className="token-page__chart-shell">
                <div className="token-page__chart-axis">
                  <span>{formatAxisPrice(maxPrice)}</span>
                  <span>{formatAxisPrice(midPrice)}</span>
                  <span>{formatAxisPrice(minPrice)}</span>
                </div>

                <div className="token-page__chart-canvas">
                  <svg
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    className="token-page__chart-svg"
                    role="img"
                    aria-label={`${token.symbol} 30 day price chart`}
                  >
                    <defs>
                      <linearGradient id="token-price-area" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(56, 189, 248, 0.36)" />
                        <stop offset="100%" stopColor="rgba(56, 189, 248, 0)" />
                      </linearGradient>
                    </defs>
                    <line x1={chartPadding} y1={chartPadding} x2={chartWidth - chartPadding} y2={chartPadding} className="token-page__chart-grid" />
                    <line x1={chartPadding} y1={chartHeight / 2} x2={chartWidth - chartPadding} y2={chartHeight / 2} className="token-page__chart-grid" />
                    <line x1={chartPadding} y1={chartHeight - chartPadding} x2={chartWidth - chartPadding} y2={chartHeight - chartPadding} className="token-page__chart-grid" />
                    <path d={areaPath} fill="url(#token-price-area)" />
                    <path
                      d={linePath}
                      className={`token-page__chart-line ${isPositiveChart ? "is-positive" : "is-negative"}`}
                    />
                    {lastPoint ? (
                      <circle
                        cx={chartWidth - chartPadding}
                        cy={
                          chartPoints.length === 1
                            ? chartHeight / 2
                            : chartPadding +
                              (1 - (lastPoint.price - minPrice) / Math.max(maxPrice - minPrice, maxPrice * 0.02, 1e-9)) *
                                (chartHeight - chartPadding * 2)
                        }
                        r="5"
                        className={`token-page__chart-point ${isPositiveChart ? "is-positive" : "is-negative"}`}
                      />
                    ) : null}
                  </svg>

                  <div className="token-page__chart-dates">
                    <span>{firstPoint ? formatChartDate(firstPoint.timestamp) : "-"}</span>
                    <span>{lastPoint ? formatChartDate(lastPoint.timestamp) : "-"}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      ) : null}

      {children ? (
        <section id="farm" className="token-page__farm">
          <div className="token-page__section-head">
            <div>
              <div className="token-page__section-eyebrow">
                <Sparkles className="h-4 w-4" />
                Farm
              </div>
              <h2>${token.symbol} Farm</h2>
            </div>
          </div>
          {children}
        </section>
      ) : null}

      <footer className="token-page__footer">
        <div className="token-page__pager">
          {previousToken ? (
            <button type="button" className="token-pager" onClick={() => onNavigate(`/${previousToken.slug}`)}>
              <span>Previous</span>
              <strong>${previousToken.symbol}</strong>
            </button>
          ) : <span />}
          {nextToken ? (
            <button type="button" className="token-pager token-pager--next" onClick={() => onNavigate(`/${nextToken.slug}`)}>
              <span>Next</span>
              <strong>${nextToken.symbol}</strong>
            </button>
          ) : null}
        </div>

        <div className="token-page__socials">
          {socials.map((social) => (
            <a key={social.label} href={social.href} target="_blank" rel="noreferrer">
              {social.label}
            </a>
          ))}
        </div>
      </footer>
    </main>
  );
}
