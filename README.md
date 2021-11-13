# express-auditor
Audit express request and responses

## Installation

Install package in your [NodeJS](https://nodejs.org/) project

```bash
$ yarn add express-auditor
```

 or
 
```bash
$ npm i express-auditor
```

## Getting started

Creating a auditor instance

```ts
import express from 'express'
import { createAuditor } from 'express-auditor'

const app = express()

// create auditor and middleware instance
const { auditor, handler } = createAuditor(/* options */)

// the handler object return is the express middleware
app.use(handler)

app.listen(3000, () => console.log('app is running'))
```

### Using `audit` in routes

The `audit` property is injected in all `Request` object

```ts
app.use('/', (request: Request, response: Response) => {
  request.audit

  /* do something */
})
```

By default two plugins are available

- `request.audit.execution`: this plugin is independent, he collect request, response, start time and and time data from each HTTP call
- `request.audit.metadata`: this plugin provide methods to make audit more rich
  - `setUser(username)`: specify why user are execution request
  - `setType(type)`: request action type, like `'CREATE_NEW_USER'` to post filters
  - `setDescription(description)`: Action description to post consume
  - `addObject(object)`: string array, used to specify why objects the request is manipulating
  - `addDetail(detail)`: string array, to provide details about actions, like `'Default permissions applied to new user'`
  - `addChange({ property, from, to })`: object array, to register all changes from registered type in the object list

Call this methods are optional, but add rich data to post consume

### Listening audited data

With `auditor` instance you can listen when response has sended to client

```ts
// Use this callback to save or show audited request
auditor.on('finish', (store) => {
  console.log(store)
  /*
    this go print in your terminal:
    {
      metadata: {
        executedAt: Date,
        objects: Array,
        details: Array,
        changes: Array
      },
      execution: {
        startAt: number,
        finishedAt: number,

        request: {
          body: object,
          method: string,
          url: string,
          params: object,
          query: object[],
          headers: object[],
          protocol: string,
          ip: string
        },

        response: {
          body: string,
          headers: object,
          statusCode: number,
          statusMessage: string
        }
      }
    }
  */
})
```

## Options

In `createAuditor` you can pass the following options

### Filter

Pass `filter` option to filter which requests/responses can be audited, if filter return false, audition is stopped and `finish` callback are not called

```ts
{
  filter: {
    request: {
      // HTTP verbs
      methods: ['GET', 'POST', 'PUT', 'DELETE']
    },

    response: {
      // 'Content-Type' header value
      contentType: ['application/json']
    }
  },
}

// OR

{
  filter: {
    request: (request: Request) => {
      /* ...some verification */
      
      return true
    },
    
    response: (response: Response) => {
      /* ...some verification */
      
      return true
    }
  }
}
```

### Plugins

Pass `plugins` option you can add external/custom features do audition

```ts
{
  // Array with external/custom plugins
  plugins: [/* some plugins */],
}
```

Custom plugin example:

```ts
{
  plugins: [
    {
      // property name to be create in `request.audit` object
      name: 'name',

      create(req, res) {
        const store = {};

        return {
          // plugin state
          store,

          // injected actions in `request.audit.{name}` object
          plugin: {
            foobar() {
              // your can perform changes in state using plugin actions
              store.name = 'foobar'

              console.log('foobar')
            }
          },

          finish(store) {
            // store: root state of the audition

            // you can call actions using `this.plugin.foobar`
          }
        }
      }
    }
  ]
}

// now in all express route you can call `foobar()`

app.get('/', (request, response) => {
  request.audit.name.foobar() // 'foobar'

  response.send('o/')
})

```
