import { TestBed } from '@angular/core/testing';
import { Dom, typeInto } from '../../../testing/dom';
import { FakeAuthService, provideFakeAuth } from '../../../testing/fakes';
import { AuthModal } from './auth-modal';

describe('AuthModal', () => {
  let auth: FakeAuthService;

  beforeEach(() => {
    auth = new FakeAuthService();
    TestBed.configureTestingModule({ providers: [provideFakeAuth(auth)] });
  });

  const render = async (isOpen = true) => {
    const fixture = TestBed.createComponent(AuthModal);
    fixture.componentRef.setInput('isOpen', isOpen);
    const closed = vi.fn();
    fixture.componentInstance.closed.subscribe(closed);
    await fixture.whenStable();
    return { fixture, dom: Dom.of(fixture), closed };
  };

  it('renders nothing when closed', async () => {
    const { dom } = await render(false);
    expect(dom.query('form')).toBeNull();
  });

  it('renders the sign in tab by default', async () => {
    const { dom } = await render();

    expect(dom.byText('Sign In', 'h2')).toBeTruthy();
    expect(dom.byPlaceholder(/Username/i)).toBeTruthy();
    expect(dom.byPlaceholder(/Password/i)).toBeTruthy();
    expect(dom.queryAll('[placeholder="Email"]')).toHaveLength(0);
  });

  it('switches to the Sign Up tab', async () => {
    const { fixture, dom } = await render();

    dom.allButtons('Sign Up')[0].click();
    await fixture.whenStable();

    expect(dom.byText('Create Account', 'h2')).toBeTruthy();
    expect(dom.byPlaceholder(/Email/i)).toBeTruthy();
  });

  it('signs in and emits closed on success', async () => {
    const { fixture, dom, closed } = await render();

    typeInto(dom.byPlaceholder(/Username/i), 'user1');
    typeInto(dom.byPlaceholder(/Password/i), 'pass123');
    dom.get('[data-testid="auth-form"]').dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(auth.login).toHaveBeenCalledWith('user1', 'pass123');
    expect(closed).toHaveBeenCalled();
  });

  it('registers with email when in Sign Up mode', async () => {
    const { fixture, dom, closed } = await render();
    dom.allButtons('Sign Up')[0].click();
    await fixture.whenStable();

    typeInto(dom.byPlaceholder(/Username/i), 'jane');
    typeInto(dom.byPlaceholder(/Email/i), 'jane@example.com');
    typeInto(dom.byPlaceholder(/Password/i), 'secret');
    dom.get('[data-testid="auth-form"]').dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(auth.register).toHaveBeenCalledWith('jane', 'jane@example.com', 'secret');
    expect(closed).toHaveBeenCalled();
  });

  it('does not submit while required fields are empty', async () => {
    const { fixture, dom, closed } = await render();

    dom.get('[data-testid="auth-form"]').dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(auth.login).not.toHaveBeenCalled();
    expect(closed).not.toHaveBeenCalled();
  });

  it('shows the error message and stays open on failure, clearing it when switching tab', async () => {
    auth.login.mockRejectedValueOnce(new Error('Invalid credentials'));
    const { fixture, dom, closed } = await render();

    typeInto(dom.byPlaceholder(/Username/i), 'wrong');
    typeInto(dom.byPlaceholder(/Password/i), 'wrong');
    dom.get('[data-testid="auth-form"]').dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(dom.text()).toContain('Invalid credentials');
    expect(closed).not.toHaveBeenCalled();

    dom.allButtons('Sign Up')[0].click();
    await fixture.whenStable();
    expect(dom.text()).not.toContain('Invalid credentials');
  });

  it('emits closed from the close button', async () => {
    const { dom, closed } = await render();
    dom.button('Close').click();
    expect(closed).toHaveBeenCalled();
  });
});
