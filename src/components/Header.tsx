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
        <a className="link" href="https://github.com/MiniGo-app" rel="noopener">
          GitHub
        </a>
        <button className="btn btn-solid btn-sm" type="button" onClick={onOpenTry}>
          Try it
        </button>
      </div>
    </header>
  );
}
