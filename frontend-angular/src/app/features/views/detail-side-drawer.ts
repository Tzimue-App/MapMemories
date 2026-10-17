import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { UnifiedMapElement } from '../../models/view';
import { calculateCircleArea, calculatePolygonArea, formatArea, formatCoordinates } from '../../shared/geo-area';
import { SwipeToClose } from '../../shared/swipe-to-close';
import { memoryMedia } from '../media/memory-media';
import { NoteList } from '../media/note-list';
import { PhotoUploader } from '../media/photo-uploader';
import { PhotoCarousel } from './photo-carousel';

type DrawerTab = 'overview' | 'photos' | 'notes';

const COPIED_FEEDBACK_MS = 2000;

@Component({
  selector: 'app-detail-side-drawer',
  imports: [PhotoCarousel, NoteList, PhotoUploader, SwipeToClose],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './detail-side-drawer.html',
})
export class DetailSideDrawer {
  readonly isOpen = input(false);
  readonly element = input<UnifiedMapElement | null>(null);
  readonly closed = output<void>();
  readonly delete = output<UnifiedMapElement>();

  protected readonly activeTab = signal<DrawerTab>('overview');
  protected readonly media = memoryMedia({
    source: () => {
      const el = this.element();
      return el ? { id: el.dbId, photos: el.photos, notes: el.notes } : null;
    },
  });
  protected readonly copiedCoords = signal(false);

  protected readonly coordinates = computed(() => {
    const el = this.element();
    return el ? formatCoordinates(el.lat, el.lng) : '';
  });

  protected readonly surfaceArea = computed<string | null>(() => {
    const el = this.element();
    if (el?.type === 'RADIUS' && el.radiusMeters && el.radiusMeters > 0) {
      return formatArea(calculateCircleArea(el.radiusMeters));
    }
    if (el?.type === 'BOUNDARY' && el.geojson) {
      return formatArea(calculatePolygonArea(el.geojson));
    }
    return null;
  });

  protected readonly radiusText = computed(() => {
    const meters = this.element()?.radiusMeters;
    if (!meters) return null;
    return meters >= 1000 ? `${meters / 1000} km` : `${meters} m`;
  });

  protected readonly typeLabel = computed(() => {
    const el = this.element();
    if (!el) return '';
    return el.type === 'BOUNDARY' ? `Boundary (Level ${el.adminLevel || 8})` : el.type;
  });

  protected copyCoordinates(): void {
    const el = this.element();
    if (!el) return;
    void navigator.clipboard?.writeText(`${el.lat.toFixed(6)}, ${el.lng.toFixed(6)}`);
    this.copiedCoords.set(true);
    setTimeout(() => this.copiedCoords.set(false), COPIED_FEEDBACK_MS);
  }
}
