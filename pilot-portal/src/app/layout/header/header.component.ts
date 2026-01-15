import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth/auth.service';
import { UserService } from 'src/app/services/user/user.service';
import { ThemeService } from 'src/app/services/theme/theme.service';
import { ToastService } from 'src/app/services/toast/toast.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html'
})
export class HeaderComponent implements OnInit {

  user: any = {};
  initials = 'U';
  menuOpen = false;
  notificationOpen = false;
  isDarkMode = false;
  
  notifications = [
    { id: 1, title: 'License Renewal', message: 'Your PPL license expires in 30 days', time: '2 hours ago', type: 'warning', read: false },
    { id: 2, title: 'Medical Certificate', message: 'Class 1 medical approved', time: '1 day ago', type: 'success', read: false },
    { id: 3, title: 'Logbook Entry', message: 'New flight recorded successfully', time: '2 days ago', type: 'info', read: true }
  ];

  constructor(
    private auth: AuthService,
    private userService: UserService,
    private router: Router,
    private themeService: ThemeService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.userService.getProfile().subscribe({
      next: (res: any) => {
        this.user = res;
        this.initials = this.getInitials(res.name);
      }
    });

    // Subscribe to theme changes
    this.themeService.darkMode$.subscribe(isDark => {
      this.isDarkMode = isDark;
    });
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
    if (this.menuOpen) {
      this.notificationOpen = false;
    }
  }

  closeMenu() {
    this.menuOpen = false;
  }

  toggleNotifications() {
    this.notificationOpen = !this.notificationOpen;
    if (this.notificationOpen) {
      this.menuOpen = false;
    }
  }

  closeNotifications() {
    this.notificationOpen = false;
  }

  markAsRead(notificationId: number) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification && !notification.read) {
      notification.read = true;
      this.toast.success('Notification marked as read', 2000);
    }
  }

  markAllAsRead() {
    const unreadCount = this.unreadCount;
    this.notifications.forEach(n => n.read = true);
    if (unreadCount > 0) {
      this.toast.success(`${unreadCount} notifications marked as read`, 2000);
    }
  }

  clearNotification(notificationId: number) {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    this.toast.info('Notification cleared', 2000);
  }

  get unreadCount() {
    return this.notifications.filter(n => !n.read).length;
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  }

  // Close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('app-header')) {
      this.menuOpen = false;
    }
  }
}
