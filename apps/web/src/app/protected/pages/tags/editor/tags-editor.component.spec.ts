import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TagsEditorComponent } from './tags-editor.component';

describe('TagsEditorComponent', () => {
  let component: TagsEditorComponent;
  let fixture: ComponentFixture<TagsEditorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TagsEditorComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TagsEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
