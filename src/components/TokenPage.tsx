import { Check, ChevronLeft, Copy, ExternalLink, Sparkles, Wallet } from "lucide-react";
import { type CSSProperties, type ReactNode, useState } from "react";
import { socials, type TokenDefinition } from "@/data/tokens";

type TokenPageProps = {
  token: TokenDefinition;
  tokens: TokenDefinition[];
  onNavigate: (path: string) => void;
  children?: ReactNode;
};

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
