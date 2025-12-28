import { Injectable } from '@nestjs/common';

@Injectable()
export class MetricsService {
  private requestCounter = 0;
  private errorCounter = 0;
  private totalProcessingTime = 0;

  incrementRequests() {
    this.requestCounter++;
  }

  incrementErrors() {
    this.errorCounter++;
  }

  recordProcessingTime(ms: number) {
    this.totalProcessingTime += ms;
  }

  getMetrics() {
    return {
      totalRequests: this.requestCounter,
      totalErrors: this.errorCounter,
      averageProcessingTimeMs:
        this.requestCounter > 0
          ? Math.round(this.totalProcessingTime / this.requestCounter)
          : 0,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
    };
  }
}
