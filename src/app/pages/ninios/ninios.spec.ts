import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NiniosComponent } from './ninios';

describe('NiniosComponent', () => {
  let component: NiniosComponent;
  let fixture: ComponentFixture<NiniosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NiniosComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NiniosComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});