import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemsImportListComponent } from './items-import-list.component';

describe('ItemsImportListComponent', () => {
  let component: ItemsImportListComponent;
  let fixture: ComponentFixture<ItemsImportListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ItemsImportListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ItemsImportListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
