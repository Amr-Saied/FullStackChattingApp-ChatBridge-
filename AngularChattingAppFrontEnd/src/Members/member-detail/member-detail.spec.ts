import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MemberDetail } from './member-detail';

describe('MemberDetail', () => {
  let component: MemberDetail;
  let fixture: ComponentFixture<MemberDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MemberDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MemberDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
