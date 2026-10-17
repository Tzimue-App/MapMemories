import { TestBed } from '@angular/core/testing';
import { Dom } from '../../../testing/dom';
import { fakeMediaService, provideFake } from '../../../testing/fakes';
import { photo } from '../../../testing/photos';
import { MediaService } from '../../core/media.service';
import { PhotoItem } from '../../models/media';
import { PhotoCarousel } from './photo-carousel';

describe('PhotoCarousel', () => {
  const photos = [photo(1, 'First photo caption'), photo(2, 'Second photo caption')];

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideFake(MediaService, fakeMediaService())] });
  });

  const render = async (list: PhotoItem[]) => {
    const fixture = TestBed.createComponent(PhotoCarousel);
    fixture.componentRef.setInput('photos', list);
    await fixture.whenStable();
    const dom = Dom.of(fixture);
    const click = async (el: HTMLElement) => {
      el.click();
      await fixture.whenStable();
    };
    return { fixture, dom, click };
  };

  it('renders a placeholder when there are no photos', async () => {
    const { dom } = await render([]);
    expect(dom.text()).toMatch(/no photos attached/i);
  });

  it('renders the first photo with its counter', async () => {
    const { dom } = await render(photos);
    expect(dom.text()).toMatch(/first photo caption/i);
    expect(dom.byText('1 / 2')).toBeTruthy();
  });

  it('navigates with next/previous and wraps around', async () => {
    const { dom, click } = await render(photos);

    await click(dom.button('Next photo'));
    expect(dom.text()).toMatch(/second photo caption/i);
    expect(dom.byText('2 / 2')).toBeTruthy();

    await click(dom.button('Next photo'));
    expect(dom.byText('1 / 2')).toBeTruthy();

    await click(dom.button('Previous photo'));
    expect(dom.byText('2 / 2')).toBeTruthy();
  });

  it('hides navigation for a single photo', async () => {
    const { dom } = await render([photos[0]]);
    expect(dom.allButtons(/photo$/)).toHaveLength(0);
    expect(dom.allButtons(/Thumbnail/)).toHaveLength(0);
  });

  it('selects a photo from its thumbnail', async () => {
    const { dom, click } = await render(photos);
    const thumbnails = dom.allButtons(/Thumbnail/);
    expect(thumbnails).toHaveLength(2);

    await click(thumbnails[1]);

    expect(dom.byText('2 / 2')).toBeTruthy();
  });

  it('opens the lightbox when the main image is clicked', async () => {
    const { dom, click } = await render(photos);
    await click(dom.get('[data-testid="carousel-stage"] app-auth-image'));
    expect(dom.query('[data-testid="photo-lightbox"]')).not.toBeNull();
  });

  it('stays in range when the photo list shrinks', async () => {
    const { fixture, dom, click } = await render(photos);
    await click(dom.button('Next photo'));

    fixture.componentRef.setInput('photos', [photos[0]]);
    await fixture.whenStable();

    expect(dom.byText('1 / 1')).toBeTruthy();
  });
});
