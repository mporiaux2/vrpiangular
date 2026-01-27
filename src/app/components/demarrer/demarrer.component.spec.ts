import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DemarrerComponent } from './demarrer.component';

describe('DemarrerComponent', () => {
  let component: DemarrerComponent;
  let fixture: ComponentFixture<DemarrerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DemarrerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DemarrerComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
