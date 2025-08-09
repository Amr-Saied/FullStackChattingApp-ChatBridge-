import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';

@Component({
  selector: 'app-text-input',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './text-input.html',
  styleUrl: './text-input.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextInput),
      multi: true,
    },
  ],
})
export class TextInput implements ControlValueAccessor {
  @Input() label: string = '';
  @Input() placeholder: string = '';
  @Input() type: string = 'text';
  @Input() icon: string = '';
  @Input() fieldName: string = '';
  @Input() showPasswordToggle: boolean = false;
  @Input() errorMessage: string = '';
  @Input() isRequired: boolean = false;
  @Input() disabled: boolean = false;

  value: string = '';
  showPassword: boolean = false;
  touched: boolean = false;

  // ControlValueAccessor methods
  onChange = (value: string) => {};
  onTouched = () => {};

  writeValue(value: string): void {
    this.value = value || '';
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  // Input handling
  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.value = value;
    this.onChange(value);
  }

  onBlur(): void {
    this.touched = true;
    this.onTouched();
  }

  // Password toggle
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  // Get current input type
  getCurrentType(): string {
    if (this.type === 'password' && this.showPasswordToggle) {
      return this.showPassword ? 'text' : 'password';
    }
    return this.type;
  }

  // Get icon class
  getIconClass(): string {
    if (this.type === 'password' && this.showPasswordToggle) {
      return this.showPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
    }
    return this.icon || 'fas fa-text-width';
  }
}
