import type { Response } from 'express';
import type { CreateProductInput, ErrorResponse, MessageResponse, ProductSavedResponse, UpdateProductInput } from '../contracts/api';
import type ProductAdminService = require('../services/ProductAdminService');
import { readBody, respondWithServiceError } from './httpBoundary';
import type { HttpRequest } from './httpBoundary';

const adminController = (productAdminService: Pick<ProductAdminService, 'create' | 'update' | 'delete'>) => ({
  create(req: HttpRequest, res: Response<ProductSavedResponse | ErrorResponse>) {
    try {
      const product = productAdminService.create(readBody<CreateProductInput>(req.body));
      return res.status(201).json({ message: 'Producto creado exitosamente', product });
    } catch (error) { return respondWithServiceError(res, error, 'Error al agregar producto'); }
  },
  update(req: HttpRequest<{ id: string }>, res: Response<ProductSavedResponse | ErrorResponse>) {
    try {
      const product = productAdminService.update(req.params.id, readBody<UpdateProductInput>(req.body));
      if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
      return res.json({ message: 'Producto actualizado exitosamente', product });
    } catch (error) { return respondWithServiceError(res, error, 'Error al actualizar producto'); }
  },
  remove(req: HttpRequest<{ id: string }>, res: Response<MessageResponse | ErrorResponse>) {
    try {
      if (!productAdminService.delete(req.params.id)) return res.status(404).json({ error: 'Producto no encontrado o ya eliminado' });
      return res.json({ message: 'Producto eliminado del catálogo correctamente' });
    } catch (error) { return respondWithServiceError(res, error, 'Error al eliminar producto'); }
  }
});

export = adminController;
