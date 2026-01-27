import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { License, LicenseService, Endorsement } from 'src/app/services/license/license.service';

@Component({
  selector: 'app-license',
  templateUrl: './license.component.html',
  styleUrls: ['./license.component.scss']
})
export class LicenseComponent {

  licenseType!: 'SPL' | 'PPL' | 'CPL' | 'AIPL';

  license?: License;
  loading = true;
  showForm = false;
  showPreview = false;
  showEndorsementForm = false;
  showRatingForm = false;
  message = '';

  selectedFile?: File;
  safePdfUrl?: SafeResourceUrl;

  form: Partial<License> = {};
  endorsementForm: Partial<Endorsement> = {};
  newRating = '';

  availableRatings = [
    'Instrument Rating',
    'Multi-Engine Rating',
    'Seaplane Rating',
    'Glider Rating',
    'Helicopter Rating',
    'Type Rating'
  ];

  availableEndorsements = [
    'High Performance Aircraft',
    'Complex Aircraft',
    'Tailwheel Aircraft',
    'High Altitude',
    'Pressurized Aircraft',
    'Float Plane',
    'Banner Towing'
  ];

  constructor(
    private route: ActivatedRoute,
    private licenseService: LicenseService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const type = params.get('type');

      // map route → backend enum
      this.licenseType = type?.toUpperCase() as any;

      this.loadLicense();
    });
  }

  loadLicense() {
    this.loading = true;

    this.licenseService.getAll().subscribe({
      next: (res) => {
        this.license = res.find(l => l.type === this.licenseType);
        this.loading = false;

        if (this.license?.documentUrl) {
          this.safePdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
            this.license.documentUrl
          );
        }
      },
      error: () => {
        this.message = 'Error loading license';
        this.loading = false;
      }
    });
  }

  get status() {
    if (!this.license?.expiryDate) return 'Unknown';

    const diff =
      (new Date(this.license.expiryDate).getTime() - Date.now()) /
      (1000 * 60 * 60 * 24);

    if (diff < 0) return 'Expired';
    if (diff < 30) return 'Expiring Soon';
    return 'Valid';
  }

  openForm() {
    this.form = {
      licenseNumber: this.license?.licenseNumber || '',
      issueDate: this.license?.issueDate || '',
      expiryDate: this.license?.expiryDate || '',
      remarks: this.license?.remarks || ''
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
  
    formData.append('type', this.licenseType);
    formData.append('licenseNumber', this.form.licenseNumber || '');
    formData.append('issueDate', this.form.issueDate || '');
    formData.append('expiryDate', this.form.expiryDate || '');
    formData.append('remarks', this.form.remarks || '');
  
    if (this.selectedFile) {
      formData.append('document', this.selectedFile);
    }
  
    const request = this.license
      ? this.licenseService.update(this.license._id!, formData as any)
      : this.licenseService.create(formData as any);
  
    request.subscribe({
      next: () => {
        this.message = 'License saved successfully';
        this.showForm = false;
        this.loadLicense();
      },
      error: (err) => {
        this.message = err.error?.message || 'Error saving license';
      }
    });
  }

  openEndorsementForm() {
    this.endorsementForm = {
      endorsementType: '',
      instructorName: '',
      instructorCertificate: '',
      date: new Date().toISOString().split('T')[0],
      aircraftType: '',
      remarks: ''
    };
    this.showEndorsementForm = true;
  }

  saveEndorsement() {
    if (!this.license?._id || !this.endorsementForm.endorsementType) {
      this.message = 'Please fill in required fields';
      return;
    }

    this.licenseService.addEndorsement(this.license._id, this.endorsementForm).subscribe({
      next: (updatedLicense) => {
        this.license = updatedLicense;
        this.showEndorsementForm = false;
        this.message = 'Endorsement added successfully';
        this.loadLicense();
      },
      error: (err) => {
        this.message = err.error?.message || 'Error adding endorsement';
      }
    });
  }

  openRatingForm() {
    this.newRating = '';
    this.showRatingForm = true;
  }

  saveRating() {
    if (!this.license?._id || !this.newRating) {
      this.message = 'Please select a rating';
      return;
    }

    this.licenseService.addRating(this.license._id, this.newRating).subscribe({
      next: (updatedLicense) => {
        this.license = updatedLicense;
        this.showRatingForm = false;
        this.message = 'Rating added successfully';
        this.loadLicense();
      },
      error: (err) => {
        this.message = err.error?.message || 'Error adding rating';
      }
    });
  }

  removeEndorsement(endorsementId: string) {
    if (!this.license?._id || !confirm('Remove this endorsement?')) return;

    this.licenseService.removeEndorsement(this.license._id, endorsementId).subscribe({
      next: () => {
        this.message = 'Endorsement removed';
        this.loadLicense();
      },
      error: (err) => {
        this.message = err.error?.message || 'Error removing endorsement';
      }
    });
  }
  
}
