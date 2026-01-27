
// src/app/services/medicals/medicals.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../api/api.service';

// Define and export here since you don't have a separate model file
export interface Medical {
  _id: string;
  userId?: string;
  classType: 'Class 1' | 'Class 2' | 'Class 3';
  issueDate?: string;
  expiryDate?: string;
  remarks?: string;
  documentUrl?: string;
  documentName?: string;
  examinerName?: string;
  examinerNumber?: string;
  examinationDate?: string;
  restrictions?: string;
  limitations?: string;
  reminderDays?: number;
  previousMedicals?: PreviousMedical[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PreviousMedical {
  classType: string;
  issueDate: string;
  expiryDate: string;
  examinerName?: string;
}

@Injectable({ providedIn: 'root' })
export class MedicalsService {

  constructor(private http: HttpClient, private api: ApiService) {}

  getAll(): Observable<Medical[]> {
    return this.http.get<Medical[]>(`${this.api.BASE_URL}/medicals`);
  }

  createMedical(body: FormData) {
    return this.http.post<Medical>(
      `${this.api.BASE_URL}/medicals`,
      body
    );
  }

  updateMedical(id: string, body: FormData) {
    return this.http.put<Medical>(
      `${this.api.BASE_URL}/medicals/${id}`,
      body
    );
  }

  deleteMedical(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.api.BASE_URL}/medicals/${id}`);
  }
}
