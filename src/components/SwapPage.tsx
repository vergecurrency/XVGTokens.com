import { useEffect, useMemo, useState } from "react";
import { ArrowDownUp, LoaderCircle } from "lucide-react";
import { parseAbi } from "viem";
import { useAccount, useChainId, usePublicClient, useSwitchChain, useWalletClient } from "wagmi";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { WalletConnectTrigger } from "@/components/WalletConnectTrigger";
import { formatUnitsSafe, parseInputToUnitsSafe } from "@/lib/format";
import {
  getAssetsForChain,
  getDefaultBuyAsset,
  getDefaultSellAsset,
  swapChains,
  type SwapAsset,
  type ZeroExQuote,
  ZEROX_FEE_BPS_ENV,
  ZEROX_FEE_RECIPIENT_ENV,
  ZEROX_PROXY_URL_ENV,
} from "@/lib/swap";

const APPROVE_ABI = parseAbi([
  "function approve(address spender, uint256 amount) returns (bool)",
]);

type SwapPageProps = {
  onNavigate: (path: string) => void;
};

function getQuoteErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Failed to load a 0x quote for this pair.";
}

function formatUsdValue(value: number | null) {
  if (value == null || !Number.isFinite(value)) {
    return "--";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 1 ? 2 : 6,
  }).format(value);
}

async function fetchZeroExJson<T>(path: "price" | "quote", params: URLSearchParams) {
  const proxyUrl = import.meta.env.VITE_ZEROX_PROXY_URL;

  if (!proxyUrl) {
    throw new Error(`Missing ${ZEROX_PROXY_URL_ENV} in the frontend environment.`);
  }

  const normalizedProxyUrl = proxyUrl.replace(/\/+$/, "");
  const response = await fetch(`${normalizedProxyUrl}/${path}?${params.toString()}`);

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const reason =
      payload && typeof payload === "object" && "reason" in payload && typeof payload.reason === "string"
        ? payload.reason
        : `0x API request failed with status ${response.status}.`;
    throw new Error(reason);
  }

  return payload as T;
}

function appendIntegratorFeeParams(params: URLSearchParams, sellToken: string) {
  const feeBps = import.meta.env.VITE_ZEROX_FEE_BPS?.trim();
  const feeRecipient = import.meta.env.VITE_ZEROX_FEE_RECIPIENT?.trim();

  if (!feeBps && !feeRecipient) {
    return;
  }

  if (!feeBps) {
    throw new Error(`Missing ${ZEROX_FEE_BPS_ENV} in the frontend environment.`);
  }

  if (!feeRecipient) {
    throw new Error(`Missing ${ZEROX_FEE_RECIPIENT_ENV} in the frontend environment.`);
  }

  params.set("swapFeeBps", feeBps);
  params.set("swapFeeRecipient", feeRecipient);
  params.set("swapFeeToken", sellToken);
}

export function SwapPage({ onNavigate }: SwapPageProps) {
  const { address, isConnected } = useAccount();
  const connectedChainId = useChainId();
  const { switchChainAsync, isPending: isSwitchingChain } = useSwitchChain();
  const { data: walletClient } = useWalletClient();
  const [selectedChainId, setSelectedChainId] = useState<number>(() => swapChains[0]?.chainId ?? 1);
  const [sellAssetId, setSellAssetId] = useState<string>("");
  const [buyAssetId, setBuyAssetId] = useState<string>("");
  const [sellAmount, setSellAmount] = useState<string>("");
  const [quote, setQuote] = useState<ZeroExQuote | null>(null);
  const [quoteError, setQuoteError] = useState<string>("");
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<"" | "approve" | "swap">("");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [usdPrices, setUsdPrices] = useState<Record<string, number>>({});

  const publicClient = usePublicClient({ chainId: selectedChainId });
  const selectedChain = useMemo(
    () => swapChains.find((chain) => chain.chainId === selectedChainId) ?? swapChains[0] ?? null,
    [selectedChainId],
  );
  const chainAssets = useMemo(() => getAssetsForChain(selectedChainId), [selectedChainId]);
  const sellAsset = chainAssets.find((asset) => asset.id === sellAssetId) ?? null;
  const buyAsset = chainAssets.find((asset) => asset.id === buyAssetId) ?? null;
  const parsedSellAmount = sellAsset ? parseInputToUnitsSafe(sellAmount, sellAsset.decimals) : 0n;
  const isWrongNetwork = isConnected && connectedChainId !== selectedChainId;
  const needsApproval = Boolean(
    quote?.issues?.allowance?.spender && sellAsset && !sellAsset.isNativeLike,
  );
  const swapProgress = actionLoading === "approve"
    ? 45
    : actionLoading === "swap"
      ? 82
      : statusMessage.includes("confirmed")
        ? 100
        : quote
          ? needsApproval
            ? 55
            : 70
          : 15;
  const swapProgressLabel = actionLoading === "approve"
    ? "Approval in progress"
    : actionLoading === "swap"
      ? "Swap in progress"
      : statusMessage.includes("Swap confirmed")
        ? "Swap complete"
        : statusMessage.includes("Approval confirmed")
          ? "Approval complete"
          : quote
            ? needsApproval
              ? "Ready for approval"
              : "Ready to swap"
            : "Awaiting quote";
  const sellUsdValue =
    sellAsset?.coingeckoId && usdPrices[sellAsset.coingeckoId] != null
      ? Number(formatUnitsSafe(parsedSellAmount, sellAsset.decimals, 12)) *
        usdPrices[sellAsset.coingeckoId]
      : null;
  const buyUsdValue =
    quote && buyAsset?.coingeckoId && usdPrices[buyAsset.coingeckoId] != null
      ? Number(formatUnitsSafe(BigInt(quote.buyAmount), buyAsset.decimals, 12)) *
        usdPrices[buyAsset.coingeckoId]
      : null;

  useEffect(() => {
    if (!selectedChainId && swapChains[0]) {
      setSelectedChainId(swapChains[0].chainId);
    }
  }, [selectedChainId]);

  useEffect(() => {
    if (!selectedChain) {
      return;
    }

    const defaultSell = getDefaultSellAsset(selectedChain.chainId);
    const defaultBuy = getDefaultBuyAsset(selectedChain.chainId);
    setSellAssetId((current) => (current && chainAssets.some((asset) => asset.id === current) ? current : defaultSell?.id ?? ""));
    setBuyAssetId((current) => {
      if (current && chainAssets.some((asset) => asset.id === current) && current !== defaultSell?.id) {
        return current;
      }
      if (defaultBuy && defaultBuy.id !== defaultSell?.id) {
        return defaultBuy.id;
      }
      return chainAssets.find((asset) => asset.id !== defaultSell?.id)?.id ?? "";
    });
    setQuote(null);
    setQuoteError("");
  }, [selectedChain, chainAssets]);

  useEffect(() => {
    if (connectedChainId && swapChains.some((chain) => chain.chainId === connectedChainId)) {
      setSelectedChainId((current) => current || connectedChainId);
    }
  }, [connectedChainId]);

  useEffect(() => {
    const ids = Array.from(
      new Set(
        [sellAsset?.coingeckoId, buyAsset?.coingeckoId].filter(
          (value): value is string => Boolean(value),
        ),
      ),
    );

    if (!ids.length) {
      setUsdPrices({});
      return;
    }

    const controller = new AbortController();

    void (async () => {
      try {
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(
            ids.join(","),
          )}&vs_currencies=usd`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as Record<string, { usd?: number }>;
        const nextPrices: Record<string, number> = {};

        for (const id of ids) {
          const price = payload[id]?.usd;
          if (typeof price === "number") {
            nextPrices[id] = price;
          }
        }

        setUsdPrices(nextPrices);
      } catch {
        // Leave USD values hidden if the price lookup fails.
      }
    })();

    return () => controller.abort();
  }, [buyAsset?.coingeckoId, sellAsset?.coingeckoId]);

  async function ensureCorrectChain() {
    if (!isWrongNetwork || !selectedChain) {
      return;
    }

    await switchChainAsync({ chainId: selectedChain.chainId });
  }

  async function handleChainSelectionChange(nextChainId: number) {
    setQuote(null);
    setQuoteError("");
    setStatusMessage("");

    if (!isConnected) {
      setSelectedChainId(nextChainId);
      return;
    }

    if (connectedChainId === nextChainId) {
      setSelectedChainId(nextChainId);
      return;
    }

    try {
      await switchChainAsync({ chainId: nextChainId });
      setSelectedChainId(nextChainId);
    } catch (error) {
      setQuoteError(getQuoteErrorMessage(error));
      if (connectedChainId && swapChains.some((chain) => chain.chainId === connectedChainId)) {
        setSelectedChainId(connectedChainId);
      }
    }
  }

  async function handleGetQuote() {
    if (!selectedChain || !sellAsset || !buyAsset) {
      setQuoteError("Choose a chain and both swap assets first.");
      return;
    }

    if (sellAsset.id === buyAsset.id) {
      setQuoteError("Select two different assets.");
      return;
    }

    if (!isConnected || !address) {
      setQuoteError("Connect a wallet to request a 0x quote.");
      return;
    }

    if (parsedSellAmount <= 0n) {
      setQuoteError("Enter a valid sell amount.");
      return;
    }

    setQuoteLoading(true);
    setQuoteError("");
    setStatusMessage("");

    try {
      await ensureCorrectChain();

      const params = new URLSearchParams({
        chainId: String(selectedChain.chainId),
        sellToken: sellAsset.identifier,
        buyToken: buyAsset.identifier,
        sellAmount: parsedSellAmount.toString(),
        taker: address,
      });
      appendIntegratorFeeParams(params, sellAsset.identifier);

      const nextQuote = await fetchZeroExJson<ZeroExQuote>("price", params);
      setQuote(nextQuote);
      if (nextQuote.liquidityAvailable === false) {
        setQuoteError("0x did not return liquidity for this pair on the selected chain.");
      }
    } catch (error) {
      setQuote(null);
      setQuoteError(getQuoteErrorMessage(error));
    } finally {
      setQuoteLoading(false);
    }
  }

  async function handleApprove() {
    if (!walletClient || !address || !sellAsset || !quote?.issues?.allowance?.spender) {
      return;
    }

    setActionLoading("approve");
    setQuoteError("");
    setStatusMessage("");

    try {
      await ensureCorrectChain();

      const approvalHash = await walletClient.writeContract({
        account: address,
        address: sellAsset.identifier as `0x${string}`,
        abi: APPROVE_ABI,
        functionName: "approve",
        args: [quote.issues.allowance.spender, 2n ** 256n - 1n],
      });

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: approvalHash });
      }

      setStatusMessage("Approval confirmed. Refresh the quote, then submit the swap.");
      setQuote(null);
    } catch (error) {
      setQuoteError(getQuoteErrorMessage(error));
    } finally {
      setActionLoading("");
    }
  }

  async function handleSwap() {
    if (!selectedChain || !sellAsset || !buyAsset || !walletClient || !address) {
      return;
    }

    if (parsedSellAmount <= 0n) {
      setQuoteError("Enter a valid sell amount.");
      return;
    }

    setActionLoading("swap");
    setQuoteError("");
    setStatusMessage("");

    try {
      await ensureCorrectChain();

      const params = new URLSearchParams({
        chainId: String(selectedChain.chainId),
        sellToken: sellAsset.identifier,
        buyToken: buyAsset.identifier,
        sellAmount: parsedSellAmount.toString(),
        taker: address,
      });
      appendIntegratorFeeParams(params, sellAsset.identifier);

      const firmQuote = await fetchZeroExJson<ZeroExQuote>("quote", params);

      if (!firmQuote.transaction) {
        throw new Error("0x did not return a transaction payload for this swap.");
      }

      if (firmQuote.issues?.allowance?.spender && !sellAsset.isNativeLike) {
        setQuote(firmQuote);
        throw new Error("Approval is still required before this swap can be sent.");
      }

      const hash = await walletClient.sendTransaction({
        account: address,
        to: firmQuote.transaction.to,
        data: firmQuote.transaction.data,
        gas: firmQuote.transaction.gas ? BigInt(firmQuote.transaction.gas) : undefined,
        gasPrice: firmQuote.transaction.gasPrice ? BigInt(firmQuote.transaction.gasPrice) : undefined,
        value: firmQuote.transaction.value ? BigInt(firmQuote.transaction.value) : undefined,
      });

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }

      setQuote(firmQuote);
      setStatusMessage("Swap confirmed onchain.");
    } catch (error) {
      setQuoteError(getQuoteErrorMessage(error));
    } finally {
      setActionLoading("");
    }
  }

  function handleFlipAssets() {
    if (!sellAsset || !buyAsset || sellAsset.chainId !== buyAsset.chainId) {
      return;
    }

    setSellAssetId(buyAsset.id);
    setBuyAssetId(sellAsset.id);
    setQuote(null);
    setQuoteError("");
  }

  return (
    <main className="swap-page">
      <section className="swap-grid">
        <Card className="swap-card swap-card--main">
          <CardHeader className="swap-card__header">
            <div className="swap-card__topline">
              <Button variant="outline" onClick={() => onNavigate("/")}>Back</Button>
              {!isConnected ? <WalletConnectTrigger /> : null}
            </div>
            <div className="swap-progress">
              <div className="swap-progress__meta">
                <span>Status</span>
                <strong>{swapProgressLabel}</strong>
              </div>
              <div className="swap-progress__track" aria-hidden="true">
                <div className="swap-progress__fill" style={{ width: `${swapProgress}%` }} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="swap-card__content">
            <div className="swap-form">
              <label className="swap-field">
                <span className="swap-field__label">Network</span>
                <select
                  className="swap-select"
                  value={selectedChainId}
                  onChange={(event) => void handleChainSelectionChange(Number(event.target.value))}
                >
                  {swapChains.map((chain) => (
                    <option key={chain.chainId} value={chain.chainId}>
                      {chain.chainName}
                    </option>
                  ))}
                </select>
              </label>

              <div className="swap-token-panels">
                <label className="swap-field">
                  <span className="swap-field__label">Sell</span>
                  <select className="swap-select" value={sellAssetId} onChange={(event) => setSellAssetId(event.target.value)}>
                    {chainAssets.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.symbol}
                      </option>
                    ))}
                  </select>
                  <Input
                    inputMode="decimal"
                    placeholder="0.0"
                    value={sellAmount}
                    onChange={(event) => {
                      setSellAmount(event.target.value);
                      setQuote(null);
                      setQuoteError("");
                    }}
                  />
                  <small className="swap-field__usd">{formatUsdValue(sellUsdValue)}</small>
                </label>

                <button type="button" className="swap-flip" onClick={handleFlipAssets} aria-label="Flip sell and buy assets">
                  <ArrowDownUp size={18} />
                </button>

                <label className="swap-field">
                  <span className="swap-field__label">Buy</span>
                  <select className="swap-select" value={buyAssetId} onChange={(event) => setBuyAssetId(event.target.value)}>
                    {chainAssets
                      .filter((asset) => asset.id !== sellAssetId)
                      .map((asset) => (
                        <option key={asset.id} value={asset.id}>
                          {asset.symbol}
                        </option>
                      ))}
                  </select>
                  <div className="swap-output">
                    {quote ? formatUnitsSafe(BigInt(quote.buyAmount), buyAsset?.decimals ?? 18, 6) : "--"}
                  </div>
                  <small className="swap-field__usd">{formatUsdValue(buyUsdValue)}</small>
                </label>
              </div>

              <div className="swap-actions">
                {isConnected && isWrongNetwork ? (
                  <Button onClick={() => void ensureCorrectChain()} disabled={isSwitchingChain}>
                    {isSwitchingChain ? "Switching..." : `Switch to ${selectedChain?.chainName ?? "network"}`}
                  </Button>
                ) : isConnected ? (
                  <Button onClick={() => void handleGetQuote()} disabled={quoteLoading}>
                    {quoteLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "Get Quote"}
                  </Button>
                ) : null}

                {!isConnected ? (
                  <Button onClick={() => void handleGetQuote()} disabled>
                    Get Quote
                  </Button>
                ) : null}

                {needsApproval ? (
                  <Button variant="secondary" onClick={() => void handleApprove()} disabled={actionLoading !== ""}>
                    {actionLoading === "approve" ? "Approving..." : "Approve"}
                  </Button>
                ) : null}

                <Button
                  variant="outline"
                  onClick={() => void handleSwap()}
                  disabled={!isConnected || isWrongNetwork || actionLoading !== "" || !sellAsset || !buyAsset}
                >
                  {actionLoading === "swap" ? "Swapping..." : "Swap"}
                </Button>
              </div>
            </div>

            {quoteError ? (
              <Alert className="swap-alert swap-alert--error">
                <AlertDescription>{quoteError}</AlertDescription>
              </Alert>
            ) : null}

            {statusMessage ? (
              <Alert className="swap-alert">
                <AlertDescription>{statusMessage}</AlertDescription>
              </Alert>
            ) : null}
          </CardContent>
        </Card>

        <Card className="swap-card">
          <CardHeader className="swap-card__header">
            <div>
              <p className="swap-card__eyebrow">Quote</p>
              <CardTitle>Trade details</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="swap-card__content swap-metrics">
            <div className="swap-metric">
              <span>Sell amount</span>
              <div className="swap-metric__value">
                <strong>{quote && sellAsset ? `${formatUnitsSafe(BigInt(quote.sellAmount), sellAsset.decimals, 6)} ${sellAsset.symbol}` : "--"}</strong>
                <small>{formatUsdValue(sellUsdValue)}</small>
              </div>
            </div>
            <div className="swap-metric">
              <span>Buy amount</span>
              <div className="swap-metric__value">
                <strong>{quote && buyAsset ? `${formatUnitsSafe(BigInt(quote.buyAmount), buyAsset.decimals, 6)} ${buyAsset.symbol}` : "--"}</strong>
                <small>{formatUsdValue(buyUsdValue)}</small>
              </div>
            </div>
            <div className="swap-metric">
              <span>Minimum received</span>
              <strong>{quote?.minBuyAmount && buyAsset ? `${formatUnitsSafe(BigInt(quote.minBuyAmount), buyAsset.decimals, 6)} ${buyAsset.symbol}` : "--"}</strong>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
