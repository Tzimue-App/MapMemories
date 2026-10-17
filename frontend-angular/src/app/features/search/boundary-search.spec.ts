import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Dom, typeInto } from '../../../testing/dom';
import { fakeSearchService, provideFake } from '../../../testing/fakes';
import { BoundaryService } from '../../core/boundary.service';
import { BoundaryItem } from '../../models/boundary';
import { BoundarySearch } from './boundary-search';

describe('BoundarySearch', () => {
  let boundaries: ReturnType<typeof fakeSearchService>;

  const occitanie: BoundaryItem = {
    osmId: 101,
    name: 'Occitanie',
    displayName: 'Occitanie, France',
    boundaryType: 'administrative',
    adminLevel: 4,
    geojson: '{"type":"Polygon"}',
  };

  beforeEach(() => {
    vi.useFakeTimers();
    boundaries = fakeSearchService();
    TestBed.configureTestingModule({ providers: [provideFake(BoundaryService, boundaries)] });
  });

  afterEach(() => vi.useRealTimers());

  const render = () => {
    const fixture = TestBed.createComponent(BoundarySearch);
    const selected = vi.fn();
    const cleared = vi.fn();
    fixture.componentInstance.selectBoundary.subscribe(selected);
    fixture.componentInstance.cleared.subscribe(cleared);
    fixture.detectChanges();
    const dom = Dom.of(fixture);
    const input = dom.get<HTMLInputElement>('input');
    const type = (value: string) => {
      typeInto(input, value);
      vi.advanceTimersByTime(350);
      fixture.detectChanges();
    };
    return { fixture, dom, input, type, selected, cleared };
  };

  it('searches after the debounce and renders results with their level badge', () => {
    boundaries.searchBoundaries.mockReturnValue(of([occitanie]));
    const { type, dom } = render();

    type('Occitanie');

    expect(boundaries.searchBoundaries).toHaveBeenCalledWith('Occitanie');
    expect(dom.byText('Occitanie')).toBeTruthy();
    expect(dom.byText('Region')).toBeTruthy();
    expect(dom.byText('🏛️')).toBeTruthy();
  });

  it('emits the selected boundary', () => {
    const toulouse = { ...occitanie, osmId: 102, name: 'Toulouse', displayName: 'Toulouse, France', adminLevel: 8 };
    boundaries.searchBoundaries.mockReturnValue(of([toulouse]));
    const { type, dom, input, selected } = render();

    type('Toulouse');
    dom.byText('Toulouse').click();

    expect(selected).toHaveBeenCalledWith(toulouse);
    expect(input.value).toBe('Toulouse');
  });

  it('shows a helpful message when nothing is found', () => {
    const { type, dom } = render();

    type('zzzz');

    expect(dom.text()).toContain('No administrative boundaries found');
  });

  it('clears the search', () => {
    boundaries.searchBoundaries.mockReturnValue(of([occitanie]));
    const { type, dom, input, cleared, fixture } = render();
    expect(dom.allButtons('Clear boundary search')).toHaveLength(0);

    type('Occitanie');
    dom.button('Clear boundary search').click();
    fixture.detectChanges();

    expect(input.value).toBe('');
    expect(dom.query('li')).toBeNull();
    expect(cleared).toHaveBeenCalled();
  });
});
