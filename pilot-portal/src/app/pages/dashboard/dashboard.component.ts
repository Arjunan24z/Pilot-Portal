import { Component, OnInit } from '@angular/core';
import { LicenseService } from 'src/app/services/license/license.service';
import { LogbookService } from 'src/app/services/logbook/logbook.service';
import { MedicalsService } from 'src/app/services/medicals/medicals.service';
import { UserService } from 'src/app/services/user/user.service';
import { CurrencyService } from 'src/app/services/currency/currency.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  profileSummary: any = {};

  medicalStatus: any[] = [];
  licenseAlerts: any[] = [];
  logbookSummary: any[] = [];

  // Currency Status
  currencyStatus: any = null;
  hoursBreakdown: any = null;

  // 🔹 Derived dashboard metrics
  flightReady = false;
  totalHours = 0;
  totalFlights = 0;
  lastFlightDate: Date | null = null;

  loading = true;

  constructor(
    private userService: UserService,
    private medicalService: MedicalsService,
    private logbookService: LogbookService,
    private licenseService: LicenseService,
    private currencyService: CurrencyService
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard() {
    this.loading = true;

    // 1️⃣ Profile
    this.userService.getProfile().subscribe({
      next: (res) => (this.profileSummary = res || {}),
      error: (err) => console.error(err)
    });

    // 2️⃣ Medicals
    this.medicalService.getAll().subscribe({
      next: (res: any) => {
        const medData = Array.isArray(res) ? res : (res.medicals || []);
        this.medicalStatus = this.formatMedicalStatus(medData);
        this.evaluateFlightReadiness();
      }
    });

    // 3️⃣ Logbook
    this.logbookService.getAll().subscribe({
      next: (res: any) => {
        const logData = Array.isArray(res)
          ? res
          : (res.entries || res.logbook || []);

        this.logbookSummary = logData.slice(-5).reverse();
        this.calculateLogbookStats(logData);
      }
    });

    // 4️⃣ Licenses
    this.licenseService.getAll().subscribe({
      next: (res: any) => {
        const licData = Array.isArray(res) ? res : (res.licenses || []);
        this.licenseAlerts = this.formatLicenses(licData);
        this.evaluateFlightReadiness();
      }
    });

    // 5️⃣ Currency Status (NEW!)
    this.currencyService.getCurrencyStatus().subscribe({
      next: (res: any) => {
        this.currencyStatus = res;
        this.flightReady = res.isFlightReady || false;
      },
      error: (err) => console.error('Currency error:', err)
    });

    // 6️⃣ Flight Hours Breakdown (NEW!)
    this.currencyService.getFlightHoursBreakdown().subscribe({
      next: (res: any) => {
        this.hoursBreakdown = res;
        this.totalHours = res.totalTime || 0;
        this.totalFlights = res.totalFlights || 0;
      },
      error: (err) => console.error('Hours breakdown error:', err)
    });

    this.loading = false;
  }

  /* ===========================
     🧠 BUSINESS LOGIC
     =========================== */

  private calculateLogbookStats(logs: any[]) {
    this.totalFlights = logs.length;

    this.totalHours = logs.reduce(
      (sum, log) => sum + Number(log.hours || 0),
      0
    );

    if (logs.length) {
      const latest = logs
        .map(l => new Date(l.date))
        .sort((a, b) => b.getTime() - a.getTime())[0];

      this.lastFlightDate = latest;
    }
  }

  private evaluateFlightReadiness() {
    const hasInvalidMedical = this.medicalStatus.some(
      m => m.status !== 'Valid'
    );

    const hasInvalidLicense = this.licenseAlerts.some(
      l => l.status !== 'Valid'
    );

    this.flightReady = !hasInvalidMedical && !hasInvalidLicense;
  }

  /* ===========================
     🧾 HELPERS
     =========================== */

  formatMedicalStatus(medicals: any[]) {
    return medicals.map(m => ({
      ...m,
      classLabel: m.classType || m.type || 'Unknown Class',
      status: this.calculateStatus(m.expiryDate)
    }));
  }

  formatLicenses(licenses: any[]) {
    return licenses.map(l => ({
      ...l,
      license: l.type,
      status: this.calculateStatus(l.expiryDate)
    }));
  }

  calculateStatus(date: string) {
    const today = new Date();
    const expiry = new Date(date);
    const diff =
      (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

    if (diff < 0) return 'Expired';
    if (diff < 30) return 'Expiring Soon';
    return 'Valid';
  }
}
