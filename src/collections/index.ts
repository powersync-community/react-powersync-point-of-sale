/**
 * TanStack DB Collections for Point of Sale System
 * 
 * These collections provide reactive data access with PowerSync
 * for offline-first functionality.
 */

export { cashiersCollection, type Cashier } from './cashiers';
export { categoriesCollection, type Category } from './categories';
export { productsCollection, type Product } from './products';
export { salesCollection, SALE_STATUS, type Sale, type SaleStatus } from './sales';
export { saleItemsCollection, type SaleItem } from './sale-items';

