import { useMemo, useRef } from 'react';
import { CalculationResult } from '../types/calculator';

interface VisualizerProps {
  result: CalculationResult;
  color?: 'transparente' | 'bronce' | 'azul' | 'gris' | 'blanco' | 'humo';
  containerWidthPx?: number;
  containerHeightPx?: number;
  minSheetHeightPx?: number;
}



type Html2CanvasFn = (
  element: HTMLElement,
  options?: { useCORS?: boolean; allowTaint?: boolean; scale?: number }
) => Promise<HTMLCanvasElement>;

declare global {
  interface Window {
    html2canvas?: Html2CanvasFn;
  }
}
/** medidas reales del tile PNG (m) */
const TILE_M_WIDTH = 2.10;
const TILE_M_HEIGHT = 2.90;

const textureMap: Record<string, string> = {
  transparente: '/textures/transparente.png',
  bronce: '/textures/BRONCE.png',
  azul: '/textures/azul.png',
  gris: '/textures/gris.png',
  blanco: '/textures/blanco.png',
  humo: '/textures/Humo.png'
};

export default function Visualizer({
  result,
  color = 'blanco',
  containerWidthPx = 980,
  containerHeightPx = 420,
  minSheetHeightPx = 140
}: VisualizerProps) {
  const texture = textureMap[color] || textureMap.bronce;

  const rootRef = useRef<HTMLDivElement | null>(null);     // captura header + caja
  const outerBoxRef = useRef<HTMLDivElement | null>(null); // la caja blanca (donde van cotas afuera)
  const contentRef = useRef<HTMLDivElement | null>(null);  // content (las láminas)

  const sheets = useMemo(() => {
    return Array.from({ length: result.numSheets }, (_, i) => {
      const isLast = i === result.numSheets - 1;
      const width = isLast ? result.cutWidth : result.sheetWidth;
      return { index: i, width };
    });
  }, [result.numSheets, result.cutWidth, result.sheetWidth]);

  const totalWidthMeters = useMemo(() => {
    return Math.max(0.0001, sheets.reduce((s, sh) => s + sh.width, 0));
  }, [sheets]);

  // real dimensions (meters)
  const realW = Math.max(0.0001, result.width);
  const realH = Math.max(0.0001, result.height);

  // compute scale (px per meter)
  const scale = useMemo(() => {
    const paddingX = 40; // breathing room for cotas
    const paddingY = 80; // extra vertical breathing for cotas below/above
    const usableW = Math.max(10, containerWidthPx - paddingX);
    const usableH = Math.max(10, containerHeightPx - paddingY);
    const s = Math.min(usableW / realW, usableH / realH);
    const minScale = 4;
    const maxScale = 200;
    return Math.max(minScale, Math.min(maxScale, s));
  }, [realW, realH, containerWidthPx, containerHeightPx]);

  // content pixel dims (content box is centered inside the fixed container)
  const contentWidthPx = Math.round(realW * scale);
  const contentHeightPx = Math.max(Math.round(realH * scale), minSheetHeightPx);

  const sheetGapPx = 6; // separación reducida

  // tile pixel size derived from real tile meters -> keeps texture at correct scale
  const tilePxW = Math.max(2, Math.round(TILE_M_WIDTH * scale));
  const tilePxH = Math.max(2, Math.round(TILE_M_HEIGHT * scale));


  // Logo local solicitado (public/logo.png)
  const logoUrl = '/logo.png';

  // GRID: tuned to be less cargada (menos cuadros)
  const pixelsPerMeter = scale;
  const majorGridSizeMeters = 0.7; // mayor (70cm) - mantiene referencia
  const majorGridSizePx = Math.max(6, Math.round(pixelsPerMeter * majorGridSizeMeters));
  // minor grid now 35cm (menos carga visual que 10cm)
  const minorGridMeters = 0.35; // 35cm
  const minorGridSizePx = Math.max(3, Math.round(pixelsPerMeter * minorGridMeters));
  // colors: make minor subtle
  const minorGridColor = 'rgba(10,20,30,0.04)';
  const majorGridColor = 'rgba(10,20,30,0.12)';

  // capture function: uses html2canvas loaded dynamically, then uses toBlob->download
  const captureAsImage = async () => {
    const el = rootRef.current;
    if (!el) return;
    // load html2canvas dynamically if needed
    if (typeof window.html2canvas === 'undefined') {
      await new Promise<void>((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error('No se pudo cargar html2canvas'));
        document.head.appendChild(s);
      });
    }
    try {
      const html2canvas = window.html2canvas;
      if (!html2canvas) {
        throw new Error('html2canvas no disponible');
      }
      const canvas: HTMLCanvasElement = await html2canvas(el, {
        useCORS: true,
        allowTaint: true,
        scale: 2
      });
      canvas.toBlob((blob) => {
        if (!blob) {
          alert('Error al generar la imagen.');
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `visualizador_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      }, 'image/png', 1.0);
    } catch (err) {
      console.error('Capture failed', err);
      alert('No se pudo tomar la captura. Revisa CORS de las imágenes o la consola para detalles.');
    }
  };

  // calculate content position (centered) inside the outer box (which has padding 12)
  const outerPadding = 12;
  const innerWidth = containerWidthPx - outerPadding * 2;
  const innerHeight = containerHeightPx - outerPadding * 2;
  const contentLeftInBox = Math.round((containerWidthPx - contentWidthPx) / 2);
  const contentTopInBox = Math.round((containerHeightPx - contentHeightPx) / 2);

  // Precompute grid background CSS (arquitectónico): minor + major lines using multiple backgrounds.
  const gridBackgroundImage = useMemo(() => {
    const majorV = `linear-gradient(to right, ${majorGridColor} 1px, transparent 1px)`;
    const majorH = `linear-gradient(to bottom, ${majorGridColor} 1px, transparent 1px)`;
    const minorV = `linear-gradient(to right, ${minorGridColor} 1px, transparent 1px)`;
    const minorH = `linear-gradient(to bottom, ${minorGridColor} 1px, transparent 1px)`;
    return `${majorV}, ${majorH}, ${minorV}, ${minorH}`;
  }, [majorGridColor, minorGridColor]);

  const gridBackgroundSize = useMemo(() => {
    return `${majorGridSizePx}px ${majorGridSizePx}px, ${majorGridSizePx}px ${majorGridSizePx}px, ${minorGridSizePx}px ${minorGridSizePx}px, ${minorGridSizePx}px ${minorGridSizePx}px`;
  }, [majorGridSizePx, minorGridSizePx]);

  // recommended sheet size: use tile width and total height (user example style)
  const recommendedSheetLabel = `${TILE_M_WIDTH.toFixed(2)} x ${realH.toFixed(2)} m`;

  return (
    <section style={{ padding: 12 }} ref={rootRef} id="visualizer-root">
      {/* HEADER: left block modified per request */}
      <div style={{ width: containerWidthPx, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
           {/* Main title: Visualizador 2D (2D en negrita) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              
              <h3 style={{ margin: 2, fontSize: 20, fontWeight: 400, color: '#0f172a', letterSpacing: '0.6px' }}>
                <span style={{ fontWeight: 500 }}>Visualizador </span>
                <span style={{ fontWeight: 500 }}>2D</span>
                <span style={{ fontWeight: 500 }}> Policarbonato</span>
              </h3>
            </div>

            {/* Recommended sheet small label (non-bold, small) */}
            <div style={{ marginLeft: 2, fontSize: 12, color: '#374151', opacity: 0.85 }}>
              Lámina recomendada: {recommendedSheetLabel}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* logo first, camera second (swapped) */}
          <img src={logoUrl} alt="Policarbonato CR" style={{ height: 36, objectFit: 'contain', display: 'block' }} />
          <button
            onClick={captureAsImage}
            title="Descargar imagen del visualizador"
            aria-label="Capturar visualizador"
            style={{
              background: 'transparent',
              border: '1px solid rgba(0,0,0,0.06)',
              padding: 6,
              borderRadius: 8,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 7h3l2-2h6l2 2h3v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" stroke="#0f172a" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="13" r="3.5" stroke="#0f172a" strokeWidth="1.2"/>
            </svg>
          </button>
        </div>
      </div>

      {/* OUTER BOX: white framed area where we will show grid behind and cotas outside */}
      <div
        ref={outerBoxRef}
        style={{
          position: 'relative',
          width: containerWidthPx,
          height: containerHeightPx,
          background: '#efefef', // contenedor al fondo, tono suave
          border: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 8px 20px rgba(2,6,23,0.06)',
          overflow: 'hidden',
          padding: outerPadding,
          boxSizing: 'border-box',
        }}
      >
        {/* GRID LAYER: ahora con doble capa arquitectónica (major + minor).
            zIndex = 6 para que esté por delante del fondo pero detrás de las láminas (zIndex 12)
        */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: outerPadding,
            top: outerPadding,
            width: innerWidth,
            height: innerHeight,
            backgroundImage: gridBackgroundImage,
            backgroundSize: gridBackgroundSize,
            zIndex: 6,
            pointerEvents: 'none',
            opacity: 0.95,
            // performance hints
            willChange: 'opacity, background-position',
            transform: 'translateZ(0)'
          }}
        />

        {/* Content wrapper (centered) */}
        <div
          style={{
            position: 'absolute',
            left: contentLeftInBox,
            top: contentTopInBox,
            width: contentWidthPx,
            height: contentHeightPx,
            display: 'flex',
            alignItems: 'stretch',
            justifyContent: 'center',
            zIndex: 12
          }}
        >
          {/* sheets row */}
          <div
            ref={contentRef}
            style={{
              position: 'relative',
              zIndex: 12,
              display: 'flex',
              gap: sheetGapPx,
              alignItems: 'stretch',
              height: '100%'
            }}
          >
            {sheets.map((sheet) => {
              const sheetPx = Math.max(8, Math.round((sheet.width / totalWidthMeters) * contentWidthPx));
              return (
                <div
                  key={sheet.index}
                  style={{
                    width: sheetPx,
                    height: '100%',
                    position: 'relative',
                    overflow: 'hidden',
                    // internal subtle edges kept but NOT the seam overlay lines
                    borderLeft: '1px solid rgba(0,0,0,0.06)',
                    borderRight: '1px solid rgba(255,255,255,0.03)',
                    boxShadow: 'inset 0 6px 12px rgba(0,0,0,0.06)',
                    backgroundColor: 'transparent',
                    // borde exterior MÁS GRUESO según pedido (no se pierdan con el fondo)
                    outline: '3px solid rgba(0,0,0,0.06)',
                    borderRadius: 2,
                    transform: 'translateZ(0)',
                    willChange: 'transform'
                  }}
                >
                  {/* base white to hide grid artefacts (important para eliminar líneas grises visibles) */}
                  <div
                    aria-hidden
                    style={{
                      position: 'absolute',
                      inset: 0,
                      zIndex: 11,
                      backgroundColor: 'rgba(255,255,255,0.96)', // casi opaco para bloquear grid oscuro
                      pointerEvents: 'none'
                    }}
                  />

                  {/* TEXTURE: repeated but slightly less opaque so grid remains subtly visible behind
                      ahora por encima del base white (zIndex 12)
                  */}
                  <div
                    aria-hidden
                    style={{
                      position: 'absolute',
                      inset: 0,
                      zIndex: 12,
                      pointerEvents: 'none',
                      backgroundImage: `url("${texture}")`,
                      backgroundRepeat: 'repeat',
                      backgroundSize: `${tilePxW}px ${tilePxH}px`,
                      transform: 'translateZ(0)',
                      opacity: 0.78,
                      mixBlendMode: 'multiply',
                      imageRendering: 'auto'
                    }}
                  />

                  {/* reflejo suave */}
                  <div
                    aria-hidden
                    style={{
                      position: 'absolute',
                      inset: 0,
                      zIndex: 16,
                      pointerEvents: 'none',
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.12) 18%, rgba(255,255,255,0.02) 35%, transparent 60%)',
                      mixBlendMode: 'screen',
                      filter: 'blur(0.5px)'
                    }}
                  />

                  {/* etiqueta */}
                  <div style={{ position: 'relative', zIndex: 40, textAlign: 'center', color: '#0f172a', pointerEvents: 'none', top: 8 }}>
                    <div style={{ fontWeight: 800, fontSize: 12 }}>{sheet.width.toFixed(2)}m</div>
                    <div style={{ fontSize: 11, opacity: 0.75, marginTop: 6 }}>#{sheet.index + 1}</div>
                  </div>

                  {/* unión / separador hiperrealista (no renderizamos líneas verticales frontales) */}
                  
                </div>
              );
            })}
          </div>

          {/* NOTE: removed seam overlay vertical divs to eliminate the front vertical gray lines */}
        </div>

        {/* DIMENSION LINES placed outside the content, inside the white outer box */}
        {/* Horizontal dimension (below content) */}
        <svg
          width={containerWidthPx}
          height={Math.max(48, containerHeightPx)}
          style={{
            position: 'absolute',
            left: 0,
            top: contentTopInBox + contentHeightPx + outerPadding / 2,
            zIndex: 30,
            pointerEvents: 'none'
          }}
          aria-hidden
        >
          <defs>
            <marker id="dimArrowH" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
              <path d="M0 0 L8 4 L0 8 z" fill="#374151" />
            </marker>
          </defs>
          <line
            x1={contentLeftInBox}
            x2={contentLeftInBox + contentWidthPx}
            y1={18}
            y2={18}
            stroke="#374151"
            strokeWidth={1}
            strokeDasharray="4 4"
            markerStart="url(#dimArrowH)"
            markerEnd="url(#dimArrowH)"
            opacity={0.95}
          />
          <text
            x={contentLeftInBox + contentWidthPx / 2}
            y={12}
            textAnchor="middle"
            fontSize={12}
            fill="#0f172a"
            fontWeight={700}
          >
            {realW.toFixed(2)} m
          </text>
        </svg>

        {/* Vertical dimension (right of content) */}
        <svg
          width={containerWidthPx}
          height={containerHeightPx}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            zIndex: 30,
            pointerEvents: 'none'
          }}
          aria-hidden
        >
          <defs>
            <marker id="dimArrowV" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
              <path d="M0 0 L8 4 L0 8 z" fill="#374151" />
            </marker>
          </defs>

          {/* vertical line */}
          <line
            x1={contentLeftInBox + contentWidthPx + 28}
            x2={contentLeftInBox + contentWidthPx + 28}
            y1={contentTopInBox}
            y2={contentTopInBox + contentHeightPx}
            stroke="#374151"
            strokeWidth={1}
            strokeDasharray="4 4"
            markerStart="url(#dimArrowV)"
            markerEnd="url(#dimArrowV)"
            opacity={0.95}
          />
          <g transform={`translate(${contentLeftInBox + contentWidthPx + 34}, ${contentTopInBox + contentHeightPx / 2}) rotate(90)`}>
            <text x={0} y={0} textAnchor="middle" fontSize={12} fill="#0f172a" fontWeight={700}>
              {realH.toFixed(2)} m
            </text>
          </g>
        </svg>
      </div>

      <style>{`
        /* removed verticalLinesReveal animation and seam overlays as requested */
        #visualizer-root * {
          backface-visibility: hidden;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
      `}</style>
    </section>
  );
}