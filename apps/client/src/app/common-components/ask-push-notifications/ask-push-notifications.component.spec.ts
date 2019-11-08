import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AskPushNotificationsComponent } from './ask-push-notifications.component';

describe('AskPushNotificationsComponent', () => {
  let component: AskPushNotificationsComponent;
  let fixture: ComponentFixture<AskPushNotificationsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AskPushNotificationsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AskPushNotificationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
