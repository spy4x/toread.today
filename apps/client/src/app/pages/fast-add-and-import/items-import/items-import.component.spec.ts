import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemsImportComponent } from './items-import.component';

describe('ItemsImportListComponent', () => {
  let component: ItemsImportComponent;
  let fixture: ComponentFixture<ItemsImportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ItemsImportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ItemsImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
