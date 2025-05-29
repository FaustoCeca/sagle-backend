import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

@Injectable()
export class IpTrackerMiddleware implements NestMiddleware {
  private ipLimit = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 1, // limit each IP to 1 request per windowMs
    message: 'You can only participate once per day.',
  });

  use(req: Request, res: Response, next: NextFunction) {
    this.ipLimit(req, res, next);
  }
}