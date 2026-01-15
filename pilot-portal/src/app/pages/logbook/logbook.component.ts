import { Component, OnInit } from '@angular/core';
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

  aircraftSummary: {
    aircraft: string;
    flights: number;
    hours: number;
  }[] = [];
  

  entry: LogEntry = {
    date: '',
    aircraft: '',
    hours: 0,
    remarks: ''
  };

  editingId: string | null = null;
  message = '';

  constructor(private logbookService: LogbookService) {}

  ngOnInit() {
    this.loadLogbook();
  }

  loadLogbook() {
    this.logbookService.getAll().subscribe({
      next: (res) => {
        this.logbook = res || [];
  
        this.totalFlights = this.logbook.length;
        this.totalHours = this.logbook.reduce(
          (sum, l) => sum + (Number(l.hours) || 0),
          0
        );
  
        this.lastFlightDate = this.logbook.length
          ? this.logbook
              .map(l => l.date)
              .sort()
              .reverse()[0]
          : null;
  
        this.calculateAircraftSummary();
        this.renderMonthlyChart(); // 🔹 ADD THIS
      },
      error: () => this.message = 'Error loading logbook!'
    });
  }

  
  renderMonthlyChart() {
    if (this.chart) {
      this.chart.destroy();
    }
  
    const monthlyMap: { [key: string]: number } = {};
  
    this.logbook.forEach(log => {
      const date = new Date(log.date);
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
  
      monthlyMap[key] = (monthlyMap[key] || 0) + Number(log.hours || 0);
    });
  
    const sortedKeys = Object.keys(monthlyMap).sort();
  
    const labels = sortedKeys.map(k => {
      const [y, m] = k.split('-');
      return new Date(+y, +m - 1).toLocaleString('default', {
        month: 'short',
        year: 'numeric'
      });
    });
  
    const data = sortedKeys.map(k => monthlyMap[k]);
  
    this.chart = new Chart('monthlyHoursChart', {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Monthly Flight Hours',
            data,
            borderColor: '#38bdf8',
            backgroundColor: 'rgba(56, 189, 248, 0.2)',
            tension: 0.35,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false, // 🔹 allows compact height
        plugins: {
          legend: {
            labels: {
              color: '#e5e7eb'
            }
          }
        },
        scales: {
          x: {
            ticks: { color: '#9ca3af' },
            grid: { display: false }
          },
          y: {
            ticks: { color: '#9ca3af' },
            grid: { color: '#1f2937' }
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
      map[key].hours += Number(entry.hours) || 0;
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
    const body: LogEntry = {
      date: this.entry.date,
      aircraft: this.entry.aircraft,
      hours: this.entry.hours,
      remarks: this.entry.remarks
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
    this.editingId = log._id!;
  }

  delete(id: string) {
    this.logbookService.delete(id).subscribe({
      next: () => this.loadLogbook(),
      error: () => this.message = 'Error deleting entry!'
    });
  }

  resetForm() {
    this.entry = { date: '', aircraft: '', hours: 0, remarks: '' };
    this.editingId = null;
  }
}
