import { useEffect, useState } from "react";
import { FarmDashboard } from "@/components/FarmDashboard";
import { GamesPage } from "@/components/GamesPage";
import { HomePage } from "@/components/HomePage";
import { PortfolioPage } from "@/components/PortfolioPage";
import { SiteHeader } from "@/components/SiteHeader";
import { TetrisPage } from "@/components/TetrisPage";
import { TokenPage } from "@/components/TokenPage";
import { FarmProvider } from "@/lib/farm-context";
import { farmConfigs, type FarmSlug } from "@/lib/farms";
import { tokenOrder, tokensBySlug, type TokenSlug } from "@/data/tokens";

const HOME_ROUTE = "/";
const PORTFOLIO_ROUTE = "/portfolio";
const GAMES_ROUTE = "/games";
const TETRIS_ROUTE = "/games/tetris";

function normalizePath(pathname: string) {
  const normalized = pathname.replace(/\/+$/, "") || HOME_ROUTE;

  if (
    normalized === HOME_ROUTE ||
    normalized === PORTFOLIO_ROUTE ||
    normalized === GAMES_ROUTE ||
    normalized === TETRIS_ROUTE
  ) {
    return normalized;
  }
  const slug = normalized.replace(/^\/+/, "") as TokenSlug;

  return tokensBySlug[slug] ? `/${slug}` : HOME_ROUTE;
}

function getTokenSlugFromPath(pathname: string): TokenSlug | null {
  if (
    pathname === HOME_ROUTE ||
    pathname === PORTFOLIO_ROUTE ||
    pathname === GAMES_ROUTE ||
    pathname === TETRIS_ROUTE
  ) {
    return null;
  }

  const slug = pathname.replace(/^\/+/, "") as TokenSlug;
  return tokensBySlug[slug] ? slug : null;
}

export default function App() {
  const [pathname, setPathname] = useState(() => normalizePath(window.location.pathname));
  const tokens = tokenOrder.map((slug) => tokensBySlug[slug]);

  useEffect(() => {
    const activeTokenSlug = getTokenSlugFromPath(pathname);
    const activeFarmSlug = (activeTokenSlug &&
      (activeTokenSlug === "xvgbase" || activeTokenSlug === "xvgbsc")
      ? activeTokenSlug
      : null) as FarmSlug | null;

    document.documentElement.dataset.farmTheme = activeFarmSlug ?? "home";
    document.body.dataset.farmTheme = activeFarmSlug ?? "home";
    document.documentElement.dataset.view =
      pathname === PORTFOLIO_ROUTE
        ? "portfolio"
        : pathname === GAMES_ROUTE || pathname === TETRIS_ROUTE
          ? "games"
          : activeTokenSlug
            ? "token"
            : "home";
    document.body.dataset.view =
      pathname === PORTFOLIO_ROUTE
        ? "portfolio"
        : pathname === GAMES_ROUTE || pathname === TETRIS_ROUTE
          ? "games"
          : activeTokenSlug
            ? "token"
            : "home";
  }, [pathname]);

  useEffect(() => {
    function syncViewport() {
      const viewportHeight = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--app-height", `${viewportHeight}px`);
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        window.setTimeout(syncViewport, 50);
      }
    }

    function handlePopState() {
      setPathname(normalizePath(window.location.pathname));
    }

    syncViewport();
    window.addEventListener("pageshow", syncViewport);
    window.addEventListener("orientationchange", syncViewport);
    window.addEventListener("resize", syncViewport);
    window.addEventListener("popstate", handlePopState);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pageshow", syncViewport);
      window.removeEventListener("orientationchange", syncViewport);
      window.removeEventListener("resize", syncViewport);
      window.removeEventListener("popstate", handlePopState);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  function navigate(nextPath: string) {
    const normalized = normalizePath(nextPath);
    if (normalized === pathname) {
      return;
    }

    window.history.pushState({}, "", normalized);
    setPathname(normalized);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const activeTokenSlug = getTokenSlugFromPath(pathname);
  const activeToken = activeTokenSlug ? tokensBySlug[activeTokenSlug] : null;
  const activeFarmSlug = activeToken?.farmSlug ?? null;
  const isPortfolioRoute = pathname === PORTFOLIO_ROUTE;
  const isGamesRoute = pathname === GAMES_ROUTE;
  const isTetrisRoute = pathname === TETRIS_ROUTE;

  return (
    <>
      <SiteHeader
        currentPath={pathname}
        tokens={tokens}
        onNavigate={navigate}
      />
      {isPortfolioRoute ? (
        <PortfolioPage tokens={tokens} onNavigate={navigate} />
      ) : isTetrisRoute ? (
        <TetrisPage onNavigate={navigate} />
      ) : isGamesRoute ? (
        <GamesPage onNavigate={navigate} />
      ) : activeToken ? (
        <TokenPage
          key={activeToken.slug}
          token={activeToken}
          tokens={tokens}
          onNavigate={navigate}
        >
          {activeFarmSlug ? (
            <FarmProvider config={farmConfigs[activeFarmSlug]}>
              <FarmDashboard />
            </FarmProvider>
          ) : null}
        </TokenPage>
      ) : (
        <HomePage
          tokens={tokens}
          onNavigate={navigate}
        />
      )}
    </>
  );
}
