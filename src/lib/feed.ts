// The roll never runs out of apps. Every couple of seconds a new one prints at the top: the new row grows from
// nothing, which ratchets the whole roll down one row, and the oldest row dissolves at the bottom and is removed.
import { APPS } from "../data/apps";

export interface FeedElements {
  feed: HTMLElement;
  body: HTMLElement;
  reduced: boolean;
}

export interface Feed {
  fill: () => void;
  start: (after?: number) => void;
}

export function createFeed({ feed, body, reduced }: FeedElements): Feed {
  let next = 0;
  let timer = 0;

  const rowHeight = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--row-h")) || 60;
  // One row more than fits, so the oldest is always half out of the window rather than popping away.
  const capacity = () => Math.max(3, Math.ceil(feed.clientHeight / rowHeight()) + 1);
  const busy = () => document.hidden || document.querySelector("dialog[open]");

  function makeRow(app: (typeof APPS)[number]) {
    const li = document.createElement("li");
    li.className = "row";
    li.innerHTML = `${app.icon}<div class="txt"><b>${app.name}</b><small>${app.detail}</small></div>`;
    return li;
  }

  // A small mechanical shudder each time the roll advances.
  function shudder() {
    if (reduced || !body.animate) return;
    body.animate(
      [
        { transform: "translateY(0) rotate(0deg)" },
        { transform: "translateY(3px) rotate(0.25deg)", offset: 0.22 },
        { transform: "translateY(-1px) rotate(-0.08deg)", offset: 0.55 },
        { transform: "translateY(0) rotate(0deg)" },
      ],
      { duration: 620, easing: "cubic-bezier(0.3, 0.9, 0.2, 1)" },
    );
  }

  function trim() {
    while (feed.children.length > capacity()) feed.lastElementChild?.remove();
  }

  function print({ animate = true }: { animate?: boolean } = {}) {
    const row = makeRow(APPS[next++ % APPS.length]);
    if (animate && !reduced) {
      row.classList.add("enter");
      feed.prepend(row);
      void row.offsetHeight; // start the row collapsed, then let it grow
      requestAnimationFrame(() => row.classList.add("in"));
      shudder();
    } else {
      feed.prepend(row);
    }
    trim();
  }

  // The roll comes out of the box already written on, so the first thing you see is a full sheet.
  function fill() {
    while (feed.children.length < (reduced ? Math.min(APPS.length, capacity()) : capacity())) print({ animate: false });
  }

  function tick() {
    if (!busy()) print();
    timer = window.setTimeout(tick, 1900 + Math.random() * 500);
  }

  function start(after = 1200) {
    if (reduced) return;
    clearTimeout(timer);
    timer = window.setTimeout(tick, after);
  }

  // Re-fit when the window changes size (rotating a phone, resizing a window).
  addEventListener("resize", () => {
    trim();
    fill();
  });

  return { fill, start };
}
