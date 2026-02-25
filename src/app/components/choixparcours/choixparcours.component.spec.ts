import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChoixparcoursComponent } from './choixparcours.component';

describe('ChoixparcoursComponent', () => {
  let component: ChoixparcoursComponent;
  let fixture: ComponentFixture<ChoixparcoursComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChoixparcoursComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChoixparcoursComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
