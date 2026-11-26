import type { Response } from 'express';
import type { CatalogResponse, ComparisonResponse, ErrorResponse, OffersResponse, ProductDetailResponse } from '../contracts/api';
import type ProductComparisonService = require('../services/ProductComparisonService');
import type { ProductDetailService } from '../services/ProductDetailService';
import type ProductService = require('../services/ProductService');
import { respondWithServiceError } from './httpBoundary';
import type { HttpRequest } from './httpBoundary';

interface ProductControllerOptions {
  productService: Pick<ProductService, 'list' | 'listOffers'>;
  productDetailService: Pick<ProductDetailService, 'getDetail'>;
  productComparisonService: Pick<ProductComparisonService, 'compare'>;
}

const productController = ({ productService, productDetailService, productComparisonService }: ProductControllerOptions) => ({
  list(req: HttpRequest, res: Response<CatalogResponse | ErrorResponse>) {
    try { res.json(productService.list(req.query)); }
    catch (error) { respondWithServiceError(res, error, 'Error al consultar productos', false); }
  },
  offers(_req: HttpRequest, res: Response<OffersResponse | ErrorResponse>) {
    try { res.json(productService.listOffers()); }
    catch { res.status(500).json({ error: 'Error al obtener ofertas' }); }
  },
  detail(req: HttpRequest<{ id: string }>, res: Response<ProductDetailResponse | ErrorResponse>) {
    try {
      const detail = productDetailService.getDetail(Number(req.params.id));
      if (!detail) return res.status(404).json({ error: 'Producto no encontrado' });
      return res.json(detail);
    } catch (error) { return respondWithServiceError(res, error, 'Error al obtener detalle del producto', false); }
  },
  compare(req: HttpRequest, res: Response<ComparisonResponse | ErrorResponse>) {
    try { return res.json(productComparisonService.compare(req.query)); }
    catch (error) { return respondWithServiceError(res, error, 'Error al comparar precios', false); }
  }
});

export = productController;
