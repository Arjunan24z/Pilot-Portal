import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MedicalsComponent } from './medicals.component';

describe('MedicalsComponent', () => {
  let component: MedicalsComponent;
  let fixture: ComponentFixture<MedicalsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MedicalsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MedicalsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
