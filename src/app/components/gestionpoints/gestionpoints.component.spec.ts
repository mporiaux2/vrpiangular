import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionpointsComponent } from './gestionpoints.component';

describe('GestionpointsComponent', () => {
  let component: GestionpointsComponent;
  let fixture: ComponentFixture<GestionpointsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionpointsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionpointsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
