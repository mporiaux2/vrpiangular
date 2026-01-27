import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReelComponent } from './reel.component';

describe('ReelComponent', () => {
  let component: ReelComponent;
  let fixture: ComponentFixture<ReelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReelComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
