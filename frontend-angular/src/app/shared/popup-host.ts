/**
 * Host bindings for content rendered inside a Leaflet popup: pointer events must not reach the
 * map underneath, otherwise a click in the popup would also drop a new pin.
 */
export const STOP_MAP_EVENTS_HOST = {
  '(click)': '$event.stopPropagation()',
  '(dblclick)': '$event.stopPropagation()',
  '(mousedown)': '$event.stopPropagation()',
  '(pointerdown)': '$event.stopPropagation()',
};
