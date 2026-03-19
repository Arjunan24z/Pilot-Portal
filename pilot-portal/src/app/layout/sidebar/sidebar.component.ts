import { Component, OnInit, OnDestroy } from '@angular/core';
import { UserService } from '../../services/user/user.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface User {
  id?: string;
  _id?: string;
  email?: string;
  name?: string;
  role?: 'admin' | 'pilot';
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit, OnDestroy {
  user: User | null = null;
  private destroy$ = new Subject<void>();

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadUserProfile();
  }

  private loadUserProfile(): void {
    this.userService.getProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (profile: any) => {
          console.log('[Sidebar] User profile loaded:', profile);
          this.user = profile;
          console.log('[Sidebar] Current user role:', this.user?.role);
        },
        error: (err) => {
          console.error('[Sidebar] Error loading user profile:', err);
          this.user = null;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
