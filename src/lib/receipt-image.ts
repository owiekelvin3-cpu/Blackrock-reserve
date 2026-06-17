import { toPng } from "html-to-image";

type DownloadReceiptImageOptions = {
  pixelRatio?: number;
  backgroundColor?: string;
  width?: number;
};

function shouldCaptureNode(node: Node): boolean {
  if (!(node instanceof HTMLElement)) return true;
  return node.dataset.receiptExclude === undefined;
}

function waitForImages(element: HTMLElement): Promise<void> {
  const images = Array.from(element.querySelectorAll("img"));
  if (images.length === 0) return Promise.resolve();

  return Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          img.onload = () => resolve();
          img.onerror = () => resolve();
        })
    )
  ).then(() => undefined);
}

function waitForNextFrames(count = 2): Promise<void> {
  return new Promise((resolve) => {
    let remaining = count;
    const step = () => {
      remaining -= 1;
      if (remaining <= 0) resolve();
      else requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

/** Renders a receipt DOM subtree to a PNG and triggers a browser download. */
export async function downloadReceiptAsImage(
  element: HTMLElement,
  filename: string,
  options: DownloadReceiptImageOptions = {}
): Promise<void> {
  const isLight =
    typeof document !== "undefined" &&
    document.documentElement.getAttribute("data-theme") === "light";
  const {
    pixelRatio = 3,
    backgroundColor = isLight ? "#f6f7f9" : "#141416",
    width = 440,
  } = options;

  const wrapper = document.createElement("div");
  wrapper.setAttribute("aria-hidden", "true");
  wrapper.style.cssText =
    "position:fixed;left:-12000px;top:0;z-index:-1;pointer-events:none;overflow:visible;";

  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.transform = "none";
  clone.style.overflow = "visible";
  clone.style.maxHeight = "none";
  clone.style.width = `${width}px`;
  clone.style.boxSizing = "border-box";

  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  try {
    await waitForImages(clone);
    await waitForNextFrames();

    const height = Math.ceil(
      Math.max(clone.scrollHeight, clone.offsetHeight, clone.getBoundingClientRect().height)
    );
    const captureWidth = Math.ceil(
      Math.max(clone.scrollWidth, clone.offsetWidth, width, clone.getBoundingClientRect().width)
    );

    const dataUrl = await toPng(clone, {
      width: captureWidth,
      height,
      pixelRatio,
      cacheBust: true,
      backgroundColor,
      filter: shouldCaptureNode,
      style: {
        transform: "none",
        overflow: "visible",
        maxHeight: "none",
        width: `${captureWidth}px`,
        height: `${height}px`,
      },
    });

    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename.endsWith(".png") ? filename : `${filename}.png`;
    link.click();
  } finally {
    wrapper.remove();
  }
}
