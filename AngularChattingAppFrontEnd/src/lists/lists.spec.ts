import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Lists } from './lists';

describe('Lists', () => {
  let component: Lists;
  let fixture: ComponentFixture<Lists>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Lists]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Lists);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
