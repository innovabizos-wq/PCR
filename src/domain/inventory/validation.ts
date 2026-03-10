import { CatalogProduct } from '../../data/catalog';

export const validateInventoryProduct = (product: CatalogProduct): void => {
  if (!product.id.trim() || !product.sku.trim() || !product.nombre.trim()) {
    throw new Error('Cada producto debe tener id, SKU y nombre.');
  }
  if (product.precio < 0 || product.stock < 0 || product.impuesto < 0 || product.impuesto > 1) {
    throw new Error(`Valores inválidos para ${product.sku || product.id}.`);
  }
};
