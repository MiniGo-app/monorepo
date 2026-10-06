import { useEffect, useRef } from "react";
import { createFeed } from "../lib/feed";
import { open as openPaper, unroll } from "../lib/roll";
import { buildTearShape } from "../lib/tear";

const tearShape = buildTearShape();

export function Paper() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const rollRef = useRef<HTMLDivElement>(null);
  const tearRef = useRef<SVGSVGElement>(null);
  const feedRef = useRef<HTMLUListElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const paper = paperRef.current;
    const roll = rollRef.current;
    const tear = tearRef.current;
    const feed = feedRef.current;
    const body = bodyRef.current;
    if (!wrap || !paper || !roll || !tear || !feed || !body) return;

    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const feedController = createFeed({ feed, body, reduced });
    feedController.fill();

    if (reduced) {
      openPaper(paper, roll, tear);
      return;
    }

    let cancelled = false;
    // The text rises in first, then the paper unrolls, then the roll starts feeding.
    const timer = window.setTimeout(() => {
      unroll({ wrap, paper, roll, tear, feed }).then(() => {
        if (!cancelled) feedController.start(1100);
      });
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="paper-zone">
      <div className="paper-wrap" ref={wrapRef}>
        <div className="paper" ref={paperRef} aria-hidden="true">
          <div className="sheet" />
          <div className="crumple" />
          <div className="paper-body" ref={bodyRef}>
            <div className="p-head">
              <div className="p-title">
                <span>MINIGO</span>
                <span>HOME</span>
              </div>
              <div className="p-sub">Every app in one</div>
              <div className="rule" />
            </div>
            <ul className="feed" ref={feedRef} />
            <div className="p-foot">
              <div className="rule" />
              <div className="p-check">
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
                Keys backed up · encrypted
              </div>
            </div>
          </div>
          <div className="creases">
            <i className="crease" style={{ top: "27%", transform: "rotate(-0.9deg)" }} />
            <i className="crease" style={{ top: "63%", transform: "rotate(0.7deg)" }} />
            <i className="crease short" style={{ top: "84%", left: "-1%", width: "46%", transform: "rotate(-13deg)" }} />
          </div>
        </div>
        <svg className="tear" ref={tearRef} viewBox={tearShape.viewBox} preserveAspectRatio="none" aria-hidden="true">
          <path d={tearShape.path} fill="#EFEBE2" />
        </svg>
        <div className="roll" ref={rollRef} aria-hidden="true" />
      </div>
    </div>
  );
}
