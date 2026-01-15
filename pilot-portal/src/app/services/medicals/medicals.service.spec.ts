import { TestBed } from '@angular/core/testing';

import { MedicalsService } from './medicals.service';

describe('MedicalsService', () => {
  let service: MedicalsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MedicalsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
