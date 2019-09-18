import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FastAddAndImportComponent } from './fast-add-and-import.component';

describe('NotificationsComponent', () => {
  let component: FastAddAndImportComponent;
  let fixture: ComponentFixture<FastAddAndImportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FastAddAndImportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FastAddAndImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
