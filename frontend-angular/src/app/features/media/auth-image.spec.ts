import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject, throwError } from 'rxjs';
import { Dom } from '../../../testing/dom';
import { fakeMediaService, provideFake } from '../../../testing/fakes';
import { MediaService } from '../../core/media.service';
import { AuthImage } from './auth-image';

@Component({
  imports: [AuthImage],
  template: `
    @if (shown()) {
      @if (withFallback()) {
        <app-auth-image [src]="src()" alt="Test photo" imgClass="w-10 h-10" fallback="Failed to load" />
      } @else {
        <app-auth-image [src]="src()" alt="Test photo" imgClass="w-10 h-10" />
      }
    }
  `,
})
class Host {
  readonly src = signal('/api/photos/1/content');
  readonly shown = signal(true);
  readonly withFallback = signal(false);
}

describe('AuthImage', () => {
  let media: ReturnType<typeof fakeMediaService>;

  beforeEach(() => {
    media = fakeMediaService();
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:http://localhost/test-uuid');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    TestBed.configureTestingModule({ providers: [provideFake(MediaService, media)] });
  });

  const render = async (configure?: (host: Host) => void) => {
    const fixture = TestBed.createComponent(Host);
    configure?.(fixture.componentInstance);
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, dom: Dom.of(fixture) };
  };

  it('shows a loading placeholder, then the image once the authenticated blob is loaded', async () => {
    const blob$ = new Subject<Blob>();
    media.getPhotoBlob.mockReturnValue(blob$);
    const { fixture, dom } = await render();

    const placeholder = dom.get('[role="img"]');
    expect(placeholder.tagName).toBe('DIV');
    expect(placeholder.getAttribute('aria-label')).toBe('Test photo');
    expect(dom.text()).toContain('Loading...');

    const blob = new Blob(['image-bytes'], { type: 'image/jpeg' });
    blob$.next(blob);
    await fixture.whenStable();

    const img = dom.get<HTMLImageElement>('img');
    expect(img.getAttribute('src')).toBe('blob:http://localhost/test-uuid');
    expect(img.getAttribute('alt')).toBe('Test photo');
    expect([...img.classList].sort()).toEqual(['h-10', 'w-10']);
    expect(media.getPhotoBlob).toHaveBeenCalledWith('/api/photos/1/content');
    expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
  });

  it('renders blob: URLs directly without fetching', async () => {
    const { dom } = await render((host) => host.src.set('blob:http://localhost/local-preview'));

    expect(dom.get('img').getAttribute('src')).toBe('blob:http://localhost/local-preview');
    expect(media.getPhotoBlob).not.toHaveBeenCalled();
  });

  it('shows the fallback text when loading fails', async () => {
    media.getPhotoBlob.mockReturnValue(throwError(() => new Error('Network error')));
    const { dom } = await render((host) => host.withFallback.set(true));

    expect(dom.text()).toContain('Failed to load');
    expect(dom.query('img')).toBeNull();
  });

  it('revokes the object URL when destroyed', async () => {
    const blob$ = new Subject<Blob>();
    media.getPhotoBlob.mockReturnValue(blob$);
    const { fixture } = await render();
    blob$.next(new Blob(['bytes']));
    await fixture.whenStable();

    fixture.componentInstance.shown.set(false);
    await fixture.whenStable();

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/test-uuid');
  });

  it('revokes the previous object URL when the source changes', async () => {
    const blob$ = new Subject<Blob>();
    media.getPhotoBlob.mockReturnValue(blob$);
    const { fixture } = await render();
    blob$.next(new Blob(['bytes']));
    await fixture.whenStable();

    fixture.componentInstance.src.set('/api/photos/2/content');
    await fixture.whenStable();

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/test-uuid');
    expect(media.getPhotoBlob).toHaveBeenLastCalledWith('/api/photos/2/content');
  });
});
