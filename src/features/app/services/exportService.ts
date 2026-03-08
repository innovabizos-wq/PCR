const externalScriptCache = new Map<string, Promise<void>>();

const loadExternalScript = (src: string): Promise<void> => {
  const cached = externalScriptCache.get(src);
  if (cached) return cached;

  const pending = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error(`No se pudo cargar ${src}`)), { once: true });
      if (existing.dataset.loaded === 'true') resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    script.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
    document.head.appendChild(script);
  });

  externalScriptCache.set(src, pending);
  return pending;
};

export const ensureHtml2Canvas = async () => {
  const scopedWindow = window as Window & {
    html2canvas?: (
      element: HTMLElement,
      options?: {
        useCORS?: boolean;
        allowTaint?: boolean;
        scale?: number;
        backgroundColor?: string;
        foreignObjectRendering?: boolean;
        scrollX?: number;
        scrollY?: number;
        windowWidth?: number;
        windowHeight?: number;
      }
    ) => Promise<HTMLCanvasElement>;
  };
  if (!scopedWindow.html2canvas) {
    await loadExternalScript('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js');
  }
  if (!scopedWindow.html2canvas) throw new Error('html2canvas no disponible');
  return scopedWindow.html2canvas;
};

export const ensureJsPdf = async () => {
  if (!(window as Window & { jspdf?: { jsPDF?: unknown } }).jspdf?.jsPDF) {
    await loadExternalScript('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js');
  }
  const jsPDF = (window as Window & { jspdf?: { jsPDF?: unknown } }).jspdf?.jsPDF;
  if (!jsPDF) throw new Error('jsPDF no disponible');
  return jsPDF as new (options?: { orientation?: string; unit?: string; format?: string | number[] }) => {
    internal: { pageSize: { getWidth: () => number; getHeight: () => number } };
    addImage: (
      imageData: string,
      format: string,
      x: number,
      y: number,
      width: number,
      height: number,
      alias?: string,
      compression?: 'NONE' | 'FAST' | 'MEDIUM' | 'SLOW'
    ) => void;
    save: (filename: string) => void;
  };
};
