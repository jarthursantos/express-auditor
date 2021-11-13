import { Request, Response, NextFunction } from 'express';

import { Auditor, AuditorOptions, AuditSession } from './auditor'

declare global {
  namespace Express {
    interface Request {
      audit: AuditSession
    }
  }
}

export interface AuditorInstance {
  auditor: Auditor
  handler(request: Request, response: Response, next: NextFunction): void
}

export function createAuditor(options: AuditorOptions = {}): AuditorInstance {
  const auditor = new Auditor(options)

  return {
    auditor,
    handler: (request: Request, response: Response, next: NextFunction) => {
      const session = auditor.createAuditSession(request, response);
      
      request.audit = session;
      
      return next();
    }
  }
}

export * from './auditor'
export * from './plugins'