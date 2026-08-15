import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HealthService } from './services/health.service';

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  private readonly healthService = inject(HealthService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly health = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);

  ngOnInit() {
    this.healthService
      .getHealth()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => this.health.set(res.status),
        error: () => this.error.set('Health check failed: unable to reach the backend.'),
      });
  }
}