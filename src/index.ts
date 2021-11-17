import { Request, Response, NextFunction } from 'express';

import { Auditor, AuditorOptions, AuditSession } from './auditor'

import { getStackTrace } from './utils/stack-trace'

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
  errorHandler(error: Error, request: Request, response: Response, next: NextFunction): void
}

export function createAuditor(options: AuditorOptions = {}): AuditorInstance {
  const auditor = new Auditor(options)

  return {
    auditor,
    
    handler: (request, response, next) => {
      const session = auditor.createAuditSession(request, response);
      
      request.audit = session;
      
      return next();
    },

    errorHandler: (error, request, _response, next) => {
      try {
        request.audit.execution.setException({
          name: error.name,
          message: error.message,
          stack: getStackTrace(error)
        })
      } finally {
        next(error)
      }
    }
  }
}

export * from './auditor'
export * from './plugins'