import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Dom, typeInto } from '../../../testing/dom';
import { fakeSearchService, provideFake } from '../../../testing/fakes';
import { NominatimService } from '../../core/nominatim.service';
import { SearchResult } from '../../models/search';
import { AddressSearch } from './address-search';

describe('AddressSearch', () => {
  let nominatim: ReturnType<typeof fakeSearchService>;

  beforeEach(() => {
    vi.useFakeTimers();
    nominatim = fakeSearchService();
    TestBed.configureTestingModule({ providers: [provideFake(NominatimService, nominatim)] });
  });

  afterEach(() => vi.useRealTimers());

  const render = () => {
    const fixture = TestBed.createComponent(AddressSearch);
    const selected = vi.fn();
    fixture.componentInstance.selectLocation.subscribe(selected);
    fixture.detectChanges();
    const dom = Dom.of(fixture);
    const input = dom.byPlaceholder(/search address or place.../i);
    const type = (value: string) => {
      typeInto(input, value);
      vi.advanceTimersByTime(300);
      fixture.detectChanges();
    };
    return { fixture, dom, input, type, selected };
  };

  it('renders the search input', () => {
    expect(render().input).toBeTruthy();
  });

  it('searches after a 300 ms pause and lists suggestions', () => {
    const results: SearchResult[] = [
      { id: 1, displayName: 'Paris, France', lat: 48.8566, lon: 2.3522 },
      { id: 2, displayName: 'Paris, Texas, USA', lat: 33.6609, lon: -95.5555 },
    ];
    nominatim.searchLocations.mockReturnValue(of(results));
    const { fixture, dom, input } = render();

    typeInto(input, 'Paris');
    vi.advanceTimersByTime(299);
    expect(nominatim.searchLocations).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    fixture.detectChanges();

    expect(nominatim.searchLocations).toHaveBeenCalledWith('Paris');
    expect(dom.byText('Paris, France')).toBeTruthy();
    expect(dom.byText('Paris, Texas, USA')).toBeTruthy();
  });

  it('only searches the last value typed within the debounce window', () => {
    const { input, fixture } = render();

    typeInto(input, 'Par');
    vi.advanceTimersByTime(100);
    typeInto(input, 'Paris');
    vi.advanceTimersByTime(300);
    fixture.detectChanges();

    expect(nominatim.searchLocations).toHaveBeenCalledTimes(1);
    expect(nominatim.searchLocations).toHaveBeenCalledWith('Paris');
  });

  it('needs at least 2 characters', () => {
    const { type, dom } = render();

    type('P');

    expect(nominatim.searchLocations).not.toHaveBeenCalled();
    expect(dom.text()).not.toMatch(/no results found/i);
  });

  it('emits the selected suggestion, fills the input and closes the list', () => {
    const lyon = { id: 1, displayName: 'Lyon, France', lat: 45.764, lon: 4.8357 };
    nominatim.searchLocations.mockReturnValue(of([lyon]));
    const { type, dom, input, selected, fixture } = render();

    type('Lyon');
    dom.byText('Lyon, France', 'li').click();
    fixture.detectChanges();

    expect(selected).toHaveBeenCalledWith(lyon);
    expect(input.value).toBe('Lyon, France');
    expect(dom.query('li')).toBeNull();

    vi.advanceTimersByTime(1000);
    expect(nominatim.searchLocations).toHaveBeenCalledTimes(1);
  });

  it('shows a no-results message', () => {
    const { type, dom } = render();

    type('NonexistentPlace12345');

    expect(dom.text()).toMatch(/no results found/i);
  });

  it('closes the dropdown on an outside click', () => {
    nominatim.searchLocations.mockReturnValue(of([{ id: 1, displayName: 'Paris, France', lat: 1, lon: 2 }]));
    const { type, dom, fixture } = render();
    type('Paris');

    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    fixture.detectChanges();

    expect(dom.query('li')).toBeNull();
  });
});
