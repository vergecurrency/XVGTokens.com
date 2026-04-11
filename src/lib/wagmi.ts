import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import {
  coinbaseWallet,
  injectedWallet,
  metaMaskWallet,
  trustWallet,
  uniswapWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
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

const chains = [
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
    return [Number.parseInt(token.wallet.chainId, 16), http(token.wallet.rpcUrl)];
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
