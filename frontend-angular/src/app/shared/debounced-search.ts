import { signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, EMPTY, Observable, of, Subject, switchMap, tap, timer } from 'rxjs';

export const SEARCH_DEBOUNCE_MS = 300;
export const SEARCH_MIN_LENGTH = 2;

/**
 * Search-as-you-type state: 300 ms debounce, 2-character minimum, stale requests cancelled.
 * Must be created in an injection context (component field initialiser).
 */
export function debouncedSearch<T>(search: (query: string) => Observable<T[]>) {
  const query = signal('');
  const results = signal<T[]>([]);
  const isLoading = signal(false);
  const hasSearched = signal(false);
  const showDropdown = signal(false);

  /** `null` cancels whatever is pending without starting a new search. */
  const input$ = new Subject<string | null>();

  input$
    .pipe(
      switchMap((raw) => {
        if (raw === null) return EMPTY;
        const trimmed = raw.trim();
        return timer(SEARCH_DEBOUNCE_MS).pipe(
          switchMap(() => {
            if (trimmed.length < SEARCH_MIN_LENGTH) return of(null);
            isLoading.set(true);
            return search(trimmed).pipe(catchError(() => of([] as T[])));
          }),
        );
      }),
      tap(() => isLoading.set(false)),
      takeUntilDestroyed(),
    )
    .subscribe((data) => {
      results.set(data ?? []);
      hasSearched.set(data !== null);
      showDropdown.set(data !== null);
    });

  const cancel = () => {
    input$.next(null);
    isLoading.set(false);
    showDropdown.set(false);
  };

  return {
    query: query.asReadonly(),
    results: results.asReadonly(),
    isLoading: isLoading.asReadonly(),
    hasSearched: hasSearched.asReadonly(),
    showDropdown: showDropdown.asReadonly(),
    /** User typed: (re)start the debounced search. */
    type(value: string) {
      query.set(value);
      input$.next(value);
    },
    /** A result was picked: show it in the input without searching again. */
    choose(label: string) {
      query.set(label);
      cancel();
    },
    clear() {
      query.set('');
      results.set([]);
      cancel();
    },
    close() {
      showDropdown.set(false);
    },
  };
}
