import type { Response } from 'express';
import type { CatalogResponse, ComparisonResponse, ErrorResponse, OffersResponse, ProductDetailResponse } from '../contracts/api';
import type { CatalogFacade } from '../services/CatalogFacade';
import { respondWithServiceError } from './httpBoundary';
import type { HttpRequest } from './httpBoundary';

const productController = (catalog: Pick<CatalogFacade, 'list' | 'listOffers' | 'compare' | 'getDetail'>) => ({
  list(req: HttpRequest, res: Response<CatalogResponse | ErrorResponse>) {
    try { res.json(catalog.list(req.query)); }
    catch (error) { respondWithServiceError(res, error, 'Error al consultar productos', false); }
  },
  offers(_req: HttpRequest, res: Response<OffersResponse | ErrorResponse>) {
    try { res.json(catalog.listOffers()); }
    catch { res.status(500).json({ error: 'Error al obtener ofertas' }); }
  },
  detail(req: HttpRequest<{ id: string }>, res: Response<ProductDetailResponse | ErrorResponse>) {
    try {
      const detail = catalog.getDetail(Number(req.params.id));
      if (!detail) return res.status(404).json({ error: 'Producto no encontrado' });
      return res.json(detail);
    } catch (error) { return respondWithServiceError(res, error, 'Error al obtener detalle del producto', false); }
  },
  compare(req: HttpRequest, res: Response<ComparisonResponse | ErrorResponse>) {
    try { return res.json(catalog.compare(req.query)); }
    catch (error) { return respondWithServiceError(res, error, 'Error al comparar precios', false); }
  }
});

export = productController;
