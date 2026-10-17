import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth.service';

const INPUT_CLASS =
  'w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500';

@Component({
  selector: 'app-auth-modal',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './auth-modal.html',
})
export class AuthModal {
  private readonly auth = inject(AuthService);

  readonly isOpen = input(false);
  readonly closed = output<void>();

  protected readonly inputClass = INPUT_CLASS;
  protected readonly isSignUp = signal(false);
  protected readonly error = signal('');
  protected readonly loading = signal(false);

  protected readonly form = inject(NonNullableFormBuilder).group({
    username: ['', Validators.required],
    email: [''],
    password: ['', Validators.required],
  });

  protected setMode(signUp: boolean): void {
    this.isSignUp.set(signUp);
    this.error.set('');
    const email = this.form.controls.email;
    email.setValidators(signUp ? [Validators.required, Validators.email] : []);
    email.updateValueAndValidity();
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { username, email, password } = this.form.getRawValue();
    this.error.set('');
    this.loading.set(true);
    try {
      if (this.isSignUp()) {
        await this.auth.register(username, email, password);
      } else {
        await this.auth.login(username, password);
      }
      this.closed.emit();
    } catch (err) {
      this.error.set((err as Error)?.message || 'An error occurred during authentication');
    } finally {
      this.loading.set(false);
    }
  }
}
