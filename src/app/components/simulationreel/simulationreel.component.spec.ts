import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SimulationreelComponent } from './simulationreel.component';

describe('SimulationreelComponent', () => {
  let component: SimulationreelComponent;
  let fixture: ComponentFixture<SimulationreelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SimulationreelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SimulationreelComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
