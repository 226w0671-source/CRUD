// ============================================================
// src/app/app.component.ts
// Componente raíz standalone. Maneja el formulario CRUD y
// la tabla de productos con datos de Firestore en tiempo real.
// ============================================================

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductoService } from './services/producto.service';
import { Producto } from './interfaces/producto.interface';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="app-wrapper">

      <!-- ── HEADER ─────────────────────────────────────── -->
      <header class="app-header">
        <div class="header-content">
          <h1>📦 Inventario ITSZ</h1>
          <p class="header-sub">CRUD con Angular 17 + Cloud Firestore</p>
        </div>
        <div class="header-stats">
          <div class="stat-pill">
            <span class="stat-num">{{ (productos$ | async)?.length ?? 0 }}</span>
            <span class="stat-lbl">Total</span>
          </div>
          <div class="stat-pill disponible">
            <span class="stat-num">{{ disponiblesCount }}</span>
            <span class="stat-lbl">Disponibles</span>
          </div>
        </div>
      </header>

      <main class="main-layout">

        <!-- ── FORMULARIO CRUD ─────────────────────────── -->
        <aside class="form-panel">
          <h2 class="panel-title">
            {{ modoEdicion ? '✏️ Editar Producto' : '➕ Nuevo Producto' }}
          </h2>

          <div class="form-group">
            <label>Nombre *</label>
            <input
              type="text"
              [(ngModel)]="form.nombre"
              placeholder="Ej: Laptop Pro 15"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label>Categoría *</label>
            <select [(ngModel)]="form.categoria" class="form-input">
              <option value="">-- Selecciona --</option>
              <option value="Computadoras">Computadoras</option>
              <option value="Periféricos">Periféricos</option>
              <option value="Monitores">Monitores</option>
              <option value="Almacenamiento">Almacenamiento</option>
              <option value="Audio">Audio</option>
              <option value="Diseño">Diseño</option>
              <option value="Redes">Redes</option>
              <option value="Otros">Otros</option>
            </select>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Precio (MXN) *</label>
              <input
                type="number"
                [(ngModel)]="form.precio"
                placeholder="0.00"
                min="0"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label>Stock *</label>
              <input
                type="number"
                [(ngModel)]="form.stock"
                placeholder="0"
                min="0"
                class="form-input"
              />
            </div>
          </div>

          <div class="form-group">
            <label>Descripción</label>
            <textarea
              [(ngModel)]="form.descripcion"
              placeholder="Descripción breve del producto..."
              class="form-input form-textarea"
              rows="3"
            ></textarea>
          </div>

          <div class="form-group form-check">
            <label class="check-label">
              <input
                type="checkbox"
                [(ngModel)]="form.disponible"
                class="check-input"
              />
              <span class="check-text">Producto disponible</span>
            </label>
          </div>

          <!-- Mensaje de error -->
          <p class="form-error" *ngIf="errorMsg">{{ errorMsg }}</p>

          <!-- Botones de acción -->
          <div class="form-actions">
            <button
              class="btn btn-primary"
              (click)="guardar()"
              [disabled]="cargando"
            >
              {{ cargando ? 'Guardando...' : (modoEdicion ? 'Actualizar' : 'Guardar') }}
            </button>
            <button
              class="btn btn-ghost"
              (click)="cancelar()"
              *ngIf="modoEdicion"
            >
              Cancelar
            </button>
          </div>

          <!-- Toast de confirmación -->
          <div class="toast" *ngIf="toastMsg" [class.toast-visible]="toastMsg">
            ✅ {{ toastMsg }}
          </div>
        </aside>

        <!-- ── TABLA DE PRODUCTOS ──────────────────────── -->
        <section class="table-panel">
          <!-- Barra de búsqueda y filtro -->
          <div class="table-toolbar">
            <div class="search-wrapper">
              <span class="search-icon">🔍</span>
              <input
                type="text"
                [(ngModel)]="busqueda"
                placeholder="Buscar producto..."
                class="search-input"
              />
            </div>
            <select [(ngModel)]="filtroCategoria" class="filter-select">
              <option value="">Todas las categorías</option>
              <option value="Computadoras">Computadoras</option>
              <option value="Periféricos">Periféricos</option>
              <option value="Monitores">Monitores</option>
              <option value="Almacenamiento">Almacenamiento</option>
              <option value="Audio">Audio</option>
              <option value="Diseño">Diseño</option>
              <option value="Redes">Redes</option>
              <option value="Otros">Otros</option>
            </select>
          </div>

          <!-- Estado de carga -->
          <div class="loading-state" *ngIf="!(productos$ | async)">
            <span class="spinner"></span>
            <p>Conectando con Firestore...</p>
          </div>

          <!-- Tabla -->
          <div class="table-wrapper" *ngIf="(productos$ | async) as todos">
            <ng-container *ngIf="filtrados(todos) as lista">

              <!-- Estado vacío -->
              <div class="empty-state" *ngIf="lista.length === 0">
                <p>📭 No se encontraron productos.</p>
                <small *ngIf="busqueda || filtroCategoria">
                  Intenta con otros filtros.
                </small>
              </div>

              <table class="data-table" *ngIf="lista.length > 0">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Categoría</th>
                    <th>Precio</th>
                    <th>Stock</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let p of lista" [class.row-agotado]="!p.disponible">
                    <td>
                      <div class="product-name">{{ p.nombre }}</div>
                      <div class="product-desc" *ngIf="p.descripcion">
                        {{ p.descripcion | slice:0:50 }}{{ p.descripcion.length > 50 ? '...' : '' }}
                      </div>
                    </td>
                    <td>
                      <span class="categoria-tag">{{ p.categoria }}</span>
                    </td>
                    <td class="precio-cell">
                      \${{ p.precio | number:'1.2-2' }}
                    </td>
                    <td class="stock-cell" [class.stock-bajo]="p.stock > 0 && p.stock <= 5">
                      {{ p.stock }}
                    </td>
                    <td>
                      <span class="badge" [class.badge-disponible]="p.disponible" [class.badge-agotado]="!p.disponible">
                        {{ p.disponible ? '✓ Disponible' : '✕ Agotado' }}
                      </span>
                    </td>
                    <td class="actions-cell">
                      <button class="btn-icon btn-edit" (click)="editar(p)" title="Editar">
                        ✏️
                      </button>
                      <button class="btn-icon btn-delete" (click)="confirmarEliminar(p)" title="Eliminar">
                        🗑️
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>

              <!-- Conteo de resultados -->
              <p class="result-count" *ngIf="lista.length > 0">
                Mostrando {{ lista.length }} de {{ todos.length }} productos
              </p>
            </ng-container>
          </div>
        </section>
      </main>

      <!-- ── MODAL DE CONFIRMACIÓN DE ELIMINACIÓN ──────── -->
      <div class="modal-overlay" *ngIf="productoAEliminar" (click)="cancelarEliminar()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>¿Eliminar producto?</h3>
          <p>Estás a punto de eliminar <strong>{{ productoAEliminar.nombre }}</strong>.</p>
          <p class="modal-warning">Esta acción no se puede deshacer.</p>
          <div class="modal-actions">
            <button class="btn btn-danger" (click)="eliminar()" [disabled]="cargando">
              {{ cargando ? 'Eliminando...' : 'Sí, eliminar' }}
            </button>
            <button class="btn btn-ghost" (click)="cancelarEliminar()">Cancelar</button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    /* ── Variables ─────────────────────────────────────── */
    :host {
      --color-bg: #f5f5f5;
      --color-surface: #ffffff;
      --color-border: #e0e0e0;
      --color-primary: #1a1a1a;
      --color-accent: #4f46e5;
      --color-success: #16a34a;
      --color-danger: #dc2626;
      --color-warning: #d97706;
      --color-text: #1a1a1a;
      --color-muted: #6b7280;
      --radius: 10px;
      --shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    /* ── Wrapper ────────────────────────────────────────── */
    .app-wrapper {
      min-height: 100vh;
      background: var(--color-bg);
      font-family: 'Segoe UI', system-ui, sans-serif;
      color: var(--color-text);
    }

    /* ── Header ─────────────────────────────────────────── */
    .app-header {
      background: var(--color-primary);
      color: #fff;
      padding: 1.2rem 2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .app-header h1 { font-size: 1.5rem; font-weight: 700; margin: 0; }
    .header-sub { font-size: 0.82rem; opacity: 0.7; margin: 2px 0 0; }

    .header-stats {
      display: flex;
      gap: 12px;
    }

    .stat-pill {
      background: rgba(255,255,255,0.12);
      border-radius: 8px;
      padding: 8px 16px;
      text-align: center;
      min-width: 70px;
    }

    .stat-pill.disponible { background: rgba(22, 163, 74, 0.3); }

    .stat-num { display: block; font-size: 1.4rem; font-weight: 700; line-height: 1.1; }
    .stat-lbl { font-size: 0.7rem; opacity: 0.8; text-transform: uppercase; letter-spacing: 0.05em; }

    /* ── Layout principal ────────────────────────────────── */
    .main-layout {
      display: grid;
      grid-template-columns: 340px 1fr;
      gap: 1.5rem;
      padding: 1.5rem 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    /* ── Panel del formulario ────────────────────────────── */
    .form-panel {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
      padding: 1.5rem;
      height: fit-content;
      position: sticky;
      top: 1.5rem;
    }

    .panel-title {
      font-size: 1rem;
      font-weight: 700;
      margin: 0 0 1.2rem;
      padding-bottom: 0.8rem;
      border-bottom: 1px solid var(--color-border);
    }

    .form-group { margin-bottom: 1rem; }
    .form-group label {
      display: block;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--color-muted);
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .form-input {
      width: 100%;
      font-family: inherit;
      font-size: 0.9rem;
      padding: 9px 12px;
      border: 1px solid var(--color-border);
      border-radius: 7px;
      outline: none;
      background: #fafafa;
      color: var(--color-text);
      transition: border-color 0.15s;
      box-sizing: border-box;
    }

    .form-input:focus { border-color: var(--color-accent); background: #fff; }
    .form-textarea { resize: vertical; min-height: 80px; }

    select.form-input { cursor: pointer; }

    .form-check { margin-top: 0.5rem; }
    .check-label {
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      text-transform: none;
      letter-spacing: 0;
      font-size: 0.9rem !important;
      color: var(--color-text) !important;
      font-weight: 500 !important;
    }
    .check-input { width: 17px; height: 17px; cursor: pointer; accent-color: var(--color-accent); }
    .check-text { font-size: 0.9rem; }

    .form-error {
      font-size: 0.82rem;
      color: var(--color-danger);
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 6px;
      padding: 8px 12px;
      margin-bottom: 0.8rem;
    }

    .form-actions {
      display: flex;
      gap: 8px;
      margin-top: 1rem;
    }

    /* ── Botones ─────────────────────────────────────────── */
    .btn {
      font-family: inherit;
      font-size: 0.88rem;
      font-weight: 600;
      padding: 10px 18px;
      border-radius: 7px;
      border: none;
      cursor: pointer;
      transition: opacity 0.15s, transform 0.1s;
    }
    .btn:hover { opacity: 0.88; }
    .btn:active { transform: scale(0.98); }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }

    .btn-primary { background: var(--color-accent); color: #fff; flex: 1; }
    .btn-ghost { background: transparent; border: 1px solid var(--color-border); color: var(--color-muted); }
    .btn-danger { background: var(--color-danger); color: #fff; }

    /* ── Toast ───────────────────────────────────────────── */
    .toast {
      margin-top: 0.8rem;
      font-size: 0.82rem;
      background: #f0fdf4;
      border: 1px solid #86efac;
      color: #15803d;
      border-radius: 7px;
      padding: 8px 12px;
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* ── Panel de tabla ──────────────────────────────────── */
    .table-panel {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
      padding: 1.5rem;
      overflow: hidden;
    }

    /* ── Toolbar ─────────────────────────────────────────── */
    .table-toolbar {
      display: flex;
      gap: 10px;
      margin-bottom: 1.2rem;
      flex-wrap: wrap;
    }

    .search-wrapper {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 8px;
      background: #fafafa;
      border: 1px solid var(--color-border);
      border-radius: 7px;
      padding: 0 12px;
    }
    .search-input {
      flex: 1;
      font-family: inherit;
      font-size: 0.9rem;
      padding: 9px 0;
      border: none;
      outline: none;
      background: transparent;
    }

    .filter-select {
      font-family: inherit;
      font-size: 0.85rem;
      padding: 9px 12px;
      border: 1px solid var(--color-border);
      border-radius: 7px;
      background: #fafafa;
      outline: none;
      cursor: pointer;
      min-width: 170px;
    }

    /* ── Loading ─────────────────────────────────────────── */
    .loading-state {
      text-align: center;
      padding: 3rem;
      color: var(--color-muted);
    }

    .spinner {
      display: inline-block;
      width: 28px;
      height: 28px;
      border: 3px solid #e0e0e0;
      border-top-color: var(--color-accent);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      margin-bottom: 0.8rem;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Tabla ───────────────────────────────────────────── */
    .table-wrapper { overflow-x: auto; }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.88rem;
    }

    .data-table th {
      text-align: left;
      padding: 10px 14px;
      font-size: 0.73rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-muted);
      border-bottom: 2px solid var(--color-border);
      white-space: nowrap;
    }

    .data-table td {
      padding: 12px 14px;
      border-bottom: 1px solid #f0f0f0;
      vertical-align: middle;
    }

    .data-table tr:last-child td { border-bottom: none; }
    .data-table tr:hover td { background: #fafafa; }

    .row-agotado { opacity: 0.65; }

    /* ── Celdas específicas ──────────────────────────────── */
    .product-name { font-weight: 600; color: var(--color-text); }
    .product-desc { font-size: 0.78rem; color: var(--color-muted); margin-top: 2px; }

    .categoria-tag {
      font-size: 0.73rem;
      font-weight: 600;
      background: #f0f0f0;
      color: #555;
      padding: 3px 9px;
      border-radius: 20px;
    }

    .precio-cell { font-weight: 700; font-variant-numeric: tabular-nums; }

    .stock-cell { font-weight: 600; }
    .stock-bajo { color: var(--color-warning); }

    .badge {
      font-size: 0.7rem;
      font-weight: 600;
      padding: 3px 9px;
      border-radius: 20px;
      white-space: nowrap;
    }
    .badge-disponible { background: #dcfce7; color: #15803d; }
    .badge-agotado { background: #fee2e2; color: #b91c1c; }

    .actions-cell { white-space: nowrap; }

    .btn-icon {
      background: none;
      border: 1px solid var(--color-border);
      border-radius: 6px;
      padding: 5px 9px;
      cursor: pointer;
      font-size: 1rem;
      line-height: 1;
      transition: background 0.15s;
      margin-right: 4px;
    }
    .btn-icon:hover { background: #f0f0f0; }
    .btn-delete:hover { background: #fee2e2; border-color: #fca5a5; }

    .result-count {
      font-size: 0.78rem;
      color: var(--color-muted);
      margin-top: 1rem;
      text-align: right;
    }

    /* ── Estado vacío ────────────────────────────────────── */
    .empty-state {
      text-align: center;
      padding: 3rem;
      color: var(--color-muted);
      border: 1px dashed var(--color-border);
      border-radius: var(--radius);
    }

    /* ── Modal ───────────────────────────────────────────── */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.45);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.2s ease;
    }

    .modal {
      background: #fff;
      border-radius: 12px;
      padding: 2rem;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0,0,0,0.2);
    }

    .modal h3 { margin: 0 0 0.8rem; font-size: 1.1rem; }
    .modal p { margin: 0 0 0.4rem; font-size: 0.9rem; color: #555; }
    .modal-warning { color: var(--color-danger); font-size: 0.82rem !important; }

    .modal-actions {
      display: flex;
      gap: 8px;
      margin-top: 1.5rem;
      justify-content: flex-end;
    }

    /* ── Responsive ──────────────────────────────────────── */
    @media (max-width: 768px) {
      .main-layout {
        grid-template-columns: 1fr;
        padding: 1rem;
      }
      .form-panel { position: static; }
      .app-header { padding: 1rem; }
    }
  `]
})
export class AppComponent implements OnInit {
  private productoService = inject(ProductoService);

  // Observable de Firestore (actualización en tiempo real)
  productos$ = this.productoService.getProductos();

  // Estado del formulario
  form: Omit<Producto, 'id' | 'fechaCreacion'> = this.formVacio();
  modoEdicion = false;
  idEditando: string | null = null;

  // UI state
  cargando = false;
  errorMsg = '';
  toastMsg = '';
  busqueda = '';
  filtroCategoria = '';
  productoAEliminar: Producto | null = null;
  disponiblesCount = 0;

  ngOnInit() {
    // Actualizar conteo de disponibles cada vez que cambian los datos
    this.productos$.subscribe(lista => {
      this.disponiblesCount = lista.filter(p => p.disponible).length;
    });
  }

  // ── Filtrado local (búsqueda + categoría) ─────────────────
  filtrados(lista: Producto[]): Producto[] {
    return lista.filter(p => {
      const coincideNombre = p.nombre.toLowerCase().includes(this.busqueda.toLowerCase());
      const coincideCategoria = !this.filtroCategoria || p.categoria === this.filtroCategoria;
      return coincideNombre && coincideCategoria;
    });
  }

  // ── CREATE / UPDATE ───────────────────────────────────────
  async guardar() {
    this.errorMsg = '';

    if (!this.form.nombre.trim()) {
      this.errorMsg = 'El nombre es obligatorio.';
      return;
    }
    if (!this.form.categoria) {
      this.errorMsg = 'Selecciona una categoría.';
      return;
    }
    if (this.form.precio < 0) {
      this.errorMsg = 'El precio no puede ser negativo.';
      return;
    }

    this.cargando = true;
    try {
      if (this.modoEdicion && this.idEditando) {
        // UPDATE
        await this.productoService.actualizarProducto(this.idEditando, this.form);
        this.mostrarToast('Producto actualizado correctamente.');
      } else {
        // CREATE
        await this.productoService.agregarProducto(this.form);
        this.mostrarToast('Producto agregado correctamente.');
      }
      this.resetear();
    } catch (err) {
      this.errorMsg = 'Error al guardar. Verifica tu conexión con Firebase.';
      console.error(err);
    } finally {
      this.cargando = false;
    }
  }

  // ── Cargar datos en el formulario para editar ─────────────
  editar(p: Producto) {
    this.form = {
      nombre: p.nombre,
      categoria: p.categoria,
      precio: p.precio,
      stock: p.stock,
      descripcion: p.descripcion,
      disponible: p.disponible,
    };
    this.idEditando = p.id!;
    this.modoEdicion = true;
    this.errorMsg = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ── DELETE ────────────────────────────────────────────────
  confirmarEliminar(p: Producto) {
    this.productoAEliminar = p;
  }

  async eliminar() {
    if (!this.productoAEliminar?.id) return;
    this.cargando = true;
    try {
      await this.productoService.eliminarProducto(this.productoAEliminar.id);
      this.mostrarToast('Producto eliminado.');
      this.productoAEliminar = null;
    } catch (err) {
      this.errorMsg = 'Error al eliminar el producto.';
      console.error(err);
    } finally {
      this.cargando = false;
    }
  }

  cancelarEliminar() {
    this.productoAEliminar = null;
  }

  cancelar() {
    this.resetear();
  }

  // ── Helpers ───────────────────────────────────────────────
  private resetear() {
    this.form = this.formVacio();
    this.modoEdicion = false;
    this.idEditando = null;
    this.errorMsg = '';
  }

  private formVacio(): Omit<Producto, 'id' | 'fechaCreacion'> {
    return { nombre: '', categoria: '', precio: 0, stock: 0, descripcion: '', disponible: true };
  }

  private mostrarToast(msg: string) {
    this.toastMsg = msg;
    setTimeout(() => (this.toastMsg = ''), 3000);
  }
}
