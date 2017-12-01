# Kilos

Kilos is an express.js application (or middleware) that makes it easy to define a schema and mutations. It runs on Node.js, Postgres, and Redis (for pubsub). Each mutation recieves a sequence identifier so your clients can fast forward to the most recent changes.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

```
npm install
cp .env.example .env
vim .env
redis-server --port XXXX

# Migrate the database (use `npm install -g knex` to install knex)
knex migrate:latest

# @TODO You'll need to insert seed data into your postgres instance.

npm run dev
```

## Routes

### `POST /login`
Example Body:
```js
{
	"username": "ryan",
	"password": "password"
}
```

Example Response:
```js
{
    "jwt": "...some jwt..."
}
```

The JWT is also set to a cookie named `authorization`.

### `GET /`
Example Output:
```js
{
    "user": {
        "id": "a0469e91-39df-4cb8-9eaf-5852cf5ea12b",
        "username": "ryan",
        "firstName": "Ryan",
        "lastName": "Allred",
        "email": "ryan@domain.com"
    },
    "scopes": {
        "6c8d935f-47a4-4132-826b-0d12b4db5fd8": {
            "id": "6c8d935f-47a4-4132-826b-0d12b4db5fd8",
            "role": "ADMIN",
            "version": "0"
        }
    }
}
```

### `GET /(scopeId)/(version)` like `/6c8d935f-47a4-4132-826b-0d12b4db5fd8/0`

Example Response:
```js
{
    "version": "0",
    "patch": {
        "comments": {
        }
    }
}
```

### `POST /(scopeId)/(version)` like `/6c8d935f-47a4-4132-826b-0d12b4db5fd8/0`

Mutations are heavily inspired by redux, and can be batched in a single request.

Example Body:
```js
[{
	"type": "createComment",
	"payload": {
		"body": "Hello World"
	}
}]
```

Example Response:
```js
{
    "version": 1, // Note the version increments
    "results": [ // The results for each mutation
        {
            "id": "e2b331bf-8c4a-4af1-9e98-6b254b6e8e51",
            "body": "Hello World",
            "userId": "a0469e91-39df-4cb8-9eaf-5852cf5ea12b",
            "sequenceId": "e2c958be-e2e6-411f-924d-80603f9d87b4",
            "deleted": false
        }
    ],
    "patch": {
        "comments": {
            "e2b331bf-8c4a-4af1-9e98-6b254b6e8e51": {
                "body": "Hello World",
                "userId": "a0469e91-39df-4cb8-9eaf-5852cf5ea12b",
                "deleted": false,
                "id": "e2b331bf-8c4a-4af1-9e98-6b254b6e8e51",
                "sequenceId": "e2c958be-e2e6-411f-924d-80603f9d87b4"
            }
        }
    }
}
```

### `/stream`

This endpoint is an event stream to notify the user of changes in any of the scopes they belong to. This is meant to be followed up by another request to `GET /(scopeId)/(version)` to fast forward to the most recent version.

```js
new EventSource('/stream')
  .addEventListener('scope-update', x=>{
    const {scopeId, version} = JSON.parse(x.data)
    console.log(scopeId, version)
  })
```
