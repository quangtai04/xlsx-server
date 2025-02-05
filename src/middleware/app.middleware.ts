import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class AppMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.log(
      `Path: "${req.path}"; Method: ${req.method} Time: ${new Date().toLocaleTimeString()}`,
    );
    next();
  }
}
