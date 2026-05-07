import { tokensBySlug, type TokenSlug } from "@/data/tokens";

export type SwapAssetKind = "xvg" | "native" | "stable" | "eth" | "governance";

export type SwapAsset = {
  id: string;
  symbol: string;
  name: string;
  icon: string;
  address?: string;
  chainId: number;
  chainIdHex: string;
  chainName: string;
  identifier: string;
  decimals: number;
  kind: SwapAssetKind;
  isNativeLike: boolean;
  coingeckoId?: string;
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
export const ZEROX_FEE_BPS_ENV = "VITE_ZEROX_FEE_BPS";
export const ZEROX_FEE_RECIPIENT_ENV = "VITE_ZEROX_FEE_RECIPIENT";

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

function tokenIcon(chainId: number, address: string) {
  return `https://tokens.1inch.io/${chainId}/${address}.png`;
}

function createAsset(
  slug: TokenSlug,
  config: {
    symbol: string;
    identifier: string;
    decimals: number;
    kind: SwapAssetKind;
    coingeckoId?: string;
    icon?: string;
    address?: string;
    isNativeLike?: boolean;
    tokenSlug?: TokenSlug;
  },
): SwapAsset {
  const token = tokensBySlug[slug];
  const chainId = hexToNumber(token.wallet.chainId);
  const address = config.address ?? (config.identifier.startsWith("0x") ? config.identifier : undefined);

  return {
    id: `${chainId}:${config.symbol}:${config.identifier}`,
    symbol: config.symbol,
    name: `${config.symbol} on ${token.chainName}`,
    icon: config.icon ?? token.icon,
    address,
    chainId,
    chainIdHex: token.wallet.chainId,
    chainName: token.chainName,
    identifier: config.identifier,
    decimals: config.decimals,
    kind: config.kind,
    isNativeLike: config.isNativeLike ?? false,
    coingeckoId: config.coingeckoId,
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
      coingeckoId: "xvgzke",
      tokenSlug: "xvgzke",
    }),
    createAsset("xvgzke", {
      symbol: "ZK",
      identifier: "0x5A7d6b2F92C77FAD6CCaBd7EE0624E64907Eaf3E",
      decimals: 18,
      kind: "governance",
      coingeckoId: "zksync",
      icon: tokenIcon(324, "0x5A7d6b2F92C77FAD6CCaBd7EE0624E64907Eaf3E"),
    }),
  ],
  xvgbase: [
    createAsset("xvgbase", {
      symbol: "XVGBASE",
      identifier: tokensBySlug.xvgbase.contractAddress,
      decimals: 18,
      kind: "xvg",
      coingeckoId: "xvgbase",
      tokenSlug: "xvgbase",
    }),
    createAsset("xvgbase", {
      symbol: "ETH",
      identifier: "ETH",
      decimals: 18,
      kind: "eth",
      coingeckoId: "ethereum",
      icon: tokenIcon(8453, "0x4200000000000000000000000000000000000006"),
      address: "0x4200000000000000000000000000000000000006",
      isNativeLike: true,
    }),
  ],
  xvgopt: [
    createAsset("xvgopt", {
      symbol: "XVGOPT",
      identifier: tokensBySlug.xvgopt.contractAddress,
      decimals: 18,
      kind: "xvg",
      coingeckoId: "xvgopt",
      tokenSlug: "xvgopt",
    }),
    createAsset("xvgopt", {
      symbol: "OP",
      identifier: "0x4200000000000000000000000000000000000042",
      decimals: 18,
      kind: "governance",
      coingeckoId: "optimism",
      icon: tokenIcon(10, "0x4200000000000000000000000000000000000042"),
    }),
  ],
  xvgson: [
    createAsset("xvgson", {
      symbol: "XVGSON",
      identifier: tokensBySlug.xvgson.contractAddress,
      decimals: 18,
      kind: "xvg",
      coingeckoId: "xvgson",
      tokenSlug: "xvgson",
    }),
    createAsset("xvgson", {
      symbol: "S",
      identifier: "S",
      decimals: 18,
      kind: "native",
      coingeckoId: "sonic-3",
      icon: tokenIcon(146, "0x039e2fb66102314ce7b64ce5ce3e5183bc94ad38"),
      address: "0x039e2fb66102314ce7b64ce5ce3e5183bc94ad38",
      isNativeLike: true,
    }),
  ],
  xvgarb: [
    createAsset("xvgarb", {
      symbol: "XVGARB",
      identifier: tokensBySlug.xvgarb.contractAddress,
      decimals: 18,
      kind: "xvg",
      coingeckoId: "xvgarb",
      tokenSlug: "xvgarb",
    }),
    createAsset("xvgarb", {
      symbol: "ARB",
      identifier: "0x912CE59144191C1204E64559FE8253a0e49E6548",
      decimals: 18,
      kind: "governance",
      coingeckoId: "arbitrum",
      icon: tokenIcon(42161, "0x912CE59144191C1204E64559FE8253a0e49E6548"),
    }),
  ],
  xvgava: [
    createAsset("xvgava", {
      symbol: "XVGAVA",
      identifier: tokensBySlug.xvgava.contractAddress,
      decimals: 18,
      kind: "xvg",
      coingeckoId: "xvgava",
      tokenSlug: "xvgava",
    }),
    createAsset("xvgava", {
      symbol: "AVAX",
      identifier: "AVAX",
      decimals: 18,
      kind: "native",
      coingeckoId: "avalanche-2",
      icon: tokenIcon(43114, "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7"),
      address: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7",
      isNativeLike: true,
    }),
  ],
  xvgpoly: [
    createAsset("xvgpoly", {
      symbol: "XVGPOLY",
      identifier: tokensBySlug.xvgpoly.contractAddress,
      decimals: 18,
      kind: "xvg",
      coingeckoId: "xvgpoly",
      tokenSlug: "xvgpoly",
    }),
    createAsset("xvgpoly", {
      symbol: "MATIC",
      identifier: "MATIC",
      decimals: 18,
      kind: "native",
      coingeckoId: "matic-network",
      icon: tokenIcon(137, "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270"),
      address: "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
      isNativeLike: true,
    }),
  ],
  xvglin: [
    createAsset("xvglin", {
      symbol: "XVGLIN",
      identifier: tokensBySlug.xvglin.contractAddress,
      decimals: 18,
      kind: "xvg",
      coingeckoId: "xvglin",
      tokenSlug: "xvglin",
    }),
    createAsset("xvglin", {
      symbol: "LINEA",
      identifier: "0x1789e0043623282d5dcc7f213d703c6d8bafbb04",
      decimals: 18,
      kind: "governance",
      coingeckoId: "bridged-usdc-linea-bridged-usdc-linea",
      icon: tokenIcon(59144, "0x1789e0043623282d5dcc7f213d703c6d8bafbb04"),
    }),
  ],
  xvgbsc: [
    createAsset("xvgbsc", {
      symbol: "XVGBSC",
      identifier: tokensBySlug.xvgbsc.contractAddress,
      decimals: 18,
      kind: "xvg",
      coingeckoId: "xvgbsc",
      tokenSlug: "xvgbsc",
    }),
    createAsset("xvgbsc", {
      symbol: "BNB",
      identifier: "BNB",
      decimals: 18,
      kind: "native",
      coingeckoId: "binancecoin",
      icon: tokenIcon(56, "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"),
      address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
      isNativeLike: true,
    }),
  ],
  xvgmnt: [
    createAsset("xvgmnt", {
      symbol: "XVGMNT",
      identifier: tokensBySlug.xvgmnt.contractAddress,
      decimals: 18,
      kind: "xvg",
      coingeckoId: "xvgmnt",
      tokenSlug: "xvgmnt",
    }),
    createAsset("xvgmnt", {
      symbol: "MNT",
      identifier: "MNT",
      decimals: 18,
      kind: "native",
      coingeckoId: "mantle",
      icon: tokenIcon(5000, "0x78c1b0c915c4faa5fffa6cabf0219da63d7f4cb8"),
      address: "0x78c1b0c915c4faa5fffa6cabf0219da63d7f4cb8",
      isNativeLike: true,
    }),
  ],
  xvgcro: [
    createAsset("xvgcro", {
      symbol: "XVGCRO",
      identifier: tokensBySlug.xvgcro.contractAddress,
      decimals: 18,
      kind: "xvg",
      coingeckoId: "xvgcro",
      tokenSlug: "xvgcro",
    }),
    createAsset("xvgcro", {
      symbol: "CRO",
      identifier: "CRO",
      decimals: 18,
      kind: "native",
      coingeckoId: "cronos",
      icon: tokenIcon(25, "0x5c7f8a570d578ed84e63fdfa7b1ee72deae1ae23"),
      address: "0x5c7f8a570d578ed84e63fdfa7b1ee72deae1ae23",
      isNativeLike: true,
    }),
  ],
  xvguni: [
    createAsset("xvguni", {
      symbol: "XVGUNI",
      identifier: tokensBySlug.xvguni.contractAddress,
      decimals: 18,
      kind: "xvg",
      coingeckoId: "xvguni",
      tokenSlug: "xvguni",
    }),
    createAsset("xvguni", {
      symbol: "UNI",
      identifier: "UNI",
      decimals: 18,
      kind: "governance",
      coingeckoId: "uniswap",
      icon: tokenIcon(130, "0x8f187aa05619a017077f5308904739877ce9ea21"),
      address: "0x8f187aa05619a017077f5308904739877ce9ea21",
    }),
  ],
  xvgblast: [
    createAsset("xvgblast", {
      symbol: "XVGBLAST",
      identifier: tokensBySlug.xvgblast.contractAddress,
      decimals: 18,
      kind: "xvg",
      coingeckoId: "xvgblast",
      tokenSlug: "xvgblast",
    }),
    createAsset("xvgblast", {
      symbol: "BLAST",
      identifier: "BLAST",
      decimals: 18,
      kind: "governance",
      coingeckoId: "blast",
      icon: tokenIcon(81457, "0xb1a5700fa2358173fe465e6ea4ff52e36e88e2ad"),
      address: "0xb1a5700fa2358173fe465e6ea4ff52e36e88e2ad",
    }),
  ],
  xvggnosis: [
    createAsset("xvggnosis", {
      symbol: "XVGGNOSIS",
      identifier: tokensBySlug.xvggnosis.contractAddress,
      decimals: 18,
      kind: "xvg",
      coingeckoId: "xvggnosis",
      tokenSlug: "xvggnosis",
    }),
    createAsset("xvggnosis", {
      symbol: "XDAI",
      identifier: "XDAI",
      decimals: 18,
      kind: "native",
      coingeckoId: "xdai",
      isNativeLike: true,
    }),
    createAsset("xvggnosis", {
      symbol: "GNO",
      identifier: "0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb",
      decimals: 18,
      kind: "governance",
      coingeckoId: "gnosis",
      icon: tokenIcon(100, "0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb"),
    }),
  ],
  xvgbera: [
    createAsset("xvgbera", {
      symbol: "XVGBERA",
      identifier: tokensBySlug.xvgbera.contractAddress,
      decimals: 18,
      kind: "xvg",
      coingeckoId: "xvgbera",
      tokenSlug: "xvgbera",
    }),
    createAsset("xvgbera", {
      symbol: "BERA",
      identifier: "BERA",
      decimals: 18,
      kind: "native",
      coingeckoId: "berachain-bera",
      icon: tokenIcon(80094, "0x6969696969696969696969696969696969696969"),
      address: "0x6969696969696969696969696969696969696969",
      isNativeLike: true,
    }),
  ],
  xvgworld: [
    createAsset("xvgworld", {
      symbol: "XVGWORLD",
      identifier: tokensBySlug.xvgworld.contractAddress,
      decimals: 18,
      kind: "xvg",
      coingeckoId: "xvgworld",
      tokenSlug: "xvgworld",
    }),
    createAsset("xvgworld", {
      symbol: "WLD",
      identifier: "WLD",
      decimals: 18,
      kind: "governance",
      coingeckoId: "worldcoin-wld",
      icon: tokenIcon(480, "0x2cFc85d8E48F8EAB294be644d9E25C3030863003"),
      address: "0x2cFc85d8E48F8EAB294be644d9E25C3030863003",
    }),
  ],
  xvghemi: [
    createAsset("xvghemi", {
      symbol: "XVGHEMI",
      identifier: tokensBySlug.xvghemi.contractAddress,
      decimals: 18,
      kind: "xvg",
      coingeckoId: "xvghemi",
      tokenSlug: "xvghemi",
    }),
    createAsset("xvghemi", {
      symbol: "HEMI",
      identifier: "HEMI",
      decimals: 18,
      kind: "governance",
      coingeckoId: "hemi",
      icon: tokenIcon(43111, "0x99e3dE3817F6081B2568208337ef83295b7f591D"),
      address: "0x99e3dE3817F6081B2568208337ef83295b7f591D",
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
