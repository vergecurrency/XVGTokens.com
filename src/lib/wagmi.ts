import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import {
  coinbaseWallet,
  injectedWallet,
  metaMaskWallet,
  trustWallet,
  uniswapWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { defineChain } from "viem";
import { http } from "wagmi";
import {
  arbitrum as arbitrumChain,
  avalanche as avalancheChain,
  base as baseChain,
  berachain as berachainChain,
  blast as blastChain,
  bsc as bscChain,
  cronos as cronosChain,
  gnosis as gnosisChain,
  hemi as hemiChain,
  linea as lineaChain,
  mantle as mantleChain,
  optimism as optimismChain,
  polygon as polygonChain,
  sonic as sonicChain,
  unichain as unichainChain,
  worldchain as worldchainChain,
  zksync as zksyncChain,
  zora as zoraChain,
} from "wagmi/chains";
import { tokenOrder, tokensBySlug } from "@/data/tokens";

function getRpcUrlEnv(name: string, fallback: string) {
  const raw = import.meta.env[name];
  if (typeof raw !== "string") {
    return fallback;
  }

  const normalized = raw.trim();
  return normalized.length > 0 ? normalized : fallback;
}

const citreaChain = defineChain({
  id: 4114,
  name: "Citrea Mainnet",
  nativeCurrency: {
    name: "Citrea Bitcoin",
    symbol: "cBTC",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.mainnet.citrea.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "Citrea Explorer",
      url: "https://explorer.mainnet.citrea.xyz",
    },
  },
});

const chains = [
  citreaChain,
  baseChain,
  bscChain,
  zksyncChain,
  optimismChain,
  sonicChain,
  arbitrumChain,
  avalancheChain,
  polygonChain,
  lineaChain,
  mantleChain,
  cronosChain,
  unichainChain,
  blastChain,
  gnosisChain,
  berachainChain,
  worldchainChain,
  hemiChain,
  zoraChain,
] as const;

const transports = Object.fromEntries(
  tokenOrder.map((slug) => {
    const token = tokensBySlug[slug];
    const chainId = Number.parseInt(token.wallet.chainId, 16);

    const rpcUrl =
      chainId === baseChain.id
        ? getRpcUrlEnv("VITE_BASE_RPC_URL", token.wallet.rpcUrl)
        : chainId === bscChain.id
          ? getRpcUrlEnv("VITE_BSC_RPC_URL", token.wallet.rpcUrl)
          : token.wallet.rpcUrl;

    return [chainId, http(rpcUrl)];
  }),
);

export const wagmiConfig = getDefaultConfig({
  appName: "XVGTokens",
  appDescription: "Multi-chain XVGTokens explorer, farms, and portfolio tracker.",
  appUrl: "https://xvgtokens.com/",
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "YOUR_WALLETCONNECT_PROJECT_ID",
  chains,
  transports,
  wallets: [
    {
      groupName: "Recommended",
      wallets: [
        metaMaskWallet,
        uniswapWallet,
        trustWallet,
        coinbaseWallet,
        walletConnectWallet,
        injectedWallet,
      ],
    },
  ],
  ssr: false,
});
