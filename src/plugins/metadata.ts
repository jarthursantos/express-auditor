import { Plugin } from './index'

export interface MetadataPlugin {
  setUser(user: string): MetadataPlugin
  setType(type: string): MetadataPlugin
  setDescription(description: string): MetadataPlugin
  addObject(obj: string): MetadataPlugin
  addDetail(detail: string): MetadataPlugin
  addChange(change: Change<any>): MetadataPlugin
}

export interface MetadataStore {
  executedAt: Date
  user?: string
  type?: string
  description?: string
  objects: string[]
  details: string[]
  changes: Change<any>[]
}

export interface Change<T> {
  property: string
  from: T
  to: T
}

const plugin: Plugin<MetadataPlugin, MetadataStore> = {
  create(_request) {
    const store: MetadataStore = {
      executedAt: new Date(),
      objects: [],
      details: [],
      changes: []
    }

    return {
      store,
      
      plugin: {
        setUser(user) {
          store.user = user

          return this
        },
        
        setType(type) {
          store.type = type

          return this
        },
        
        setDescription(description) {
          store.description = description

          return this
        },
        
        addObject(obj: string) {
          store.objects.push(obj)

          return this
        },

        addDetail(detail: string) {
          store.details.push(detail)

          return this
        },

        addChange(change: Change<any>) {
          store.changes.push(change)

          return this
        },
      },

      finish() {}
    }
  }
}

export default plugin