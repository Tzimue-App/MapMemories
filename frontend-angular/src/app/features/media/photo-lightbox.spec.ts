import { TestBed } from '@angular/core/testing';
import { Dom } from '../../../testing/dom';
import { fakeMediaService, provideFake } from '../../../testing/fakes';
import { photo } from '../../../testing/photos';
import { MediaService } from '../../core/media.service';
import { PhotoItem } from '../../models/media';
import { PhotoLightbox } from './photo-lightbox';

describe('PhotoLightbox', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideFake(MediaService, fakeMediaService())] });
  });

  const render = async (value: PhotoItem | null) => {
    const fixture = TestBed.createComponent(PhotoLightbox);
    fixture.componentRef.setInput('photo', value);
    await fixture.whenStable();
    return { fixture, dom: Dom.of(fixture) };
  };

  it('renders nothing when photo is null', async () => {
    const { dom } = await render(null);
    expect(dom.query('[data-testid="photo-lightbox"]')).toBeNull();
  });

  it('renders the photo with its caption and emits closed', async () => {
    const { fixture, dom } = await render(photo(1, 'Mountain View', 'landscape.png'));
    const closed = vi.fn();
    fixture.componentInstance.closed.subscribe(closed);

    expect(dom.query('[data-testid="photo-lightbox"]')).not.toBeNull();
    expect(TestBed.inject(MediaService).getPhotoBlob).toHaveBeenCalledWith('/api/photos/1/content');
    expect(dom.get('img').getAttribute('alt')).toBe('Mountain View');
    expect(dom.allByText('Mountain View').length).toBeGreaterThan(0);

    dom.get('[data-testid="lightbox-close"]').click();
    expect(closed).toHaveBeenCalled();
  });

  it('falls back to the original filename when there is no caption', async () => {
    const { dom } = await render(photo(1, '', 'landscape.png'));
    expect(dom.byText('landscape.png')).toBeTruthy();
  });
});
