import { Component, OnInit } from '@angular/core';
import { UserService } from 'src/app/services/user/user.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {

  profile: any = {};
  loading = true;
  message = '';

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile() {
    this.loading = true;

    this.userService.getProfile().subscribe({
      next: (res: any) => {
        this.profile = res;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  saveProfile() {
    this.userService.updateProfile({
      name: this.profile.name,
      phone: this.profile.phone,
      address: this.profile.address
    }).subscribe({
      next: () => {
        this.message = "Profile updated successfully!";
        setTimeout(() => {
          this.message = '';
        }, 3000);
      },
      error: () => {
        this.message = "Error updating profile!";
        setTimeout(() => {
          this.message = '';
        }, 3000);
      }
    });
  }

  getInitials(name: string): string {
    if (!name) return 'P';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
}
