import prisma from '../prisma';
import type { AuthUser } from '../types/express';
import { restaurantWhere } from '../utils/scopes';

export function listProducts(user?: AuthUser) {
  return prisma.product.findMany({
    where: restaurantWhere(user),
    orderBy: { createdAt: 'desc' },
    include: {
      category: true,
      branch: true,
    },
  });
}

export interface CreateProductInput {
  branchId: string;
  categoryId?: string | null;
  sku?: string | null;
  name: string;
  description?: string | null;
  price: unknown;
  taxRate?: unknown;
  costReference?: unknown;
  preparationTimeMinutes?: unknown;
  imageUrl?: string | null;
}

export function createProduct(input: CreateProductInput) {
  return prisma.product.create({
    data: {
      branchId: input.branchId,
      categoryId: input.categoryId || null,
      sku: input.sku || null,
      name: input.name,
      description: input.description || null,
      price: Number(input.price),
      taxRate: input.taxRate !== undefined ? Number(input.taxRate) : 0.18,
      costReference: input.costReference !== undefined ? Number(input.costReference) : null,
      preparationTimeMinutes:
        input.preparationTimeMinutes !== undefined ? Number(input.preparationTimeMinutes) : null,
      imageUrl: input.imageUrl || null,
    },
    include: {
      category: true,
      branch: true,
    },
  });
}

export interface UpdateProductInput {
  categoryId?: string | null;
  sku?: string | null;
  name?: string;
  description?: string | null;
  price?: unknown;
  taxRate?: unknown;
  costReference?: unknown;
  preparationTimeMinutes?: unknown;
  availableForSale?: unknown;
  imageUrl?: string | null;
}

export function updateProduct(id: string, input: UpdateProductInput) {
  const {
    categoryId,
    sku,
    name,
    description,
    price,
    taxRate,
    costReference,
    preparationTimeMinutes,
    availableForSale,
    imageUrl,
  } = input;

  return prisma.product.update({
    where: { id },
    data: {
      categoryId: categoryId || null,
      sku: sku || null,
      name: name || undefined,
      description: description || null,
      price: price !== undefined ? Number(price) : undefined,
      taxRate: taxRate !== undefined ? Number(taxRate) : undefined,
      costReference:
        costReference !== undefined && costReference !== null
          ? Number(costReference)
          : costReference === null
            ? null
            : undefined,
      preparationTimeMinutes:
        preparationTimeMinutes !== undefined && preparationTimeMinutes !== null
          ? Number(preparationTimeMinutes)
          : preparationTimeMinutes === null
            ? null
            : undefined,
      availableForSale: availableForSale !== undefined ? Boolean(availableForSale) : undefined,
      imageUrl: imageUrl !== undefined ? imageUrl || null : undefined,
    },
    include: {
      category: true,
      branch: true,
    },
  });
}

export function deleteProduct(id: string) {
  return prisma.product.delete({
    where: { id },
  });
}
