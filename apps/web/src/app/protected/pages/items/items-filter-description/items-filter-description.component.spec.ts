import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemsFilterDescriptionComponent } from './items-filter-description.component';

describe('ItemsFilterDescriptionComponent', () => {
  let component: ItemsFilterDescriptionComponent;
  let fixture: ComponentFixture<ItemsFilterDescriptionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ItemsFilterDescriptionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ItemsFilterDescriptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
