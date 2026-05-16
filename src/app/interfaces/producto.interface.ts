// ============================================================
// src/app/interfaces/producto.interface.ts
// Define el modelo de datos para la colección "productos"
// en Cloud Firestore.
// ============================================================

export interface Producto {
  id?: string;           // Generado por Firestore (opcional al crear)
  nombre: string;        // Nombre del producto
  categoria: string;     // Categoría
  precio: number;        // Precio en MXN
  stock: number;         // Unidades disponibles
  descripcion: string;   // Descripción breve
  disponible: boolean;   // Estado de disponibilidad
  fechaCreacion?: Date;  // Timestamp de creación
}
