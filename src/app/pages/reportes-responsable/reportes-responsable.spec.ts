import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportesResponsable } from './reportes-responsable';

describe('ReportesResponsable', () => {
  let component: ReportesResponsable;
  let fixture: ComponentFixture<ReportesResponsable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportesResponsable],
    }).compileComponents();

    fixture = TestBed.createComponent(ReportesResponsable);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
