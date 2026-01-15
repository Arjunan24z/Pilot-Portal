import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html'
})
export class RegisterComponent {

  name = '';
  email = '';
  phone = '';
  password = '';
  error = '';
  success = '';

  constructor(private auth: AuthService, private router: Router) {}

  register() {
    this.auth.register(this.name, this.email, this.password, this.phone)
      .subscribe({
        next: () => {
          this.success = "Registration successful!";
          setTimeout(() => this.router.navigate(['/login']), 1000);
        },
        error: (err) => {
          this.error = err.error.message || 'Registration failed';
        }
      });
  }
}
