import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../services/auth/auth.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-callback',
  template: `
    <div class="flex items-center justify-center h-screen">
      <div class="text-center">
        <div class="mb-4">
          <div class="inline-block animate-spin">
            <svg class="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 16v-2m0-8a8 8 0 110-16 8 8 0 010 16z"></path>
            </svg>
          </div>
        </div>
        <p class="text-gray-600">Processing login...</p>
        <p class="text-sm text-red-600 mt-4" *ngIf="error">{{ error }}</p>
      </div>
    </div>
  `
})
export class CallbackComponent implements OnInit {

  error: string | null = null;
  private cognitoConfig = {
    domain: 'pilot-portal-9367',
    region: 'us-east-1',
    clientId: '7de7b7jvlt2u85icqkm4e67aun',
    redirectUri: 'http://localhost:4200/auth/callback'
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const code = params['code'];
      const error = params['error'];
      const error_description = params['error_description'];

      if (error) {
        this.error = error_description || error;
        setTimeout(() => this.router.navigate(['/login']), 3000);
        return;
      }

      if (code) {
        this.exchangeCodeForToken(code);
      } else {
        this.error = 'No authorization code received';
        setTimeout(() => this.router.navigate(['/login']), 2000);
      }
    });
  }

  private exchangeCodeForToken(code: string) {
    // Exchange code for tokens directly with Cognito (frontend can reach it)
    const tokenEndpoint = `https://${this.cognitoConfig.domain}.auth.${this.cognitoConfig.region}.amazoncognito.com/oauth2/token`;
    
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('client_id', this.cognitoConfig.clientId);
    params.append('code', code);
    params.append('redirect_uri', this.cognitoConfig.redirectUri);

    this.http.post<any>(tokenEndpoint, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }).subscribe({
      next: (tokenResponse) => {
        console.log('Token exchange successful');
        const idToken = tokenResponse.id_token;
        
        // Now send the ID token to backend to create session
        this.createSessionWithToken(idToken);
      },
      error: (err) => {
        console.error('Token exchange error:', err);
        this.error = 'Failed to exchange authorization code. Please try again.';
        setTimeout(() => this.router.navigate(['/login']), 3000);
      }
    });
  }

  private createSessionWithToken(idToken: string) {
    // Send ID token to backend to create a session
    this.auth.createSessionFromCognitoToken(idToken).subscribe({
      next: (response: any) => {
        console.log('Session created successfully');
        // Route based on user role
        const redirectPath = response.role === 'admin' ? '/admin' : '/dashboard';
        this.router.navigate([redirectPath]);
      },
      error: (err) => {
        console.error('Session creation error:', err);
        this.error = err.error?.message || 'Session creation failed. Please try again.';
        setTimeout(() => this.router.navigate(['/login']), 3000);
      }
    });
  }
}
