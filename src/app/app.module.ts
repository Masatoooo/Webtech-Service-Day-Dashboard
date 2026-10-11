import { APP_INITIALIZER, NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { App } from './app.component';
import { PlaceholderComponent } from './placeholder/placeholder.component';
import { CoreModule } from './core/core.module';
import { SharedModule } from './shared/shared.module';
import { AuthModule } from './features/auth/auth.module';
import { DataStoreService } from './core/services/data-store.service';

export function initializeDataStore(dataStore: DataStoreService) {
  return () => dataStore.init();
}

@NgModule({
  declarations: [
    App,
    PlaceholderComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    CoreModule,
    SharedModule,
    AuthModule
  ],
  providers: [
    provideHttpClient(),
    provideBrowserGlobalErrorListeners(),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeDataStore,
      deps: [DataStoreService],
      multi: true
    }
  ],
  bootstrap: [App]
})
export class AppModule { }
