// ============================================================
// src/main.ts
// Punto de entrada de la aplicación Angular 17 standalone.
// ============================================================

import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
