import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TdbComponent } from './tdb.component';

describe('TdbComponent', () => {
  let component: TdbComponent;
  let fixture: ComponentFixture<TdbComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TdbComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TdbComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
