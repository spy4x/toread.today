import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemsListLineLoaderComponent } from './items-list-line-loader.component';

describe('ItemsImportListComponent', () => {
  let component: ItemsListLineLoaderComponent;
  let fixture: ComponentFixture<ItemsListLineLoaderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ItemsListLineLoaderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ItemsListLineLoaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
