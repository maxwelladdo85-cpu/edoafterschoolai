import { RefObject, useCallback, useEffect, useRef, useState } from "react";

type SideScrollBarProps = {
  targetRef: RefObject<HTMLElement | null>;
};

type ScrollMetrics = {
  canScroll: boolean;
  thumbTop: number;
  thumbHeight: number;
};

export function SideScrollBar({ targetRef }: SideScrollBarProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef(0);
  const [metrics, setMetrics] = useState<ScrollMetrics>({
    canScroll: false,
    thumbTop: 0,
    thumbHeight: 100,
  });

  const updateMetrics = useCallback(() => {
    const target = targetRef.current;
    const rail = railRef.current;
    if (!target || !rail) return;

    const { scrollTop, scrollHeight, clientHeight } = target;
    const railHeight = rail.clientHeight;
    const canScroll = scrollHeight > clientHeight + 1;
    const thumbHeight = canScroll
      ? Math.max(44, (clientHeight / scrollHeight) * railHeight)
      : railHeight;
    const maxThumbTop = Math.max(0, railHeight - thumbHeight);
    const maxScrollTop = Math.max(1, scrollHeight - clientHeight);
    const thumbTop = canScroll ? (scrollTop / maxScrollTop) * maxThumbTop : 0;

    setMetrics({ canScroll, thumbTop, thumbHeight });
  }, [targetRef]);

  const scrollFromClientY = useCallback(
    (clientY: number) => {
      const target = targetRef.current;
      const rail = railRef.current;
      if (!target || !rail) return;

      const railRect = rail.getBoundingClientRect();
      const maxThumbTop = Math.max(1, railRect.height - metrics.thumbHeight);
      const rawTop = clientY - railRect.top - dragOffsetRef.current;
      const nextThumbTop = Math.min(maxThumbTop, Math.max(0, rawTop));
      const maxScrollTop = Math.max(0, target.scrollHeight - target.clientHeight);
      target.scrollTop = (nextThumbTop / maxThumbTop) * maxScrollTop;
    },
    [metrics.thumbHeight, targetRef],
  );

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    updateMetrics();
    target.addEventListener("scroll", updateMetrics, { passive: true });
    window.addEventListener("resize", updateMetrics);
    const observer = new ResizeObserver(updateMetrics);
    observer.observe(target);

    return () => {
      target.removeEventListener("scroll", updateMetrics);
      window.removeEventListener("resize", updateMetrics);
      observer.disconnect();
    };
  }, [targetRef, updateMetrics]);

  if (!metrics.canScroll) return null;

  return (
    <div
      ref={railRef}
      aria-label="Page scroll bar"
      className="fixed right-1 top-20 bottom-20 z-50 w-7 touch-none rounded-full bg-muted/80 p-1 shadow-lg ring-1 ring-border backdrop-blur sm:right-2"
      onPointerDown={(event) => {
        const rail = railRef.current;
        if (!rail) return;
        const thumbTop = event.clientY - rail.getBoundingClientRect().top;
        dragOffsetRef.current = metrics.thumbHeight / 2;
        if (thumbTop >= metrics.thumbTop && thumbTop <= metrics.thumbTop + metrics.thumbHeight) {
          dragOffsetRef.current = thumbTop - metrics.thumbTop;
        }
        event.currentTarget.setPointerCapture(event.pointerId);
        scrollFromClientY(event.clientY);
      }}
      onPointerMove={(event) => {
        if (event.buttons !== 1) return;
        scrollFromClientY(event.clientY);
      }}
    >
      <div
        className="absolute left-1 right-1 rounded-full bg-primary shadow-sm"
        style={{ top: metrics.thumbTop, height: metrics.thumbHeight }}
      />
    </div>
  );
}