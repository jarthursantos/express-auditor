import { Request, Response } from 'express';
import onFinished from 'on-finished';
import { EventEmitter } from 'events'

import { ExternalPlugin } from './plugins';
import metadata, { MetadataPlugin, MetadataStore } from './plugins/metadata'
import execution, { ExecutionPlugin, ExecutionStore } from './plugins/execution'

import onBody from './utils/body-detector';

export interface ObjectRequestFilterOptions {
  methods: string[]
}

export interface FuncionalRequestFilterOptions {
  (request: Request): boolean
}

export type RequestFilterOptions = ObjectRequestFilterOptions | FuncionalRequestFilterOptions

export interface ObjectResponseFilterOptions {
  methods: string[]
}

export interface FuncionalResponseFilterOptions {
  (response: Response): boolean
}

export type ResponseFilterOptions = ObjectResponseFilterOptions | FuncionalResponseFilterOptions

export interface FilterOptions {
  request: RequestFilterOptions
  response: ResponseFilterOptions
}

export interface AuditorOptions {
  filter?: FilterOptions
  plugins?: ExternalPlugin<any, any>[]
}

export interface AuditSession {
  metadata: MetadataPlugin
  execution: ExecutionPlugin
  [key: string]: any

  getStore(): AuditStore
}

export interface AuditStore {
  metadata: MetadataStore
  execution: ExecutionStore
  [key: string]: any
}

export class Auditor {
  private emitter = new EventEmitter()
  
  constructor(private options: AuditorOptions) {}

  isRequestToFilter(request: Request) {
    if (!this.options.filter) return true

    if (typeof this.options.filter.request === 'function') {
      return this.options.filter.request(request)
    }

    const method = request.method.toUpperCase();

    const methodIsAllowed = this.options.filter.request.methods.some(
      allowedMethod => allowedMethod.toUpperCase() === method
    )

    return methodIsAllowed
  }

  isResponseToFilter(response: Response) {
    if (!this.options.filter) return true

    if (typeof this.options.filter.response === 'function') {
      return this.options.filter.response(response)
    }

    const type = response.getHeader('Content-Type')

    const typeIsAllowed = this.options.filter.response.methods.some(
      allowedType => allowedType === type
    )

    return typeIsAllowed
  }

  createAuditSession(request: Request, response: Response): AuditSession {
    const metadataInstance = metadata.create(request, response);
    const executionInstance = execution.create(request, response);

    const store: AuditStore = {
      metadata: metadataInstance.store,
      execution: executionInstance.store,
    }

    const session: AuditSession = {
      metadata: metadataInstance.plugin,
      execution: executionInstance.plugin,

      getStore: () => store
    }

    const externalInstances = this.options.plugins?.map(plugin => {
      const pluginInstance = plugin.create(request, response)

      store[plugin.name] = pluginInstance.store
      session[plugin.name] = pluginInstance.plugin

      return pluginInstance
    })

    
    if (this.isRequestToFilter(request)) {
      onBody(response, (body) => session.execution.setResponseBody(body));
      onFinished(response, () => {
        metadataInstance.finish(store)
        executionInstance.finish(store)

        externalInstances?.forEach(instance => instance.finish(store))

        if (this.isResponseToFilter(response)) {
          this.emitter.emit('finish', store)
        }
      });
    }

    return session
  }
  
  on(_event: 'finish', cb: (store: AuditStore) => void) {
    this.emitter.on('finish', cb)
  }

  off(_event: 'finish', cb: (store: AuditStore) => void) {
    this.emitter.off('finish', cb)
  }
}
