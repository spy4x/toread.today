import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportBulkPageComponent } from './bulk.component';

describe('ImportBulkPageComponent', () => {
  let component: ImportBulkPageComponent;
  let fixture: ComponentFixture<ImportBulkPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ImportBulkPageComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ImportBulkPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
