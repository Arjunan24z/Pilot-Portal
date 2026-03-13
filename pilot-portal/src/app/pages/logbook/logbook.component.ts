import { Component, OnDestroy, OnInit } from '@angular/core';
import { LogEntry, LogbookService } from 'src/app/services/logbook/logbook.service';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
Chart.register(...registerables);


@Component({
  selector: 'app-logbook',
  templateUrl: './logbook.component.html',
  styleUrls: ['./logbook.component.scss']
})
export class LogbookComponent implements OnInit {

  logbook: LogEntry[] = [];
  totalHours = 0;
  totalFlights = 0;
  lastFlightDate: string | null = null;
  showForm = false;
  chart!: Chart;
  flightTypeChart!: Chart;
  liveMode = true;
  refreshIntervalSeconds = 20;
  lastSyncedAt: Date | null = null;
  isRefreshing = false;
  private refreshTimer?: ReturnType<typeof setInterval>;

  aircraftSummary: {
    aircraft: string;
    flights: number;
    hours: number;
  }[] = [];
  

  entry: LogEntry = {
    date: '',
    aircraft: '',
    totalTime: 0,
    pilotInCommand: 0,
    secondInCommand: 0,
    nightTime: 0,
    crossCountry: 0,
    soloTime: 0,
    dualReceived: 0,
    dualGiven: 0,
    instrumentActual: 0,
    instrumentSimulated: 0,
    dayLandings: 0,
    nightLandings: 0,
    departureAirport: '',
    arrivalAirport: '',
    flightType: 'personal',
    instructorName: '',
    remarks: ''
  };

  editingId: string | null = null;
  message = '';

  constructor(private logbookService: LogbookService) {}

  ngOnInit() {
    this.loadLogbook();
    this.startLiveSync();
  }

  ngOnDestroy() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }

    if (this.chart) {
      this.chart.destroy();
    }

    if (this.flightTypeChart) {
      this.flightTypeChart.destroy();
    }
  }

  loadLogbook(silent = false) {
    this.isRefreshing = !silent;

    this.logbookService.getAll().subscribe({
      next: (res) => {
        this.logbook = res || [];
  
        this.totalFlights = this.logbook.length;
        this.totalHours = this.logbook.reduce(
          (sum, l) => sum + (Number(l.totalTime || l.hours) || 0),
          0
        );
  
        this.lastFlightDate = this.logbook.length
          ? this.logbook
              .map(l => l.date)
              .sort()
              .reverse()[0]
          : null;
  
        this.calculateAircraftSummary();
        this.renderMonthlyChart();
        this.renderFlightTypeChart();
        this.lastSyncedAt = new Date();
        this.isRefreshing = false;
      },
      error: () => {
        this.message = 'Error loading logbook!';
        this.isRefreshing = false;
      }
    });
  }

  startLiveSync() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }

    if (!this.liveMode) {
      return;
    }

    this.refreshTimer = setInterval(() => {
      this.loadLogbook(true);
    }, this.refreshIntervalSeconds * 1000);
  }

  toggleLiveMode() {
    this.liveMode = !this.liveMode;
    this.startLiveSync();
  }

  manualRefresh() {
    this.loadLogbook();
  }

  
  renderMonthlyChart() {
    if (this.chart) {
      this.chart.destroy();
    }

    const isDarkMode = document.documentElement.classList.contains('dark');
    const legendColor   = isDarkMode ? '#e2e8f0' : '#1e293b';
    const axisTickColor = isDarkMode ? '#94a3b8' : '#475569';
    const axisTitleColor = isDarkMode ? '#cbd5e1' : '#334155';
    const gridColor     = isDarkMode ? 'rgba(148,163,184,0.1)' : 'rgba(100,116,139,0.12)';
    const barColor      = isDarkMode ? 'rgba(56,189,248,0.72)'  : 'rgba(3,105,161,0.68)';
    const barHover      = isDarkMode ? 'rgba(56,189,248,1)'     : 'rgba(3,105,161,1)';

    const monthlyMap: { [key: string]: number } = {};

    this.logbook.forEach(log => {
      const date = new Date(log.date);
      const key  = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap[key] = (monthlyMap[key] || 0) + Number(log.totalTime || log.hours || 0);
    });

    const sortedKeys = Object.keys(monthlyMap).sort();

    const labels = sortedKeys.map(k => {
      const [y, m] = k.split('-');
      return new Date(+y, +m - 1).toLocaleString('default', { month: 'short', year: '2-digit' });
    });

    const data = sortedKeys.map(k => parseFloat(monthlyMap[k].toFixed(1)));

    this.chart = new Chart('monthlyHoursChart', {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Flight Hours',
          data,
          backgroundColor: barColor,
          hoverBackgroundColor: barHover,
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `  ${ctx.raw} hrs`
            }
          }
        },
        scales: {
          x: {
            ticks: { color: axisTickColor },
            grid: { display: false },
            title: {
              display: true,
              text: 'Month',
              color: axisTitleColor,
              font: { size: 11 }
            }
          },
          y: {
            ticks: {
              color: axisTickColor,
              callback: (v) => `${v}h`
            },
            grid: { color: gridColor },
            title: {
              display: true,
              text: 'Flight Hours',
              color: axisTitleColor,
              font: { size: 11 }
            },
            beginAtZero: true
          }
        }
      }
    });
  }

  renderFlightTypeChart() {
    if (this.flightTypeChart) {
      this.flightTypeChart.destroy();
    }

    const isDarkMode  = document.documentElement.classList.contains('dark');
    const legendColor = isDarkMode ? '#e2e8f0' : '#1e293b';
    const borderColor = isDarkMode ? '#0f172a' : '#ffffff';

    const counts: { [key: string]: number } = {};
    this.logbook.forEach(log => {
      const ft = this.normalizeFlightType(log.flightType as string);
      counts[ft] = (counts[ft] || 0) + 1;
    });

    const labels = Object.keys(counts);
    const data   = labels.map(l => counts[l]);
    const palette = ['#38bdf8', '#818cf8', '#34d399', '#fb923c', '#f472b6'];

    this.flightTypeChart = new Chart('flightTypeChart', {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: palette.slice(0, labels.length),
          borderWidth: 2,
          borderColor,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: legendColor,
              boxWidth: 12,
              padding: 10,
              font: { size: 11 }
            }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => `  ${ctx.label}: ${ctx.raw} flights`
            }
          }
        }
      }
    });
  }


  calculateAircraftSummary() {
    const map: any = {};
  
    this.logbook.forEach(entry => {
      const key = entry.aircraft?.trim() || 'Unknown';
  
      if (!map[key]) {
        map[key] = {
          aircraft: key,
          flights: 0,
          hours: 0
        };
      }
  
      map[key].flights += 1;
      // Use totalTime if available, fallback to legacy hours field
      map[key].hours += Number(entry.totalTime || entry.hours) || 0;
    });
  
    this.aircraftSummary = Object.values(map);
  }
  
  exportCSV() {
    if (!this.logbook.length) {
      this.message = 'No logbook data to export';
      return;
    }
  
    const headers = ['Date', 'Aircraft', 'Hours', 'Remarks'];
  
    const rows = this.logbook.map(l => [
      l.date,
      l.aircraft,
      l.hours,
      l.remarks || ''
    ]);
  
    const csvContent =
      [headers, ...rows]
        .map(e => e.map(v => `"${v}"`).join(','))
        .join('\n');
  
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
  
    const link = document.createElement('a');
    link.href = url;
    link.download = `pilot-logbook-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  
    URL.revokeObjectURL(url);
  }
  

  saveEntry() {
    // Sync legacy hours field with totalTime for backward compatibility
    const normalizedFlightType = this.normalizeFlightType(this.entry.flightType as string);

    const body: LogEntry = {
      ...this.entry,
      flightType: normalizedFlightType,
      hours: this.entry.totalTime
    };

    if (!this.editingId) {
      // CREATE
      this.logbookService.create(body).subscribe({
        next: () => {
          this.message = 'Entry added!';
          this.resetForm();
          this.loadLogbook();
        },
        error: () => this.message = 'Error adding entry!'
      });
    } else {
      // UPDATE
      this.logbookService.update(this.editingId, body).subscribe({
        next: () => {
          this.message = 'Entry updated!';
          this.resetForm();
          this.loadLogbook();
        },
        error: () => this.message = 'Error updating entry!'
      });
    }
  }

  edit(log: LogEntry) {
    this.entry = { ...log };
    this.entry.flightType = this.normalizeFlightType(log.flightType as string).toLowerCase() as any;
    this.editingId = log._id!;
  }

  delete(id: string) {
    this.logbookService.delete(id).subscribe({
      next: () => this.loadLogbook(),
      error: () => this.message = 'Error deleting entry!'
    });
  }

  resetForm() {
    this.entry = {
      date: '',
      aircraft: '',
      totalTime: 0,
      pilotInCommand: 0,
      secondInCommand: 0,
      nightTime: 0,
      crossCountry: 0,
      soloTime: 0,
      dualReceived: 0,
      dualGiven: 0,
      instrumentActual: 0,
      instrumentSimulated: 0,
      dayLandings: 0,
      nightLandings: 0,
      departureAirport: '',
      arrivalAirport: '',
      flightType: 'personal',
      instructorName: '',
      remarks: ''
    };
    this.editingId = null;
  }

  get averageHoursPerFlight(): number {
    if (!this.totalFlights) {
      return 0;
    }

    return Number((this.totalHours / this.totalFlights).toFixed(1));
  }

  get topAircraft(): string {
    if (!this.aircraftSummary.length) {
      return 'N/A';
    }

    const sorted = [...this.aircraftSummary].sort((a, b) => b.hours - a.hours);
    return sorted[0].aircraft;
  }

  private normalizeFlightType(type?: string): 'Training' | 'Solo' | 'Personal' | 'Commercial' | 'Other' {
    const normalized = (type || '').toLowerCase();

    if (normalized === 'training') return 'Training';
    if (normalized === 'solo') return 'Solo';
    if (normalized === 'commercial') return 'Commercial';
    if (normalized === 'checkride' || normalized === 'other') return 'Other';
    return 'Personal';
  }
}
