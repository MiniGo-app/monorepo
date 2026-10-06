import { useEffect, useState, type CSSProperties, type TransitionEvent } from "react";
import key from "../illustrations/key.svg?raw";
import backup from "../illustrations/backup.svg?raw";
import connect from "../illustrations/connect.svg?raw";
import approve from "../illustrations/approve.svg?raw";
import assets from "../illustrations/assets.svg?raw";
import receipt from "../illustrations/receipt.svg?raw";
import apps from "../illustrations/apps.svg?raw";

type Slide = { label: string; title: string; art: string; apps?: string[] };

const SLIDES: Slide[] = [
  { label: "Your keys", title: "Your keys stay on your phone.", art: key },
  { label: "Backup", title: "Lose your phone, not your wallet.", art: backup },
  { label: "Connect", title: "Choose which apps connect.", art: connect },
  { label: "Approve", title: "Review each request before signing.", art: approve },
  { label: "Assets", title: "See your Stellar assets.", art: assets },
  { label: "Payments", title: "Find past payments.", art: receipt },
  { label: "Mini apps", title: "Open Stellar apps with MiniGo.", art: apps, apps: ["Blend", "Aquarius", "Fundable", "Soroswap"] },
];

const GROUPS = [
  { label: "Your keys and backup", first: 0 },
  { label: "Connecting and approving", first: 2 },
  { label: "Assets and receipts", first: 4 },
  { label: "Mini apps", first: 6 },
];
const groupOf = (slide: number) => GROUPS.reduce((found, group, i) => (group.first <= slide ? i : found), 0);

const SLIDE_MS = 4000;

interface ShowcaseProps {
  paused: boolean;
}

export function Showcase({ paused }: ShowcaseProps) {
  // Duplicate the first slide for a continuous upward loop.
  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [reduced] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches);

  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    if (paused || hovered || hidden || reduced) return;
    const timer = window.setTimeout(() => {
      setAnimate(true);
      setIndex((current) => current + 1);
    }, SLIDE_MS);
    return () => window.clearTimeout(timer);
  }, [index, paused, hovered, hidden, reduced]);

  useEffect(() => {
    if (animate) return;
    const frame = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(frame);
  }, [animate]);

  const onMoved = (event: TransitionEvent) => {
    if (event.target !== event.currentTarget || index < SLIDES.length) return;
    setAnimate(false);
    setIndex(0);
  };

  const current = index % SLIDES.length;
  const active = groupOf(current);
  const strip = [...SLIDES, SLIDES[0]];

  return (
    <section
      className="showcase rise"
      style={{ "--d": ".5s" } as CSSProperties}
      aria-roledescription="carousel"
      aria-label="What MiniGo does"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
    >
      <div className="sc-window">
        <div
          className="sc-strip"
          style={{
            transform: `translateY(${(-index * 100) / strip.length}%)`,
            transition: animate && !reduced ? undefined : "none",
          }}
          onTransitionEnd={onMoved}
        >
          {strip.map((slide, i) => (
            <div
              className="sc-slide"
              key={i}
              aria-roledescription="slide"
              aria-label={`${(i % SLIDES.length) + 1} of ${SLIDES.length}`}
              aria-hidden={i !== index}
            >
              <div className="hl hl-dark" dangerouslySetInnerHTML={{ __html: slide.art }} />
              <div className="sc-label">{slide.label}</div>
              <div className="sc-title">{slide.title}</div>
              {slide.apps && (
                <ul className="sc-apps">
                  {slide.apps.map((name) => (
                    <li key={name}>{name}</li>
                  ))}
                  <li className="more">and more</li>
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="sc-dots">
        {GROUPS.map((group, i) => (
          <button
            key={group.label}
            type="button"
            aria-label={`Show ${group.label.toLowerCase()}`}
            aria-current={i === active}
            onClick={() => {
              setAnimate(true);
              setIndex(group.first);
            }}
          >
            <span />
          </button>
        ))}
      </div>
    </section>
  );
}
