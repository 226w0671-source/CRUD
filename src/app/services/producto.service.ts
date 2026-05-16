// ============================================================
// src/app/services/producto.service.ts
// Servicio que aísla toda la lógica de comunicación con
// Cloud Firestore. Implementa las 4 operaciones CRUD.
// ============================================================

import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Producto } from '../interfaces/producto.interface';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  // Inyección de dependencia moderna con inject()
  private firestore = inject(Firestore);

  // Referencia a la colección "productos" en Firestore
  private productosRef = collection(this.firestore, 'productos');

  // ── READ: Obtener todos los productos en tiempo real ──────
  getProductos(): Observable<Producto[]> {
    const q = query(this.productosRef, orderBy('fechaCreacion', 'desc'));
    // idField: 'id' hace que Firestore mapee el ID del documento
    // al campo 'id' de nuestro objeto
    return collectionData(q, { idField: 'id' }) as Observable<Producto[]>;
  }

  // ── CREATE: Agregar un nuevo producto ─────────────────────
  async agregarProducto(producto: Omit<Producto, 'id'>): Promise<void> {
    await addDoc(this.productosRef, {
      ...producto,
      fechaCreacion: serverTimestamp()
    });
  }

  // ── UPDATE: Actualizar un producto existente ──────────────
  async actualizarProducto(id: string, datos: Partial<Producto>): Promise<void> {
    const docRef = doc(this.firestore, `productos/${id}`);
    await updateDoc(docRef, { ...datos });
  }

  // ── DELETE: Eliminar un producto por ID ───────────────────
  async eliminarProducto(id: string): Promise<void> {
    const docRef = doc(this.firestore, `productos/${id}`);
    await deleteDoc(docRef);
  }
}
