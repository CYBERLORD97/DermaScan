import { useState, useEffect } from 'react';

interface TransparentLogoProps {
  src: string;
  alt: string;
  className?: string;
  /**
   * Color-distance tolerance for flood-fill background removal.
   * Higher = removes more surrounding halo pixels. Default: 40
   */
  tolerance?: number;
}

/**
 * Removes the logo background using a corner-seeded flood-fill:
 *   1. Sample the background color from the top-left corner pixel.
 *   2. BFS-flood from all 4 corners, making every contiguous pixel whose
 *      Euclidean RGB distance to the bg color is ≤ tolerance transparent.
 *   3. All non-background pixels (logo colors) are untouched.
 * Falls back to a plain <img> if cross-origin canvas access is blocked.
 */
function removeBackground(imageData: ImageData, tolerance: number): void {
  const { data, width, height } = imageData;

  // Sample background color from top-left corner
  const bgR = data[0];
  const bgG = data[1];
  const bgB = data[2];

  const visited = new Uint8Array(width * height);
  const queue: number[] = [];

  // Seed from all 4 corners
  const corners = [
    0,
    width - 1,
    (height - 1) * width,
    (height - 1) * width + (width - 1),
  ];
  for (const seed of corners) {
    if (!visited[seed]) {
      visited[seed] = 1;
      queue.push(seed);
    }
  }

  while (queue.length > 0) {
    const pixelIdx = queue.pop()!;
    const pIdx = pixelIdx * 4;
    const r = data[pIdx];
    const g = data[pIdx + 1];
    const b = data[pIdx + 2];

    const dist = Math.sqrt(
      (r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2
    );

    if (dist > tolerance) continue; // not background — stop spreading

    data[pIdx + 3] = 0; // make transparent

    const x = pixelIdx % width;
    const y = Math.floor(pixelIdx / width);

    const neighbors = [
      x > 0 ? pixelIdx - 1 : -1,
      x < width - 1 ? pixelIdx + 1 : -1,
      y > 0 ? pixelIdx - width : -1,
      y < height - 1 ? pixelIdx + width : -1,
    ];

    for (const n of neighbors) {
      if (n >= 0 && !visited[n]) {
        visited[n] = 1;
        queue.push(n);
      }
    }
  }
}

export default function TransparentLogo({
  src,
  alt,
  className,
  tolerance = 40,
}: TransparentLogoProps) {
  const [processedSrc, setProcessedSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      if (cancelled) return;
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) { setFailed(true); return; }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        removeBackground(imageData, tolerance);

        ctx.putImageData(imageData, 0, 0);
        setProcessedSrc(canvas.toDataURL('image/png'));
      } catch {
        if (!cancelled) setFailed(true);
      }
    };

    img.onerror = () => { if (!cancelled) setFailed(true); };
    img.src = src;

    return () => { cancelled = true; };
  }, [src, tolerance]);

  // Invisible placeholder while processing (reserves layout space)
  if (!processedSrc && !failed) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        style={{ opacity: 0 }}
        aria-hidden="true"
      />
    );
  }

  return (
    <img
      src={failed ? src : (processedSrc ?? src)}
      alt={alt}
      className={className}
    />
  );
}
