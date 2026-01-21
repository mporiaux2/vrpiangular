import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionparcoursComponent } from './gestionparcours.component';

describe('GestionparcoursComponent', () => {
  let component: GestionparcoursComponent;
  let fixture: ComponentFixture<GestionparcoursComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionparcoursComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionparcoursComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
