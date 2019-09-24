import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BricksListComponent } from './bricks-list.component';

describe('BricksListComponent', () => {
  let component: BricksListComponent;
  let fixture: ComponentFixture<BricksListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BricksListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BricksListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
