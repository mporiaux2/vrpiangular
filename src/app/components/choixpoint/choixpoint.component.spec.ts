import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChoixpointComponent } from './choixpoint.component';

describe('ChoixpointComponent', () => {
  let component: ChoixpointComponent;
  let fixture: ComponentFixture<ChoixpointComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChoixpointComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChoixpointComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
