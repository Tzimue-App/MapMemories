import { TestBed } from '@angular/core/testing';
import { Dom } from '../../../testing/dom';
import { fakeMediaService, provideFake } from '../../../testing/fakes';
import { photo } from '../../../testing/photos';
import { MediaService } from '../../core/media.service';
import { PhotoItem } from '../../models/media';
import { PhotoGallery } from './photo-gallery';

describe('PhotoGallery', () => {
  const photos = [photo(1, 'Beautiful Sunset', 'sunset.jpg'), photo(2, '', 'mountain.jpg')];

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideFake(MediaService, fakeMediaService())] });
  });

  const render = async (list: PhotoItem[], deletePhoto?: (id: number) => Promise<void>) => {
    const fixture = TestBed.createComponent(PhotoGallery);
    fixture.componentRef.setInput('photos', list);
    if (deletePhoto) fixture.componentRef.setInput('deletePhoto', deletePhoto);
    await fixture.whenStable();
    return { fixture, dom: Dom.of(fixture) };
  };

  it('renders an empty message when there are no photos', async () => {
    const { dom } = await render([]);
    expect(dom.text()).toMatch(/No photos attached yet/i);
  });

  it('renders one authenticated image per photo, with captions', async () => {
    const { dom } = await render(photos);

    const images = dom.queryAll('[data-testid="photo-gallery"] app-auth-image');
    expect(images).toHaveLength(2);
    expect(dom.queryAll('[data-testid="photo-gallery"] img').map((i) => i.getAttribute('alt'))).toEqual([
      'Beautiful Sunset',
      'mountain.jpg',
    ]);
    expect(dom.byText('Beautiful Sunset')).toBeTruthy();
  });

  it('hides delete buttons when deleting is not allowed', async () => {
    const { dom } = await render(photos);
    expect(dom.allButtons('Delete Photo')).toHaveLength(0);
  });

  it('calls deletePhoto with the photo id without opening the lightbox', async () => {
    const deletePhoto = vi.fn(async () => undefined);
    const { fixture, dom } = await render(photos, deletePhoto);

    const buttons = dom.allButtons('Delete Photo');
    expect(buttons).toHaveLength(2);
    buttons[0].click();
    await fixture.whenStable();

    expect(deletePhoto).toHaveBeenCalledWith(1);
    expect(dom.query('[data-testid="photo-lightbox"]')).toBeNull();
  });

  it('opens the lightbox when a photo is clicked', async () => {
    const { fixture, dom } = await render(photos);

    dom.queryAll('[data-testid="photo-gallery"] > div')[0].click();
    await fixture.whenStable();

    expect(dom.query('[data-testid="photo-lightbox"]')).not.toBeNull();
  });
});
