import { useEffect, useRef, useState } from "react";
import { WalletConnectTrigger } from "@/components/WalletConnectTrigger";
import type { TokenDefinition } from "@/data/tokens";

type SiteHeaderProps = {
  currentPath: string;
  tokens: TokenDefinition[];
  onNavigate: (path: string) => void;
};

export function SiteHeader({ currentPath, tokens, onNavigate }: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [farmMenuOpen, setFarmMenuOpen] = useState(false);
  const [chainMenuOpen, setChainMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const farmMenuRef = useRef<HTMLDivElement | null>(null);
  const chainMenuRef = useRef<HTMLDivElement | null>(null);
  const activeToken = tokens.find((token) => `/${token.slug}` === currentPath) ?? null;
  const farmTokens = tokens.filter((token) => token.farmSlug);
  const isPortfolioRoute = currentPath === "/portfolio";
  const isSwapRoute = currentPath === "/swap";
  const isGamesRoute = currentPath === "/games";

  function closeAllMenus() {
    setMenuOpen(false);
    setFarmMenuOpen(false);
    setChainMenuOpen(false);
  }

  function toggleFarmMenu() {
    setFarmMenuOpen((open) => {
      const nextOpen = !open;
      setMenuOpen(false);
      setChainMenuOpen(false);
      return nextOpen;
    });
  }

  function toggleChainMenu() {
    setChainMenuOpen((open) => {
      const nextOpen = !open;
      setMenuOpen(false);
      setFarmMenuOpen(false);
      return nextOpen;
    });
  }

  function toggleTokenMenu() {
    setMenuOpen((open) => {
      const nextOpen = !open;
      setFarmMenuOpen(false);
      setChainMenuOpen(false);
      return nextOpen;
    });
  }

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }

      if (!farmMenuRef.current?.contains(event.target as Node)) {
        setFarmMenuOpen(false);
      }

      if (!chainMenuRef.current?.contains(event.target as Node)) {
        setChainMenuOpen(false);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  useEffect(() => {
    closeAllMenus();
  }, [currentPath]);

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <button type="button" className="site-brand" onClick={() => onNavigate("/")}>
          <span className="site-brand__text">xvgtokens.com</span>
        </button>

        <nav className="site-nav">
          <button
            type="button"
            className={`site-nav__link ${currentPath === "/" ? "is-active" : ""}`}
            onClick={() => onNavigate("/")}
          >
            Home
          </button>
          <button
            type="button"
            className={`site-nav__link ${isPortfolioRoute ? "is-active" : ""}`}
            onClick={() => onNavigate("/portfolio")}
          >
            Portfolio
          </button>
          <div className="site-nav__menu" ref={farmMenuRef}>
            <button
              type="button"
              className={`site-nav__link ${farmMenuOpen ? "is-active" : ""}`}
              onClick={toggleFarmMenu}
            >
              Farm
            </button>
            {farmMenuOpen ? (
              <div className="site-nav__popover">
                {farmTokens.map((token) => (
                  <button
                    key={`farm-${token.slug}`}
                    type="button"
                    className={`site-nav__token ${
                      activeToken?.slug === token.slug ? "is-active" : ""
                    }`}
                    onClick={() => {
                      closeAllMenus();
                      onNavigate(`/${token.slug}`);
                    }}
                  >
                    <img src={token.icon} alt="" className="site-nav__token-icon" />
                    <span>${token.symbol}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            className={`site-nav__link ${isSwapRoute ? "is-active" : ""}`}
            onClick={() => onNavigate("/swap")}
          >
            Swap
          </button>
          <button
            type="button"
            className={`site-nav__link ${isGamesRoute ? "is-active" : ""}`}
            onClick={() => onNavigate("/games")}
          >
            Games
          </button>
          <div className="site-nav__menu" ref={chainMenuRef}>
            <button
              type="button"
              className={`site-nav__link ${chainMenuOpen ? "is-active" : ""}`}
              onClick={toggleChainMenu}
            >
              Chains
            </button>
            {chainMenuOpen ? (
              <div className="site-nav__popover">
                {tokens.map((token) => (
                  <button
                    key={`chain-${token.slug}`}
                    type="button"
                    className={`site-nav__token ${
                      activeToken?.slug === token.slug ? "is-active" : ""
                    }`}
                    onClick={() => {
                      closeAllMenus();
                      onNavigate(`/${token.slug}`);
                    }}
                  >
                    <img src={token.icon} alt="" className="site-nav__token-icon" />
                    <span>{token.chainMenuLabel}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="site-nav__menu" ref={menuRef}>
            <button
              type="button"
              className={`site-nav__link ${menuOpen ? "is-active" : ""}`}
              onClick={toggleTokenMenu}
            >
              Tokens
            </button>
            {menuOpen ? (
              <div className="site-nav__popover">
                {tokens.map((token) => (
                  <button
                    key={token.slug}
                    type="button"
                    className={`site-nav__token ${
                      activeToken?.slug === token.slug ? "is-active" : ""
                    }`}
                    onClick={() => {
                      closeAllMenus();
                      onNavigate(`/${token.slug}`);
                    }}
                  >
                    <img src={token.icon} alt="" className="site-nav__token-icon" />
                    <span>${token.symbol}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </nav>
        <div className="site-header__wallet">
          <WalletConnectTrigger />
        </div>
      </div>
    </header>
  );
}
