import { Request, Response } from 'express'

import { AuditStore } from '../auditor'

export interface Plugin<T, Store> {
  create(request: Request, response: Response): PluginInstance<T, Store>
}

export interface PluginInstance<T, Store> { 
  plugin: T
  store: Store
  
  finish(store: AuditStore): void
}

export interface ExternalPlugin<T, Store> extends Plugin<T, Store> {
  name: string
}