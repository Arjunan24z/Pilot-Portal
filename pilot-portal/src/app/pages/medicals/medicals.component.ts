import { Component, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Medical, MedicalsService } from 'src/app/services/medicals/medicals.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';


@Component({
  selector: 'app-medicals',
  templateUrl: './medicals.component.html',
  styleUrls: ['./medicals.component.scss']
})
export class MedicalsComponent {
  
  classType!: 'Class 1' | 'Class 2';

  medical?: Medical;
  loading = true;
  showForm = false;
  message = '';
  selectedFile?: File;

  showPreview = false;
  safePdfUrl?: SafeResourceUrl;


  form: Partial<Medical> = {};

  constructor(private route:ActivatedRoute,private medicalService: MedicalsService,private sanitizer: DomSanitizer) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const type = params.get('classType');

      // 🔹 Map URL param → backend value
      this.classType =
        type === 'class1' ? 'Class 1' : 'Class 2';

      this.loadMedical();
    });
  }

  loadMedical() {
    this.loading = true;

    this.medicalService.getAll().subscribe({
      next: (res) => {
        this.medical = res.find(m => m.classType === this.classType);
        if (this.medical?.documentUrl) {
          this.safePdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
            `http://localhost:5000${this.medical.documentUrl}`
          );
        }
        this.loading = false;
      },
      error: () => {
        this.message = 'Error loading medical';
        this.loading = false;
      }
    });
  }

  get status() {
    if (!this.medical?.expiryDate) return 'Unknown';

    const diff =
      (new Date(this.medical.expiryDate).getTime() - Date.now()) /
      (1000 * 60 * 60 * 24);

    if (diff < 0) return 'Expired';
    if (diff < 30) return 'Expiring Soon';
    return 'Valid';
  }

  openRenew() {
    this.form = {
      issueDate: this.medical?.issueDate || '',
      expiryDate: this.medical?.expiryDate || '',
      examinerName: this.medical?.examinerName || '',
      examinerNumber: this.medical?.examinerNumber || '',
      examinationDate: this.medical?.examinationDate || '',
      restrictions: this.medical?.restrictions || '',
      limitations: this.medical?.limitations || '',
      remarks: this.medical?.remarks || ''
    };
    this.showForm = true;
  }

  onFileSelect(event: any) {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      this.selectedFile = file;
    } else {
      this.message = 'Only PDF files are allowed';
    }
  }
  
  

  save() {
    const formData = new FormData();
  
    formData.append('classType', this.classType);
    if (this.form.issueDate)
      formData.append('issueDate', this.form.issueDate);
    if (this.form.expiryDate)
      formData.append('expiryDate', this.form.expiryDate);
    if (this.form.examinerName)
      formData.append('examinerName', this.form.examinerName);
    if (this.form.examinerNumber)
      formData.append('examinerNumber', this.form.examinerNumber);
    if (this.form.examinationDate)
      formData.append('examinationDate', this.form.examinationDate);
    if (this.form.restrictions)
      formData.append('restrictions', this.form.restrictions);
    if (this.form.limitations)
      formData.append('limitations', this.form.limitations);
    if (this.form.remarks)
      formData.append('remarks', this.form.remarks);
  
    if (this.selectedFile) {
      formData.append('document', this.selectedFile);
    }
  
    const request = this.medical
      ? this.medicalService.updateMedical(this.medical._id, formData)
      : this.medicalService.createMedical(formData);
  
    request.subscribe({
      next: () => {
        this.message = 'Medical saved successfully';
        this.showForm = false;
        this.selectedFile = undefined;
        this.loadMedical();
      },
      error: (err) =>
        this.message = err.error?.message || 'Error saving medical'
    });
  }
  

}
