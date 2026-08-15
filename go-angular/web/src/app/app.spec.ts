import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { App } from './app';

describe('App', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('renders the health status from GET /api/health', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const req = httpMock.expectOne('/api/health');
    expect(req.request.method).toBe('GET');
    req.flush({ status: 'ok' });
    await fixture.whenStable();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[data-testid="health-status"]')?.textContent).toContain('ok');
  });

  it('renders an error message when the health request fails', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const req = httpMock.expectOne('/api/health');
    req.flush('boom', { status: 500, statusText: 'Internal Server Error' });
    await fixture.whenStable();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[data-testid="health-error"]')?.textContent).toContain('failed');
  });
});