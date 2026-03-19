import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../services/auth/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html'
})
export class LoginComponent implements OnInit {

  cognitoLoginUrl: string | null = null;
  error: string | null = null;

  constructor(private auth: AuthService) {}

  ngOnInit() {
    // Get the Cognito login URL
    this.getCognitoLoginUrl();
  }

  getCognitoLoginUrl() {
    this.auth.getCognitoLoginUrl().subscribe({
      next: (response: any) => {
        this.cognitoLoginUrl = response.loginUrl;
      },
      error: (err) => {
        console.error('Error getting Cognito login URL:', err);
        this.error = 'Failed to initialize AWS login';
      }
    });
  }

  loginWithAWS() {
    if (this.cognitoLoginUrl) {
      window.location.href = this.cognitoLoginUrl;
    }
  }
}
