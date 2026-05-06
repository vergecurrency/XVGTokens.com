import { tokensBySlug, type TokenSlug } from "@/data/tokens";

export type SwapAssetKind = "xvg" | "native" | "stable" | "eth" | "governance";

export type SwapAsset = {
  id: string;
  symbol: string;
  name: string;
  icon: string;
  chainId: number;
  chainIdHex: string;
  chainName: string;
  identifier: string;
  decimals: number;
  kind: SwapAssetKind;
  isNativeLike: boolean;
  tokenSlug?: TokenSlug;
};

export type SwapChain = {
  chainId: number;
  chainIdHex: string;
  chainName: string;
  nativeSymbol: string;
  tokenSlug: TokenSlug;
  tokenSymbol: string;
};

export type ZeroExIssueAllowance = {
  actual: string;
  spender: `0x${string}`;
};

export type ZeroExIssueBalance = {
  actual: string;
  expected: string;
  token: string;
};

export type ZeroExQuote = {
  buyAmount: string;
  buyToken: string;
  fees?: {
    zeroExFee?: {
      amount: string;
      token: string;
      type: string;
    } | null;
  };
  gas?: string;
  gasPrice?: string;
  issues?: {
    allowance?: ZeroExIssueAllowance | null;
    balance?: ZeroExIssueBalance | null;
    simulationIncomplete?: boolean;
  };
  liquidityAvailable?: boolean;
  minBuyAmount?: string;
  sellAmount: string;
  sellToken: string;
  totalNetworkFee?: string;
  transaction?: {
    data: `0x${string}`;
    gas?: string;
    gasPrice?: string;
    to: `0x${string}`;
    value?: string;
  };
};

export const ZEROX_API_BASE_URL = "https://api.0x.org";
export const ZEROX_API_KEY_ENV = "VITE_ZEROX_API_KEY";
export const ZEROX_PROXY_URL_ENV = "VITE_ZEROX_PROXY_URL";

const supportedSwapSlugs: TokenSlug[] = [
  "xvgzke",
  "xvgbase",
  "xvgopt",
  "xvgson",
  "xvgarb",
  "xvgava",
  "xvgpoly",
  "xvglin",
  "xvgbsc",
  "xvgmnt",
  "xvgcro",
  "xvguni",
  "xvgblast",
  "xvggnosis",
  "xvgbera",
  "xvgworld",
  "xvghemi",
];

function hexToNumber(chainIdHex: string) {
  return Number.parseInt(chainIdHex, 16);
}

function createAsset(
  slug: TokenSlug,
  config: {
    symbol: string;
    identifier: string;
    decimals: number;
    kind: SwapAssetKind;
    isNativeLike?: boolean;
    tokenSlug?: TokenSlug;
  },
): SwapAsset {
  const token = tokensBySlug[slug];
  const chainId = hexToNumber(token.wallet.chainId);

  return {
    id: `${chainId}:${config.symbol}:${config.identifier}`,
    symbol: config.symbol,
    name: `${config.symbol} on ${token.chainName}`,
    icon: token.icon,
    chainId,
    chainIdHex: token.wallet.chainId,
    chainName: token.chainName,
    identifier: config.identifier,
    decimals: config.decimals,
    kind: config.kind,
    isNativeLike: config.isNativeLike ?? false,
    tokenSlug: config.tokenSlug,
  };
}

const swapAssetsBySlug: Record<TokenSlug, SwapAsset[]> = {
  xvgzke: [
    createAsset("xvgzke", {
      symbol: "XVGZKE",
      identifier: tokensBySlug.xvgzke.contractAddress,
      decimals: 18,
      kind: "xvg",
      tokenSlug: "xvgzke",
    }),
    createAsset("xvgzke", {
      symbol: "ETH",
      identifier: "ETH",
      decimals: 18,
      kind: "eth",
      isNativeLike: true,
    }),
    createAsset("xvgzke", {
      symbol: "USDC",
      identifier: "USDC",
      decimals: 6,
      kind: "stable",
    }),
    createAsset("xvgzke", {
      symbol: "ZK",
      identifier: "0x5A7d6b2F92C77FAD6CCaBd7EE0624E64907Eaf3E",
      decimals: 18,
      kind: "governance",
    }),
  ],
  xvgbase: [
    createAsset("xvgbase", {
      symbol: "XVGBASE",
      identifier: tokensBySlug.xvgbase.contractAddress,
      decimals: 18,
      kind: "xvg",
      tokenSlug: "xvgbase",
    }),
    createAsset("xvgbase", {
      symbol: "ETH",
      identifier: "ETH",
      decimals: 18,
      kind: "eth",
      isNativeLike: true,
    }),
    createAsset("xvgbase", {
      symbol: "USDC",
      identifier: "USDC",
      decimals: 6,
      kind: "stable",
    }),
  ],
  xvgopt: [
    createAsset("xvgopt", {
      symbol: "XVGOPT",
      identifier: tokensBySlug.xvgopt.contractAddress,
      decimals: 18,
      kind: "xvg",
      tokenSlug: "xvgopt",
    }),
    createAsset("xvgopt", {
      symbol: "ETH",
      identifier: "ETH",
      decimals: 18,
      kind: "eth",
      isNativeLike: true,
    }),
    createAsset("xvgopt", {
      symbol: "USDC",
      identifier: "USDC",
      decimals: 6,
      kind: "stable",
    }),
    createAsset("xvgopt", {
      symbol: "OP",
      identifier: "0x4200000000000000000000000000000000000042",
      decimals: 18,
      kind: "governance",
    }),
  ],
  xvgson: [
    createAsset("xvgson", {
      symbol: "XVGSON",
      identifier: tokensBySlug.xvgson.contractAddress,
      decimals: 18,
      kind: "xvg",
      tokenSlug: "xvgson",
    }),
    createAsset("xvgson", {
      symbol: "S",
      identifier: "S",
      decimals: 18,
      kind: "native",
      isNativeLike: true,
    }),
    createAsset("xvgson", {
      symbol: "USDC",
      identifier: "USDC",
      decimals: 6,
      kind: "stable",
    }),
  ],
  xvgarb: [
    createAsset("xvgarb", {
      symbol: "XVGARB",
      identifier: tokensBySlug.xvgarb.contractAddress,
      decimals: 18,
      kind: "xvg",
      tokenSlug: "xvgarb",
    }),
    createAsset("xvgarb", {
      symbol: "ETH",
      identifier: "ETH",
      decimals: 18,
      kind: "eth",
      isNativeLike: true,
    }),
    createAsset("xvgarb", {
      symbol: "USDC",
      identifier: "USDC",
      decimals: 6,
      kind: "stable",
    }),
    createAsset("xvgarb", {
      symbol: "ARB",
      identifier: "0x912CE59144191C1204E64559FE8253a0e49E6548",
      decimals: 18,
      kind: "governance",
    }),
  ],
  xvgava: [
    createAsset("xvgava", {
      symbol: "XVGAVA",
      identifier: tokensBySlug.xvgava.contractAddress,
      decimals: 18,
      kind: "xvg",
      tokenSlug: "xvgava",
    }),
    createAsset("xvgava", {
      symbol: "AVAX",
      identifier: "AVAX",
      decimals: 18,
      kind: "native",
      isNativeLike: true,
    }),
    createAsset("xvgava", {
      symbol: "USDC",
      identifier: "USDC",
      decimals: 6,
      kind: "stable",
    }),
  ],
  xvgpoly: [
    createAsset("xvgpoly", {
      symbol: "XVGPOLY",
      identifier: tokensBySlug.xvgpoly.contractAddress,
      decimals: 18,
      kind: "xvg",
      tokenSlug: "xvgpoly",
    }),
    createAsset("xvgpoly", {
      symbol: "MATIC",
      identifier: "MATIC",
      decimals: 18,
      kind: "native",
      isNativeLike: true,
    }),
    createAsset("xvgpoly", {
      symbol: "USDC",
      identifier: "USDC",
      decimals: 6,
      kind: "stable",
    }),
  ],
  xvglin: [
    createAsset("xvglin", {
      symbol: "XVGLIN",
      identifier: tokensBySlug.xvglin.contractAddress,
      decimals: 18,
      kind: "xvg",
      tokenSlug: "xvglin",
    }),
    createAsset("xvglin", {
      symbol: "ETH",
      identifier: "ETH",
      decimals: 18,
      kind: "eth",
      isNativeLike: true,
    }),
    createAsset("xvglin", {
      symbol: "USDC",
      identifier: "USDC",
      decimals: 6,
      kind: "stable",
    }),
  ],
  xvgbsc: [
    createAsset("xvgbsc", {
      symbol: "XVGBSC",
      identifier: tokensBySlug.xvgbsc.contractAddress,
      decimals: 18,
      kind: "xvg",
      tokenSlug: "xvgbsc",
    }),
    createAsset("xvgbsc", {
      symbol: "BNB",
      identifier: "BNB",
      decimals: 18,
      kind: "native",
      isNativeLike: true,
    }),
    createAsset("xvgbsc", {
      symbol: "USDC",
      identifier: "USDC",
      decimals: 18,
      kind: "stable",
    }),
  ],
  xvgmnt: [
    createAsset("xvgmnt", {
      symbol: "XVGMNT",
      identifier: tokensBySlug.xvgmnt.contractAddress,
      decimals: 18,
      kind: "xvg",
      tokenSlug: "xvgmnt",
    }),
    createAsset("xvgmnt", {
      symbol: "MNT",
      identifier: "MNT",
      decimals: 18,
      kind: "native",
      isNativeLike: true,
    }),
    createAsset("xvgmnt", {
      symbol: "USDC",
      identifier: "USDC",
      decimals: 6,
      kind: "stable",
    }),
  ],
  xvgcro: [
    createAsset("xvgcro", {
      symbol: "XVGCRO",
      identifier: tokensBySlug.xvgcro.contractAddress,
      decimals: 18,
      kind: "xvg",
      tokenSlug: "xvgcro",
    }),
    createAsset("xvgcro", {
      symbol: "CRO",
      identifier: "CRO",
      decimals: 18,
      kind: "native",
      isNativeLike: true,
    }),
    createAsset("xvgcro", {
      symbol: "USDC",
      identifier: "USDC",
      decimals: 6,
      kind: "stable",
    }),
  ],
  xvguni: [
    createAsset("xvguni", {
      symbol: "XVGUNI",
      identifier: tokensBySlug.xvguni.contractAddress,
      decimals: 18,
      kind: "xvg",
      tokenSlug: "xvguni",
    }),
    createAsset("xvguni", {
      symbol: "ETH",
      identifier: "ETH",
      decimals: 18,
      kind: "eth",
      isNativeLike: true,
    }),
    createAsset("xvguni", {
      symbol: "USDC",
      identifier: "USDC",
      decimals: 6,
      kind: "stable",
    }),
    createAsset("xvguni", {
      symbol: "UNI",
      identifier: "UNI",
      decimals: 18,
      kind: "governance",
    }),
  ],
  xvgblast: [
    createAsset("xvgblast", {
      symbol: "XVGBLAST",
      identifier: tokensBySlug.xvgblast.contractAddress,
      decimals: 18,
      kind: "xvg",
      tokenSlug: "xvgblast",
    }),
    createAsset("xvgblast", {
      symbol: "ETH",
      identifier: "ETH",
      decimals: 18,
      kind: "eth",
      isNativeLike: true,
    }),
    createAsset("xvgblast", {
      symbol: "USDC",
      identifier: "USDC",
      decimals: 6,
      kind: "stable",
    }),
    createAsset("xvgblast", {
      symbol: "BLAST",
      identifier: "BLAST",
      decimals: 18,
      kind: "governance",
    }),
  ],
  xvggnosis: [
    createAsset("xvggnosis", {
      symbol: "XVGGNOSIS",
      identifier: tokensBySlug.xvggnosis.contractAddress,
      decimals: 18,
      kind: "xvg",
      tokenSlug: "xvggnosis",
    }),
    createAsset("xvggnosis", {
      symbol: "XDAI",
      identifier: "XDAI",
      decimals: 18,
      kind: "native",
      isNativeLike: true,
    }),
    createAsset("xvggnosis", {
      symbol: "USDC",
      identifier: "USDC",
      decimals: 6,
      kind: "stable",
    }),
    createAsset("xvggnosis", {
      symbol: "GNO",
      identifier: "0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb",
      decimals: 18,
      kind: "governance",
    }),
  ],
  xvgbera: [
    createAsset("xvgbera", {
      symbol: "XVGBERA",
      identifier: tokensBySlug.xvgbera.contractAddress,
      decimals: 18,
      kind: "xvg",
      tokenSlug: "xvgbera",
    }),
    createAsset("xvgbera", {
      symbol: "BERA",
      identifier: "BERA",
      decimals: 18,
      kind: "native",
      isNativeLike: true,
    }),
    createAsset("xvgbera", {
      symbol: "USDC",
      identifier: "USDC",
      decimals: 6,
      kind: "stable",
    }),
  ],
  xvgworld: [
    createAsset("xvgworld", {
      symbol: "XVGWORLD",
      identifier: tokensBySlug.xvgworld.contractAddress,
      decimals: 18,
      kind: "xvg",
      tokenSlug: "xvgworld",
    }),
    createAsset("xvgworld", {
      symbol: "ETH",
      identifier: "ETH",
      decimals: 18,
      kind: "eth",
      isNativeLike: true,
    }),
    createAsset("xvgworld", {
      symbol: "USDC",
      identifier: "USDC",
      decimals: 6,
      kind: "stable",
    }),
    createAsset("xvgworld", {
      symbol: "WLD",
      identifier: "WLD",
      decimals: 18,
      kind: "governance",
    }),
  ],
  xvghemi: [
    createAsset("xvghemi", {
      symbol: "XVGHEMI",
      identifier: tokensBySlug.xvghemi.contractAddress,
      decimals: 18,
      kind: "xvg",
      tokenSlug: "xvghemi",
    }),
    createAsset("xvghemi", {
      symbol: "ETH",
      identifier: "ETH",
      decimals: 18,
      kind: "eth",
      isNativeLike: true,
    }),
    createAsset("xvghemi", {
      symbol: "USDC",
      identifier: "USDC",
      decimals: 6,
      kind: "stable",
    }),
    createAsset("xvghemi", {
      symbol: "HEMI",
      identifier: "HEMI",
      decimals: 18,
      kind: "governance",
    }),
  ],
  xvgcbtc: [],
  xvgzora: [],
};

export const swapChains: SwapChain[] = supportedSwapSlugs.map((slug) => {
  const token = tokensBySlug[slug];
  return {
    chainId: hexToNumber(token.wallet.chainId),
    chainIdHex: token.wallet.chainId,
    chainName: token.chainName,
    nativeSymbol: token.wallet.nativeSymbol,
    tokenSlug: slug,
    tokenSymbol: token.symbol,
  };
});

export const swapAssets: SwapAsset[] = supportedSwapSlugs.flatMap((slug) => swapAssetsBySlug[slug]);

export function getAssetsForChain(chainId: number) {
  return swapAssets.filter((asset) => asset.chainId === chainId);
}

export function getDefaultSellAsset(chainId: number) {
  return getAssetsForChain(chainId).find((asset) => asset.kind === "xvg") ?? null;
}

export function getDefaultBuyAsset(chainId: number) {
  return (
    getAssetsForChain(chainId).find((asset) => asset.kind === "stable") ??
    getAssetsForChain(chainId).find((asset) => asset.kind === "governance") ??
    getAssetsForChain(chainId).find((asset) => asset.kind !== "xvg") ??
    null
  );
}
