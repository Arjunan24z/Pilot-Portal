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
      },
      error: () => {
        this.message = "Error updating profile!";
      }
    });
  }
}
