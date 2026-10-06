// Unrolling the paper like a scroll.
//
// A roll of paper sits at the leading edge and travels down the page, opening the paper behind it. As it goes it
// gets thinner, because there is less paper left on it, and the whole sheet sways as it comes off the roll. When
// the roll has run out, the sheet gives a little tug, like a receipt being torn off, and settles.
//
// The paper's reveal, the roll's travel and the sway share one duration and one easing curve, so the roll always
// sits exactly on the edge of the paper it is opening.

const DURATION = 2600;
const CURVE: [number, number, number, number] = [0.5, 0.02, 0.2, 1];
const EASING = `cubic-bezier(${CURVE.join(",")})`;

// For a point that is `progress` of the way down the paper, the moment the roll gets there (0 to 1 of the duration).
function timeAtProgress([x1, y1, x2, y2]: [number, number, number, number], progress: number) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const at = (a: number, b: number, c: number, t: number) => ((a * t + b) * t + c) * t;
  let lo = 0, hi = 1;
  for (let i = 0; i < 32; i++) {
    const mid = (lo + hi) / 2;
    if (at(ay, by, cy, mid) < progress) lo = mid;
    else hi = mid;
  }
  return at(ax, bx, cx, (lo + hi) / 2);
}

export interface RollElements {
  wrap: HTMLElement;
  paper: HTMLElement;
  roll: HTMLElement;
  tear: SVGElement;
  feed: HTMLElement;
}

export function open(paper: HTMLElement, roll: HTMLElement, tear: SVGElement) {
  paper.classList.add("open");
  tear.classList.add("torn");
  roll.style.opacity = "0";
}

export async function unroll({ wrap, paper, roll, tear, feed }: RollElements) {
  const height = wrap.offsetHeight;
  const timing: KeyframeAnimationOptions = { duration: DURATION, easing: EASING, fill: "forwards" };
  const animations: Animation[] = [];
  const run = (element: Element, keyframes: Keyframe[], options: KeyframeAnimationOptions) => {
    const animation = element.animate(keyframes, options);
    animations.push(animation);
    return animation;
  };

  roll.style.opacity = "1";
  const opening = run(paper, [{ clipPath: "inset(0 -20px 100% -20px)" }, { clipPath: "inset(0 -20px -20px -20px)" }], timing);
  run(roll, [{ transform: "translateY(0) scaleY(1)" }, { transform: `translateY(${height}px) scaleY(0.3)` }], timing);
  run(wrap, [{ transform: "rotate(1.6deg)" }, { transform: "rotate(3deg)" }], timing);

  // Each icon pops just as the roll passes over it.
  for (const row of Array.from(feed.children)) {
    const icon = row.querySelector(".ico");
    if (!icon) continue;
    const rowEl = row as HTMLElement;
    const y = feed.offsetTop + rowEl.offsetTop + rowEl.offsetHeight / 2;
    const delay = timeAtProgress(CURVE, Math.min(1, y / height)) * DURATION;
    run(icon, [{ transform: "scale(0.45)", opacity: 0 }, { transform: "scale(1)", opacity: 1 }], {
      duration: 460,
      delay,
      easing: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      fill: "both",
    });
  }

  await opening.finished;

  // The roll is used up; the paper is torn off with a small tug.
  run(roll, [{ transform: `translateY(${height}px) scaleY(0.3)`, opacity: 1 }, { transform: `translateY(${height + 10}px) scaleY(0.05)`, opacity: 0 }], {
    duration: 240,
    fill: "forwards",
  });
  run(tear, [{ opacity: 0 }, { opacity: 1 }], { duration: 160, fill: "forwards" });
  const tug = run(
    wrap,
    [
      { transform: "rotate(3deg) translateY(0)" },
      { transform: "rotate(3.5deg) translateY(12px)", offset: 0.3 },
      { transform: "rotate(2.8deg) translateY(-3px)", offset: 0.62 },
      { transform: "rotate(3deg) translateY(0)" },
    ],
    { duration: 760, easing: "cubic-bezier(0.3, 0.9, 0.2, 1)" },
  );
  await tug.finished;

  // Hand the final look back to the stylesheet and let go of the animations.
  open(paper, roll, tear);
  animations.forEach((animation) => animation.cancel());
}
