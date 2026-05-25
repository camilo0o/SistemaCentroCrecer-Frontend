import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Ninios } from './ninios';

describe('Ninios', () => {
  let component: Ninios;
  let fixture: ComponentFixture<Ninios>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Ninios],
    }).compileComponents();

    fixture = TestBed.createComponent(Ninios);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
