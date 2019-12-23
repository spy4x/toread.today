import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BookmarkletPageComponent } from './bookmarklet.component';

describe('NotificationsComponent', () => {
  let component: BookmarkletPageComponent;
  let fixture: ComponentFixture<BookmarkletPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BookmarkletPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BookmarkletPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
