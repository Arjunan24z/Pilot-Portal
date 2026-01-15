import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiService } from '../api/api.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private http: HttpClient, private api: ApiService) {}

  getProfile() {
    return this.http.get(`${this.api.BASE_URL}/profile`);
  }

  updateProfile(body: any) {
    return this.http.put(`${this.api.BASE_URL}/profile`, body);
  }
}
