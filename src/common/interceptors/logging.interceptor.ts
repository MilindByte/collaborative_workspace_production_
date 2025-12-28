import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, ip } = request;
    const userAgent = request.get('user-agent') || '';
    const now = Date.now();

    this.metricsService.incrementRequests();

    return next.handle().pipe(
      tap({
        next: (data) => {
          const response = context.switchToHttp().getResponse();
          const { statusCode } = response;
          const delay = Date.now() - now;
          this.metricsService.recordProcessingTime(delay);
          this.logger.log(
            `${method} ${url} ${statusCode} ${delay}ms - ${ip} ${userAgent}`,
          );
        },
        error: (error) => {
          const delay = Date.now() - now;
          this.metricsService.incrementErrors();
          this.metricsService.recordProcessingTime(delay);
          this.logger.error(
            `${method} ${url} ${error.status || 500} ${delay}ms - ${ip} ${userAgent} - Error: ${error.message}`,
          );
        },
      }),
    );
  }
}
