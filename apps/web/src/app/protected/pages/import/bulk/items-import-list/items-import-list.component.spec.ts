import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportBulkListComponent } from './items-import-list.component';

describe('ItemsImportListComponent', () => {
  let component: ImportBulkListComponent;
  let fixture: ComponentFixture<ImportBulkListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ImportBulkListComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ImportBulkListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
