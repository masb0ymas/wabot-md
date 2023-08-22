# Wabot Multi Device

## Installation

install using npm

```sh
npm install wabot-md
```

install using yarn

```sh
yarn add wabot-md
```

install using pnpm

```sh
pnpm add wabot-md
```

## Using library

Using ES6

```ts
import * as whatsapp from 'wabot-md'
```

Using CommonJS

```ts
const whatsapp = required('wabot-md')
```

## Example Using

```ts
import * as whatsapp from 'wabot-md'

const session = await whatsapp.startSession('instance123')

await whatsapp.sendTextMessage({
  sessionId: "xxxxxx", // session ID
  to: "6281234567890", // always add country code (ex: 62)
  text: "Hi There, This is Message from Server!", // message you want to send
})
```