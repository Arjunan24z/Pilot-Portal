import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-tokens',
  templateUrl: './tokens.component.html',
  styleUrls: ['./tokens.component.scss']
})
export class TokensComponent implements OnInit {
  
  tokens: any[] = [];
  auditLogs: any[] = [];
  loading = false;
  showGenerateForm = false;
  showAuditLogs = false;
  message = '';
  messageType: 'success' | 'error' = 'success';

  // Generate token form
  generateForm = {
    appName: '',
    scopes: [] as string[],
    expiresInMinutes: 1440
  };

  availableScopes = [
    { value: 'logbook:read', label: 'Logbook - Read' },
    { value: 'logbook:write', label: 'Logbook - Write' },
    { value: 'license:read', label: 'License - Read' },
    { value: 'license:write', label: 'License - Write' },
    { value: 'medicals:read', label: 'Medicals - Read' },
    { value: 'medicals:write', label: 'Medicals - Write' },
    { value: 'profile:read', label: 'Profile - Read' },
    { value: 'profile:write', label: 'Profile - Write' }
  ];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadTokens();
  }

  loadTokens() {
    this.loading = true;
    this.http.get(`${environment.apiUrl}/auth/tokens`).subscribe({
      next: (res: any) => {
        this.tokens = res.data || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.showMessage('Error loading tokens', 'error');
      }
    });
  }

  toggleScope(scope: string) {
    const index = this.generateForm.scopes.indexOf(scope);
    if (index > -1) {
      this.generateForm.scopes.splice(index, 1);
    } else {
      this.generateForm.scopes.push(scope);
    }
  }

  isScopeSelected(scope: string): boolean {
    return this.generateForm.scopes.includes(scope);
  }

  generateToken() {
    if (!this.generateForm.appName.trim()) {
      this.showMessage('App name is required', 'error');
      return;
    }

    if (this.generateForm.scopes.length === 0) {
      this.showMessage('Select at least one scope', 'error');
      return;
    }

    this.loading = true;
    this.http.post(`${environment.apiUrl}/auth/token/issue`, {
      appName: this.generateForm.appName,
      scopes: this.generateForm.scopes,
      expiresInMinutes: this.generateForm.expiresInMinutes
    }).subscribe({
      next: () => {
        this.showMessage('Token generated successfully!', 'success');
        this.resetForm();
        this.loadTokens();
      },
      error: (err) => {
        this.showMessage(err.error?.message || 'Error generating token', 'error');
        this.loading = false;
      }
    });
  }

  revokeToken(token: any) {
    if (!confirm(`Are you sure you want to revoke "${token.appName}"?`)) {
      return;
    }

    this.loading = true;
    this.http.post(`${environment.apiUrl}/auth/token/revoke`, {
      jti: token.jti
    }).subscribe({
      next: () => {
        this.showMessage('Token revoked successfully!', 'success');
        this.loadTokens();
      },
      error: (err) => {
        this.showMessage(err.error?.message || 'Error revoking token', 'error');
        this.loading = false;
      }
    });
  }

  loadAuditLogs() {
    this.loading = true;
    this.http.get(`${environment.apiUrl}/auth/audit-logs`).subscribe({
      next: (res: any) => {
        this.auditLogs = res.data || [];
        this.showAuditLogs = true;
        this.loading = false;
      },
      error: () => {
        this.showMessage('Error loading audit logs', 'error');
        this.loading = false;
      }
    });
  }

  copyToken(token: string) {
    navigator.clipboard.writeText(token);
    this.showMessage('Token copied to clipboard!', 'success');
  }

  resetForm() {
    this.generateForm = {
      appName: '',
      scopes: [],
      expiresInMinutes: 1440
    };
    this.showGenerateForm = false;
  }

  showMessage(msg: string, type: 'success' | 'error') {
    this.message = msg;
    this.messageType = type;
    setTimeout(() => {
      this.message = '';
    }, 4000);
  }

  getStatusClass(token: any): string {
    return token.isRevoked ? 'revoked' : 'active';
  }

  getStatusText(token: any): string {
    return token.isRevoked ? 'REVOKED' : 'ACTIVE';
  }
}
