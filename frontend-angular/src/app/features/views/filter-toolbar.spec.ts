import { TestBed } from '@angular/core/testing';
import { Dom, typeInto } from '../../../testing/dom';
import { FilterCriteria } from '../../models/view';
import { FilterToolbar } from './filter-toolbar';

describe('FilterToolbar', () => {
  const initial: FilterCriteria = { type: 'ALL', dateRange: 'ALL', searchQuery: '' };

  const render = async (criteria: FilterCriteria = initial) => {
    const fixture = TestBed.createComponent(FilterToolbar);
    fixture.componentRef.setInput('criteria', criteria);
    fixture.componentRef.setInput('counts', { ALL: 10, PIN: 4, RADIUS: 3, BOUNDARY: 3 });
    const changed = vi.fn();
    fixture.componentInstance.criteria.subscribe(changed);
    await fixture.whenStable();
    return { fixture, dom: Dom.of(fixture), changed };
  };

  it('renders the type pills with counts', async () => {
    const { dom } = await render();

    expect(dom.byText('All (10)')).toBeTruthy();
    expect(dom.byText('Pins (4)')).toBeTruthy();
    expect(dom.byText('Circles (3)')).toBeTruthy();
    expect(dom.byText('Boundaries (3)')).toBeTruthy();
  });

  it('changes the type filter', async () => {
    const { dom, changed } = await render();
    dom.button('Pins').click();
    expect(changed).toHaveBeenCalledWith({ ...initial, type: 'PIN' });
  });

  it('changes the search query', async () => {
    const { dom, changed } = await render();
    typeInto(dom.byPlaceholder(/filter memories.../i), 'monument');
    expect(changed).toHaveBeenCalledWith({ ...initial, searchQuery: 'monument' });
  });

  it('clears the search query', async () => {
    const { dom, changed } = await render({ ...initial, searchQuery: 'x' });
    dom.button('Clear filter').click();
    expect(changed).toHaveBeenCalledWith(initial);
  });

  it('changes the date range', async () => {
    const { dom, changed } = await render();
    typeInto(dom.get<HTMLSelectElement>('select[aria-label="Date filter"]'), 'WEEK');
    expect(changed).toHaveBeenCalledWith({ ...initial, dateRange: 'WEEK' });
  });
});
