import { TestBed } from '@angular/core/testing';
import { Dom } from '../../../testing/dom';
import { BOUNDARY_COLOR_OPTIONS, SavedBoundaryItem } from '../../models/boundary';
import { BoundaryConfigPanel } from './boundary-config-panel';

describe('BoundaryConfigPanel', () => {
  const boundary: SavedBoundaryItem = {
    id: 'boundary-1',
    osmId: 101,
    name: 'France',
    displayName: 'France (Metropolitan)',
    boundaryType: 'administrative',
    adminLevel: 2,
    geojson: '{"type":"Polygon"}',
    color: '#8b5cf6',
  };

  const render = async () => {
    const fixture = TestBed.createComponent(BoundaryConfigPanel);
    fixture.componentRef.setInput('boundary', boundary);
    const color = vi.fn();
    const deleted = vi.fn();
    fixture.componentInstance.colorChange.subscribe(color);
    fixture.componentInstance.delete.subscribe(deleted);
    await fixture.whenStable();
    return { dom: Dom.of(fixture), color, deleted };
  };

  it('renders the name, level badge and the 7 colour choices', async () => {
    const { dom } = await render();

    expect(dom.byText('France', 'h3')).toBeTruthy();
    expect(dom.byText('Country')).toBeTruthy();
    BOUNDARY_COLOR_OPTIONS.forEach((option) => expect(dom.button(option.label)).toBeTruthy());
  });

  it('emits colorChange', async () => {
    const { dom, color } = await render();
    dom.button('Red').click();
    expect(color).toHaveBeenCalledWith('#ef4444');
  });

  it('emits delete with the boundary id and stops propagation', async () => {
    const { dom, deleted } = await render();
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    const stopPropagation = vi.spyOn(click, 'stopPropagation');

    dom.button('Delete boundary').dispatchEvent(click);

    expect(deleted).toHaveBeenCalledWith('boundary-1');
    expect(stopPropagation).toHaveBeenCalled();
  });
});
