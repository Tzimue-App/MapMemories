import { ComponentFixture } from '@angular/core/testing';

/** Minimal Testing-Library-style helpers over a fixture's DOM. */
export class Dom {
  constructor(private readonly root: () => HTMLElement) {}

  static of(fixture: ComponentFixture<unknown>): Dom {
    return new Dom(() => fixture.nativeElement as HTMLElement);
  }

  static document(): Dom {
    return new Dom(() => document.body);
  }

  query<T extends Element = HTMLElement>(selector: string): T | null {
    return this.root().querySelector<T>(selector) as T | null;
  }

  queryAll<T extends Element = HTMLElement>(selector: string): T[] {
    return Array.from(this.root().querySelectorAll<T>(selector)) as T[];
  }

  get<T extends Element = HTMLElement>(selector: string): T {
    const el = this.query<T>(selector);
    if (!el) throw new Error(`No element matches "${selector}"`);
    return el;
  }

  /** Elements whose own trimmed text content matches (deepest match wins). */
  allByText(text: string | RegExp, selector = '*'): HTMLElement[] {
    const matches = (el: Element) => {
      const content = el.textContent?.trim() ?? '';
      return typeof text === 'string' ? content === text : text.test(content);
    };
    return this.queryAll<HTMLElement>(selector).filter(
      (el) => matches(el) && !Array.from(el.children).some((child) => matches(child)),
    );
  }

  queryByText(text: string | RegExp, selector = '*'): HTMLElement | null {
    return this.allByText(text, selector)[0] ?? null;
  }

  byText(text: string | RegExp, selector = '*'): HTMLElement {
    const el = this.queryByText(text, selector);
    if (!el) throw new Error(`No element with text ${text}`);
    return el;
  }

  /** Buttons by accessible name (aria-label, else title, else text). */
  allButtons(name: string | RegExp): HTMLButtonElement[] {
    const test = (value: string) => (typeof name === 'string' ? value === name : name.test(value));
    return this.queryAll<HTMLButtonElement>('button').filter((b) =>
      test(b.getAttribute('aria-label') ?? b.getAttribute('title') ?? b.textContent?.trim() ?? ''),
    );
  }

  button(name: string | RegExp): HTMLButtonElement {
    const [el] = this.allButtons(name);
    if (!el) throw new Error(`No button named ${name}`);
    return el;
  }

  byPlaceholder<T extends HTMLElement = HTMLInputElement>(placeholder: RegExp): T {
    const el = this.queryAll<T>('[placeholder]').find((e) => placeholder.test(e.getAttribute('placeholder') ?? ''));
    if (!el) throw new Error(`No element with placeholder ${placeholder}`);
    return el;
  }

  text(): string {
    return this.root().textContent ?? '';
  }
}

export function typeInto(el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, value: string): void {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

export const tick = () => new Promise<void>((resolve) => setTimeout(resolve));
