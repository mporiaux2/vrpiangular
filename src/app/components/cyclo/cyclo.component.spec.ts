import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CycloComponent } from './cyclo.component';

describe('CycloComponent', () => {
  let component: CycloComponent;
  let fixture: ComponentFixture<CycloComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CycloComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CycloComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
