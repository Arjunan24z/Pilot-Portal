import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ToastService } from '../../services/toast/toast.service';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'pilot';
  lastLogin?: Date;
  createdAt?: Date;
}

interface DashboardStats {
  totalUsers: number;
  adminCount: number;
  pilotCount: number;
  timestamp: string;
}

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {

  private API = `${environment.apiUrl}/admin`;
  
  // Dashboard
  stats: DashboardStats | null = null;
  statsLoading = false;
  
  // User Management
  users: User[] = [];
  usersLoading = false;
  selectedUser: User | null = null;
  showUserDetails = false;
  
  // Edit Mode
  editingUserId: string | null = null;
  editingRole: 'admin' | 'pilot' | null = null;
  
  // Search & Filter
  searchQuery = '';
  roleFilter: 'all' | 'admin' | 'pilot' = 'all';

  constructor(
    private http: HttpClient,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.loadDashboard();
    this.loadUsers();
  }

  /**
   * Load dashboard statistics
   */
  loadDashboard() {
    this.statsLoading = true;
    this.http.get<{ stats: DashboardStats }>(`${this.API}/dashboard`).subscribe({
      next: (response) => {
        this.stats = response.stats;
        this.statsLoading = false;
      },
      error: (err) => {
        this.statsLoading = false;
        this.toast.error(err.error?.message || 'Failed to load dashboard stats');
      }
    });
  }

  /**
   * Load all users
   */
  loadUsers() {
    this.usersLoading = true;
    this.http.get<{ count: number; data: User[] }>(`${this.API}/users`).subscribe({
      next: (response) => {
        this.users = response.data || [];
        this.usersLoading = false;
      },
      error: (err) => {
        this.usersLoading = false;
        this.toast.error(err.error?.message || 'Failed to load users');
      }
    });
  }

  /**
   * View user details
   */
  viewUserDetails(user: User) {
    this.selectedUser = user;
    this.showUserDetails = true;
    this.editingUserId = null;
  }

  /**
   * Close user details
   */
  closeUserDetails() {
    this.showUserDetails = false;
    this.selectedUser = null;
    this.editingUserId = null;
  }

  /**
   * Start editing user role
   */
  startEditRole(user: User) {
    this.editingUserId = user._id;
    this.editingRole = user.role;
  }

  /**
   * Cancel editing
   */
  cancelEdit() {
    this.editingUserId = null;
    this.editingRole = null;
  }

  /**
   * Save role change
   */
  saveRoleChange(userId: string, newRole: 'admin' | 'pilot') {
    this.http.put(
      `${this.API}/users/${userId}/role`,
      { role: newRole }
    ).subscribe({
      next: (response: any) => {
        const user = this.users.find(u => u._id === userId);
        if (user) {
          user.role = newRole;
          if (this.selectedUser?._id === userId) {
            this.selectedUser.role = newRole;
          }
        }
        this.editingUserId = null;
        this.editingRole = null;
        this.toast.success(`User role updated to ${newRole}`);
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to update role');
      }
    });
  }

  /**
   * Delete user
   */
  deleteUser(userId: string, userName: string) {
    if (!confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      return;
    }

    this.http.delete(`${this.API}/users/${userId}`).subscribe({
      next: () => {
        this.users = this.users.filter(u => u._id !== userId);
        if (this.selectedUser?._id === userId) {
          this.closeUserDetails();
        }
        this.toast.success(`User ${userName} deleted`);
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to delete user');
      }
    });
  }

  /**
   * Get filtered users
   */
  getFilteredUsers(): User[] {
    let filtered = this.users;

    // Filter by role
    if (this.roleFilter !== 'all') {
      filtered = filtered.filter(u => u.role === this.roleFilter);
    }

    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(u => 
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query)
      );
    }

    return filtered;
  }

  /**
   * Get role badge color
   */
  getRoleBadgeClass(role: string): string {
    return role === 'admin' ? 'badge-admin' : 'badge-pilot';
  }
}
