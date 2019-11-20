import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RoadmapBricksListComponent } from './roadmap-bricks-list.component';

describe('RoadmapBricksListComponent', () => {
  let component: RoadmapBricksListComponent;
  let fixture: ComponentFixture<RoadmapBricksListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RoadmapBricksListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RoadmapBricksListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
