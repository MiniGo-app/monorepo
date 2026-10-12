import { useEffect, useRef, useState } from "react";
import { Dialog } from "./Dialog";

const WIDE = "video/minigo-pitch.mp4";
const TALL = "video/minigo-pitch-vertical.mp4";
const tallScreen = () => matchMedia("(max-width: 640px) and (orientation: portrait)").matches;

interface VideoDialogProps {
  open: boolean;
  onClose: () => void;
}

export function VideoDialog({ open, onClose }: VideoDialogProps) {
  const video = useRef<HTMLVideoElement>(null);
  const [tall, setTall] = useState(tallScreen);

  useEffect(() => {
    if (open) setTall(tallScreen());
  }, [open]);

  useEffect(() => {
    const player = video.current;
    if (!player) return;
    if (!open) return player.pause();
    player.currentTime = 0;
    player.play().catch(() => {});
  }, [open, tall]);

  return (
    <Dialog open={open} onClose={onClose} titleId="howTitle" title="How MiniGo works" hideTitle className={`video-dlg${tall ? " tall" : ""}`}>
      <video ref={video} src={tall ? TALL : WIDE} controls playsInline preload="none" />
      <button className="video-close" type="button" aria-label="Close video" onClick={onClose}>
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </Dialog>
  );
}
