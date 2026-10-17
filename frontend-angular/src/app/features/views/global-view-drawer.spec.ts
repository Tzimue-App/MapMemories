import { TestBed } from '@angular/core/testing';
import { Dom, swipe, typeInto } from '../../../testing/dom';
import { UnifiedMapElement } from '../../models/view';
import { GlobalViewDrawer } from './global-view-drawer';

describe('GlobalViewDrawer', () => {
  const elements: UnifiedMapElement[] = [
    {
      id: 'pin-1',
      dbId: 1,
      type: 'PIN',
      title: 'Montmartre Point',
      description: 'Scenic viewpoint in Paris',
      lat: 48.8867,
      lng: 2.3431,
      color: '#3B82F6',
      createdAt: '2026-10-10T10:00:00Z',
    },
    {
      id: 'boundary-2',
      dbId: 2,
      type: 'BOUNDARY',
      title: 'Ile-de-France',
      description: 'Capital region',
      lat: 48.8566,
      lng: 2.3522,
      color: '#8B5CF6',
      createdAt: '2026-10-09T10:00:00Z',
    },
    {
      id: 'pin-3',
      type: 'RADIUS',
      title: 'Zone',
      lat: 1,
      lng: 2,
      radiusMeters: 500,
      color: '#EF4444',
    },
  ];

  const render = async (isOpen = true) => {
    const fixture = TestBed.createComponent(GlobalViewDrawer);
    fixture.componentRef.setInput('isOpen', isOpen);
    fixture.componentRef.setInput('elements', elements);
    const closed = vi.fn();
    const selected = vi.fn();
    fixture.componentInstance.closed.subscribe(closed);
    fixture.componentInstance.selectElement.subscribe(selected);
    await fixture.whenStable();
    return { fixture, dom: Dom.of(fixture), closed, selected };
  };

  it('lists every element with type badges, coordinates and counts', async () => {
    const { dom } = await render();

    expect(dom.byText('Montmartre Point')).toBeTruthy();
    expect(dom.byText('Ile-de-France')).toBeTruthy();
    expect(dom.byText('All (3)')).toBeTruthy();
    expect(dom.byText('3 elements listed')).toBeTruthy();
    expect(dom.text()).toContain('48.8867° N, 2.3431° E');
    expect(dom.text()).toContain('Radius: 500m');
    expect(dom.text()).toMatch(/Pin/);
    expect(dom.text()).toMatch(/Circle/);
  });

  it('is translated off-screen when closed', async () => {
    const { dom } = await render(false);

    expect(dom.get('[data-testid="global-view-drawer"]').classList).toContain('-translate-x-full');
    expect(dom.query('[data-testid="drawer-backdrop"]')).toBeNull();
  });

  it('emits the clicked element', async () => {
    const { dom, selected } = await render();
    dom.byText('Montmartre Point').click();
    expect(selected).toHaveBeenCalledWith(elements[0]);
  });

  it('filters the list through the search input', async () => {
    const { fixture, dom } = await render();

    typeInto(dom.byPlaceholder(/filter memories.../i), 'Montmartre');
    await fixture.whenStable();

    expect(dom.queryByText('Montmartre Point')).not.toBeNull();
    expect(dom.queryByText('Ile-de-France')).toBeNull();
    expect(dom.byText('1 element listed')).toBeTruthy();
  });

  it('shows an empty-state message', async () => {
    const { fixture, dom } = await render();

    typeInto(dom.byPlaceholder(/filter memories.../i), 'nothing-matches');
    await fixture.whenStable();

    expect(dom.text()).toContain('No matching elements found.');
  });

  it('closes from the close button and the backdrop', async () => {
    const { dom, closed } = await render();

    dom.button('Close memories drawer').click();
    dom.get('[data-testid="drawer-backdrop"]').click();

    expect(closed).toHaveBeenCalledTimes(2);
  });

  describe('mobile layout & touch', () => {
    const drawer = (dom: Dom) => dom.get('[data-testid="global-view-drawer"]');

    it('spans the full screen width on phones and a fixed width from the sm breakpoint', async () => {
      const { dom } = await render();
      expect(drawer(dom).classList).toContain('w-full');
      expect(drawer(dom).classList).toContain('sm:w-96');
    });

    it('closes when swiped towards its edge (left)', async () => {
      const { dom, closed } = await render();
      swipe(drawer(dom), { x: 300, y: 200 }, { x: 120, y: 200 });
      expect(closed).toHaveBeenCalledTimes(1);
    });

    it('stays open when swiped away from its edge (right)', async () => {
      const { dom, closed } = await render();
      swipe(drawer(dom), { x: 100, y: 200 }, { x: 300, y: 200 });
      expect(closed).not.toHaveBeenCalled();
    });
  });
});
