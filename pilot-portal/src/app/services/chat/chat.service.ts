import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiService } from '../api/api.service';

@Injectable({ providedIn: 'root' })
export class ChatService {
  constructor(private http: HttpClient, private api: ApiService) {}

  ask(message: string) {
    return this.http.post<any>(`${this.api.BASE_URL}/chat`, { message });
  }
}
