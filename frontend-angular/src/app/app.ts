import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AuthService } from './core/auth.service';
import { MapStateService } from './core/map-state.service';
import { BOUNDARY_COLOR_OPTIONS } from './models/boundary';
import { AuthModal } from './features/auth/auth-modal';
import { MapView } from './features/map/map-view';
import { AddressSearch } from './features/search/address-search';
import { BoundarySearch } from './features/search/boundary-search';
import { DetailSideDrawer } from './features/views/detail-side-drawer';
import { GlobalViewDrawer } from './features/views/global-view-drawer';

@Component({
  selector: 'app-root',
  imports: [MapView, AddressSearch, BoundarySearch, AuthModal, GlobalViewDrawer, DetailSideDrawer],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
})
export class App {
  protected readonly auth = inject(AuthService);
  protected readonly state = inject(MapStateService);

  /** The compact saved-boundaries list offers the first five colours. */
  protected readonly quickColors = BOUNDARY_COLOR_OPTIONS.slice(0, 5);
}
