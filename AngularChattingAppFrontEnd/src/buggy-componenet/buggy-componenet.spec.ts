import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuggyComponenet } from './buggy-componenet';

describe('BuggyComponenet', () => {
  let component: BuggyComponenet;
  let fixture: ComponentFixture<BuggyComponenet>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BuggyComponenet]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BuggyComponenet);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
