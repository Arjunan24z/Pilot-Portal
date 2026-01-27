import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CurrencyService {
  private apiUrl = `${environment.apiUrl}/currency`;

  constructor(private http: HttpClient) {}

  getCurrencyStatus(): Observable<any> {
    return this.http.get(`${this.apiUrl}/status`);
  }

  getFlightHoursBreakdown(): Observable<any> {
    return this.http.get(`${this.apiUrl}/hours`);
  }

  getPassengerCurrency(): Observable<any> {
    return this.http.get(`${this.apiUrl}/passenger`);
  }

  getNightCurrency(): Observable<any> {
    return this.http.get(`${this.apiUrl}/night`);
  }

  getInstrumentCurrency(): Observable<any> {
    return this.http.get(`${this.apiUrl}/instrument`);
  }

  getFlightReview(): Observable<any> {
    return this.http.get(`${this.apiUrl}/flight-review`);
  }
}
