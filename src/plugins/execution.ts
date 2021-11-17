
import { OutgoingHttpHeaders } from 'http'
import { Request } from 'express';
import { Plugin } from './index'
import { StackTrace } from '../utils/stack-trace';

export interface ExecutionPlugin {
  setResponseBody(body: string): void
  setException(exception: Omit<ExceptionData, 'launchedAt'>): void
}

export interface ExceptionData {
  name: string
  message: string
  stack: StackTrace[]
  launchedAt: Date
}

export interface ExecutionStore {
  startAt: number
  finishedAt?: number

  request: Pick<Request, 'body' | 'method' | 'url' | 'protocol' | 'params' | 'query' | 'headers' | 'ip'>
  response: {
    body?: string
    headers?: OutgoingHttpHeaders
    statusCode?: number
    statusMessage?: string
  }
  exception?: ExceptionData
}

const plugin: Plugin<ExecutionPlugin, ExecutionStore> = {
  create(request, response) {
    const { body, method, url, params, query, headers, protocol, ip } = request;

    const store: ExecutionStore = {
      startAt: Date.now(),

      request: {
        body,
        method,
        url,
        params,
        query,
        headers,
        protocol,
        ip,
      },

      response: {}
    }

    return {
      store,
      
      plugin: {
        setResponseBody(body) {
          store.response.body = body
        },

        setException(stack) {
          store.exception = {
            ...stack,
            launchedAt: new Date()
          }
        }
      },

      finish() {
        this.store.response.headers = response.getHeaders()
        this.store.response.statusCode = response.statusCode
        this.store.response.statusMessage = response.statusMessage

        this.store.finishedAt = Date.now()
      },
    }
  }
}

export default plugin