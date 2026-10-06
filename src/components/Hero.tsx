import type { CSSProperties } from "react";

interface HeroProps {
  onOpenTry: () => void;
  onOpenHow: () => void;
}

export function Hero({ onOpenTry, onOpenHow }: HeroProps) {
  return (
    <main className="copy">
      <h1>
        <span className="line dim rise" style={{ "--d": ".3s" } as CSSProperties}>
          One home for
        </span>
        <span className="line rise" style={{ "--d": ".42s" } as CSSProperties}>
          everything crypto.
        </span>
      </h1>
      <p className="lead rise" style={{ "--d": ".6s" } as CSSProperties}>
        Easy to set up with no seed phrase to write down. Your keys back themselves up encrypted so a lost phone
        is not a lost wallet.
      </p>
      <div className="actions rise" style={{ "--d": ".75s" } as CSSProperties}>
        <button className="btn btn-solid" type="button" onClick={onOpenTry}>
          Try it on testnet
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
        <button className="btn btn-ghost" type="button" onClick={onOpenHow}>
          <svg width={13} height={13} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M6 4l14 8-14 8z" />
          </svg>
          See how it works
        </button>
      </div>
      <p className="demo rise" style={{ "--d": ".9s" } as CSSProperties}>
        Demo. Some of the apps shown are examples.
      </p>
    </main>
  );
}
