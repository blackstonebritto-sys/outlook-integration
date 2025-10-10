import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RichEditorComponent } from './rich-text-editor.component';

describe('RichTextEditorComponent', () => {
  let component: RichEditorComponent;
  let fixture: ComponentFixture<RichEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RichEditorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RichEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
