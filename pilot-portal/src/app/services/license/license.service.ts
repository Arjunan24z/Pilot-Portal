import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../api/api.service';

export interface License {
  _id?: string;
  type: 'SPL' | 'PPL' | 'CPL' | 'AIPL';
  issueDate?: string;
  expiryDate?: string;
  licenseNumber?: string;
  documentUrl?: string;
  documentName?: string;
  remarks?: string;
}

@Injectable({ providedIn: 'root' })
export class LicenseService {

  constructor(private http: HttpClient, private api: ApiService) {}

  getAll(): Observable<License[]> {
    return this.http.get<License[]>(`${this.api.BASE_URL}/license`);
  }

  create(body: FormData) {
    return this.http.post<License>(`${this.api.BASE_URL}/license`, body);
  }
  
  update(id: string, body: FormData) {
    return this.http.put<License>(`${this.api.BASE_URL}/license/${id}`, body);
  }
  

  delete(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.api.BASE_URL}/license/${id}`);
  }
}
