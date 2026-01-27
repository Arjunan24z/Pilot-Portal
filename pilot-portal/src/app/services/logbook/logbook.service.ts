import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../api/api.service';

export interface LogEntry {
  _id?: string;
  date: string; 
  aircraft: string;
  hours?: number; // Legacy field (synced with totalTime)
  
  // Route
  departureAirport?: string;
  arrivalAirport?: string;
  
  // Flight Time
  totalTime?: number;
  pilotInCommand?: number;
  secondInCommand?: number;
  nightTime?: number;
  crossCountry?: number;
  soloTime?: number;
  dualReceived?: number;
  dualGiven?: number;
  
  // Instrument Time
  instrumentActual?: number;
  instrumentSimulated?: number;
  
  // Landings
  dayLandings?: number;
  nightLandings?: number;
  
  // Metadata
  flightType?: 'training' | 'solo' | 'personal' | 'commercial' | 'checkride';
  instructorName?: string;
  remarks?: string;
}

@Injectable({ providedIn: 'root' })
export class LogbookService {

  constructor(private http: HttpClient, private api: ApiService) {}

  getAll(): Observable<LogEntry[]> {
    return this.http.get<LogEntry[]>(`${this.api.BASE_URL}/logbook`);
  }

  create(body: LogEntry): Observable<LogEntry> {
    return this.http.post<LogEntry>(`${this.api.BASE_URL}/logbook`, body);
  }

  update(id: string, body: LogEntry): Observable<LogEntry> {
    return this.http.put<LogEntry>(`${this.api.BASE_URL}/logbook/${id}`, body);
  }

  delete(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.api.BASE_URL}/logbook/${id}`);
  }
}
