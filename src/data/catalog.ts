export type CatalogCategory = 'policarbonato' | 'pvc' | 'wpc' | 'zacate' | 'accesorio' | 'textura';

export interface CatalogProduct {
  id: string;
  sku: string;
  nombre: string;
  categoria: CatalogCategory;
  descripcion: string;
  precio: number;
  impuesto: number;
  tamano: string;
  estiloFoto: string;
  stock: number;
  garantia: string;
  cuentaCobro: string;
  cuentasPago: string[];
}

const cuentasBase = ['Banco Nacional 100-01-123-456789', 'BAC 911-000-456123', 'SINPE +506 8888-8888'];

export const catalogProducts: CatalogProduct[] = [
  { id: 'pc-klar-1.45', sku: 'PC-KLAR-145', nombre: 'Lámina Policarbonato KLAR 1.45m', categoria: 'policarbonato', descripcion: 'Lámina alveolar KLAR', precio: 14800, impuesto: 0.13, tamano: '2.10 x 1.45 m', estiloFoto: 'textures/transparente.png', stock: 50, garantia: '10 años decoloración', cuentaCobro: 'Ventas Policarbonato', cuentasPago: cuentasBase },
  { id: 'pc-klar-2.90', sku: 'PC-KLAR-290', nombre: 'Lámina Policarbonato KLAR 2.90m', categoria: 'policarbonato', descripcion: 'Lámina alveolar KLAR', precio: 29600, impuesto: 0.13, tamano: '2.10 x 2.90 m', estiloFoto: 'textures/blanco.png', stock: 50, garantia: '10 años decoloración', cuentaCobro: 'Ventas Policarbonato', cuentasPago: cuentasBase },
  { id: 'pc-klar-4.35', sku: 'PC-KLAR-435', nombre: 'Lámina Policarbonato KLAR 4.35m', categoria: 'policarbonato', descripcion: 'Lámina alveolar KLAR', precio: 44400, impuesto: 0.13, tamano: '2.10 x 4.35 m', estiloFoto: 'textures/gris.png', stock: 50, garantia: '10 años decoloración', cuentaCobro: 'Ventas Policarbonato', cuentasPago: cuentasBase },
  { id: 'pc-klar-5.80', sku: 'PC-KLAR-580', nombre: 'Lámina Policarbonato KLAR 5.80m', categoria: 'policarbonato', descripcion: 'Lámina alveolar KLAR', precio: 59200, impuesto: 0.13, tamano: '2.10 x 5.80 m', estiloFoto: 'textures/BRONCE.png', stock: 50, garantia: '10 años decoloración', cuentaCobro: 'Ventas Policarbonato', cuentasPago: cuentasBase },
  { id: 'pc-klar-7.25', sku: 'PC-KLAR-725', nombre: 'Lámina Policarbonato KLAR 7.25m', categoria: 'policarbonato', descripcion: 'Lámina alveolar KLAR', precio: 74000, impuesto: 0.13, tamano: '2.10 x 7.25 m', estiloFoto: 'textures/azul.png', stock: 50, garantia: '10 años decoloración', cuentaCobro: 'Ventas Policarbonato', cuentasPago: cuentasBase },
  { id: 'pc-klar-8.70', sku: 'PC-KLAR-870', nombre: 'Lámina Policarbonato KLAR 8.70m', categoria: 'policarbonato', descripcion: 'Lámina alveolar KLAR', precio: 88800, impuesto: 0.13, tamano: '2.10 x 8.70 m', estiloFoto: 'textures/Humo.png', stock: 50, garantia: '10 años decoloración', cuentaCobro: 'Ventas Policarbonato', cuentasPago: cuentasBase },
  { id: 'pc-klar-11.60', sku: 'PC-KLAR-1160', nombre: 'Lámina Policarbonato KLAR 11.60m', categoria: 'policarbonato', descripcion: 'Lámina alveolar KLAR', precio: 118400, impuesto: 0.13, tamano: '2.10 x 11.60 m', estiloFoto: 'textures/transparente.png', stock: 50, garantia: '10 años decoloración', cuentaCobro: 'Ventas Policarbonato', cuentasPago: cuentasBase },
  { id: 'pc-pcr-1.45', sku: 'PC-PCR-145', nombre: 'Lámina Policarbonato PCR 1.45m', categoria: 'policarbonato', descripcion: 'Lámina alveolar PCR', precio: 12000, impuesto: 0.13, tamano: '2.10 x 1.45 m', estiloFoto: 'textures/transparente.png', stock: 50, garantia: '8 años decoloración', cuentaCobro: 'Ventas Policarbonato', cuentasPago: cuentasBase },
  { id: 'pc-pcr-2.90', sku: 'PC-PCR-290', nombre: 'Lámina Policarbonato PCR 2.90m', categoria: 'policarbonato', descripcion: 'Lámina alveolar PCR', precio: 24000, impuesto: 0.13, tamano: '2.10 x 2.90 m', estiloFoto: 'textures/blanco.png', stock: 50, garantia: '8 años decoloración', cuentaCobro: 'Ventas Policarbonato', cuentasPago: cuentasBase },
  { id: 'pc-pcr-4.35', sku: 'PC-PCR-435', nombre: 'Lámina Policarbonato PCR 4.35m', categoria: 'policarbonato', descripcion: 'Lámina alveolar PCR', precio: 36000, impuesto: 0.13, tamano: '2.10 x 4.35 m', estiloFoto: 'textures/gris.png', stock: 50, garantia: '8 años decoloración', cuentaCobro: 'Ventas Policarbonato', cuentasPago: cuentasBase },
  { id: 'pc-pcr-5.80', sku: 'PC-PCR-580', nombre: 'Lámina Policarbonato PCR 5.80m', categoria: 'policarbonato', descripcion: 'Lámina alveolar PCR', precio: 48000, impuesto: 0.13, tamano: '2.10 x 5.80 m', estiloFoto: 'textures/BRONCE.png', stock: 50, garantia: '8 años decoloración', cuentaCobro: 'Ventas Policarbonato', cuentasPago: cuentasBase },
  { id: 'pc-pcr-7.25', sku: 'PC-PCR-725', nombre: 'Lámina Policarbonato PCR 7.25m', categoria: 'policarbonato', descripcion: 'Lámina alveolar PCR', precio: 60000, impuesto: 0.13, tamano: '2.10 x 7.25 m', estiloFoto: 'textures/azul.png', stock: 50, garantia: '8 años decoloración', cuentaCobro: 'Ventas Policarbonato', cuentasPago: cuentasBase },
  { id: 'pc-pcr-8.70', sku: 'PC-PCR-870', nombre: 'Lámina Policarbonato PCR 8.70m', categoria: 'policarbonato', descripcion: 'Lámina alveolar PCR', precio: 72000, impuesto: 0.13, tamano: '2.10 x 8.70 m', estiloFoto: 'textures/Humo.png', stock: 50, garantia: '8 años decoloración', cuentaCobro: 'Ventas Policarbonato', cuentasPago: cuentasBase },
  { id: 'pc-pcr-11.60', sku: 'PC-PCR-1160', nombre: 'Lámina Policarbonato PCR 11.60m', categoria: 'policarbonato', descripcion: 'Lámina alveolar PCR', precio: 96000, impuesto: 0.13, tamano: '2.10 x 11.60 m', estiloFoto: 'textures/transparente.png', stock: 50, garantia: '8 años decoloración', cuentaCobro: 'Ventas Policarbonato', cuentasPago: cuentasBase },
  { id: 'pc-union-1.45', sku: 'PC-UNION-145', nombre: 'Perfil unión policarbonato 1.45m', categoria: 'accesorio', descripcion: 'Perfil H unión', precio: 2762, impuesto: 0.13, tamano: '1.45 m', estiloFoto: 'textures/gris.png', stock: 50, garantia: '6 meses', cuentaCobro: 'Ventas Accesorios', cuentasPago: cuentasBase },
  { id: 'pc-union-2.90', sku: 'PC-UNION-290', nombre: 'Perfil unión policarbonato 2.90m', categoria: 'accesorio', descripcion: 'Perfil H unión', precio: 5524, impuesto: 0.13, tamano: '2.90 m', estiloFoto: 'textures/gris.png', stock: 50, garantia: '6 meses', cuentaCobro: 'Ventas Accesorios', cuentasPago: cuentasBase },
  { id: 'pc-union-4.35', sku: 'PC-UNION-435', nombre: 'Perfil unión policarbonato 4.35m', categoria: 'accesorio', descripcion: 'Perfil H unión', precio: 8286, impuesto: 0.13, tamano: '4.35 m', estiloFoto: 'textures/gris.png', stock: 50, garantia: '6 meses', cuentaCobro: 'Ventas Accesorios', cuentasPago: cuentasBase },
  { id: 'pc-union-5.80', sku: 'PC-UNION-580', nombre: 'Perfil unión policarbonato 5.80m', categoria: 'accesorio', descripcion: 'Perfil H unión', precio: 11048, impuesto: 0.13, tamano: '5.80 m', estiloFoto: 'textures/gris.png', stock: 50, garantia: '6 meses', cuentaCobro: 'Ventas Accesorios', cuentasPago: cuentasBase },
  { id: 'perfil-u', sku: 'AC-PERFIL-U', nombre: 'Perfil U aluminio', categoria: 'accesorio', descripcion: 'Remate de borde', precio: 2654.87, impuesto: 0.13, tamano: 'metro lineal', estiloFoto: 'textures/gris.png', stock: 50, garantia: '6 meses', cuentaCobro: 'Ventas Accesorios', cuentasPago: cuentasBase },
  { id: 'cinta-ventilada', sku: 'AC-CINTA-VEN', nombre: 'Cinta ventilada', categoria: 'accesorio', descripcion: 'Protección de cavidades', precio: 690.27, impuesto: 0.13, tamano: 'metro lineal', estiloFoto: 'textures/gris.png', stock: 50, garantia: 'Sin garantía', cuentaCobro: 'Ventas Accesorios', cuentasPago: cuentasBase },
  { id: 'cinta-aluminio', sku: 'AC-CINTA-AL', nombre: 'Cinta aluminio', categoria: 'accesorio', descripcion: 'Sellado superior', precio: 425, impuesto: 0.13, tamano: 'metro lineal', estiloFoto: 'textures/gris.png', stock: 50, garantia: 'Sin garantía', cuentaCobro: 'Ventas Accesorios', cuentasPago: cuentasBase },
  { id: 'tornillo', sku: 'AC-TORNILLO', nombre: 'Tornillo autoperforante', categoria: 'accesorio', descripcion: 'Fijación metálica', precio: 65, impuesto: 0.13, tamano: 'unidad', estiloFoto: 'textures/gris.png', stock: 50, garantia: 'Sin garantía', cuentaCobro: 'Ventas Accesorios', cuentasPago: cuentasBase },
  { id: 'arandela', sku: 'AC-ARANDELA', nombre: 'Arandela PVC', categoria: 'accesorio', descripcion: 'Sello de fijación', precio: 132.75, impuesto: 0.13, tamano: 'unidad', estiloFoto: 'textures/gris.png', stock: 50, garantia: 'Sin garantía', cuentaCobro: 'Ventas Accesorios', cuentasPago: cuentasBase },
  { id: 'silicon', sku: 'AC-SILICON', nombre: 'Silicón sellador', categoria: 'accesorio', descripcion: 'Cartucho 300ml', precio: 5929.21, impuesto: 0.13, tamano: 'cartucho', estiloFoto: 'textures/gris.png', stock: 50, garantia: 'Sin garantía', cuentaCobro: 'Ventas Accesorios', cuentasPago: cuentasBase },
  { id: 'pvc-floor', sku: 'PVC-40X40', nombre: 'Piso PVC 40x40', categoria: 'pvc', descripcion: 'Piso modular de alto tránsito', precio: 2000, impuesto: 0.13, tamano: '40 x 40 cm', estiloFoto: 'textures/azul.png', stock: 50, garantia: '12 meses', cuentaCobro: 'Ventas PVC', cuentasPago: cuentasBase },
  { id: 'pvc-borders', sku: 'PVC-BORDE', nombre: 'Borde PVC', categoria: 'pvc', descripcion: 'Borde para perímetro', precio: 800, impuesto: 0.13, tamano: 'pieza', estiloFoto: 'textures/azul.png', stock: 50, garantia: '12 meses', cuentaCobro: 'Ventas PVC', cuentasPago: cuentasBase },
  { id: 'pvc-corners', sku: 'PVC-ESQ', nombre: 'Esquinero PVC', categoria: 'pvc', descripcion: 'Pieza de esquina', precio: 200, impuesto: 0.13, tamano: 'pieza', estiloFoto: 'textures/azul.png', stock: 50, garantia: '12 meses', cuentaCobro: 'Ventas PVC', cuentasPago: cuentasBase },
  { id: 'wpc-interior', sku: 'WPC-INT', nombre: 'Panel WPC Interior', categoria: 'wpc', descripcion: 'Panel decorativo interior', precio: 3990, impuesto: 0.13, tamano: '16cm x 2.90m', estiloFoto: 'textures/BRONCE.png', stock: 50, garantia: '24 meses', cuentaCobro: 'Ventas WPC', cuentasPago: cuentasBase },
  { id: 'wpc-exterior', sku: 'WPC-EXT', nombre: 'Panel WPC Exterior', categoria: 'wpc', descripcion: 'Panel decorativo exterior', precio: 9990, impuesto: 0.13, tamano: '22cm x 2.90m', estiloFoto: 'textures/BRONCE.png', stock: 50, garantia: '24 meses', cuentaCobro: 'Ventas WPC', cuentasPago: cuentasBase },
  { id: 'wpc-coextruido', sku: 'WPC-COEX', nombre: 'Panel WPC Coextruido', categoria: 'wpc', descripcion: 'Panel premium coextruido', precio: 14000, impuesto: 0.13, tamano: '22cm x 2.90m', estiloFoto: 'textures/BRONCE.png', stock: 50, garantia: '24 meses', cuentaCobro: 'Ventas WPC', cuentasPago: cuentasBase },
  { id: 'zacate-35mm', sku: 'ZAC-35MM', nombre: 'Zacate sintético 35mm', categoria: 'zacate', descripcion: 'Rollo de zacate residencial', precio: 6500, impuesto: 0.13, tamano: '2m ancho', estiloFoto: 'textures/zacate-grass.svg', stock: 50, garantia: '18 meses', cuentaCobro: 'Ventas Zacate', cuentasPago: cuentasBase }
];

export const getCatalogProduct = (id: string) => catalogProducts.find((product) => product.id === id);

export const getCatalogPrice = (id: string, fallback: number): number => getCatalogProduct(id)?.precio ?? fallback;
