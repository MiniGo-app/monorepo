import type { CSSProperties } from "react";

interface HeaderProps {
  onOpenTry: () => void;
}

export function Header({ onOpenTry }: HeaderProps) {
  return (
    <header className="hdr">
      <a className="brand rise" href="./" style={{ "--d": ".05s" } as CSSProperties} aria-label="MiniGo home">
        <svg className="logo" width={17} height={26} viewBox="456.66 283.99 613.31 956.73" aria-hidden="true">
          <circle className="l-ring" cx={742.16} cy={723.5} r={257} pathLength={1} fill="none" stroke="#fff" strokeWidth={57} />
          <circle className="l-dot" cx={982.18} cy={360.95} r={76.96} fill="#fff" />
          <path className="l-arc" d="M1029.75 982.94A169.44 169.44 0 0 1 711.78 1100.15" pathLength={1} fill="none" stroke="#fff" strokeWidth={59.56} />
        </svg>
        <span className="brand-name">MiniGo</span>
      </a>
      <div className="hdr-right rise" style={{ "--d": ".15s" } as CSSProperties}>
        <span className="net">
          <span className="net-dot" aria-hidden="true" />
          <span className="net-long">Live on testnet</span>
          <span className="net-short">Testnet</span>
        </span>
        <a className="link" href="https://github.com/orgs/MiniGo-app" target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
        <a className="link x-link" href="https://x.com/minigo_app" target="_blank" rel="noopener noreferrer" aria-label="MiniGo on X">
          <svg width={17} height={17} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </a>
        <button className="btn btn-solid btn-sm" type="button" onClick={onOpenTry}>
          Android app
        </button>
      </div>
    </header>
  );
}
