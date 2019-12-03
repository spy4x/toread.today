import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportBulkComponent } from './items-import.component';

describe('ItemsImportListComponent', () => {
  let component: ImportBulkComponent;
  let fixture: ComponentFixture<ImportBulkComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ImportBulkComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ImportBulkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
