# routewatch

Lightweight Express.js middleware for logging and auditing API route usage in development.

## Installation

```bash
npm install routewatch
```

## Usage

```javascript
const express = require('express');
const routewatch = require('routewatch');

const app = express();

// Add routewatch middleware before your routes
app.use(routewatch());

app.get('/api/users', (req, res) => {
  res.json({ users: [] });
});

app.listen(3000);
```

By default, routewatch logs each request method, path, status code, and response time to the console:

```
[routewatch] GET /api/users 200 12ms
[routewatch] POST /api/users 201 8ms
[routewatch] DELETE /api/users/42 404 3ms
```

### Options

```javascript
app.use(routewatch({
  logBody: true,       // Log request body (default: false)
  logHeaders: false,   // Log request headers (default: false)
  ignore: ['/health'], // Routes to skip (default: [])
}));
```

## Why routewatch?

- Zero dependencies
- Minimal performance overhead
- Designed for development and auditing workflows
- Easy to extend with custom loggers

## Contributing

Pull requests are welcome. Please open an issue first to discuss any major changes.

## License

[MIT](LICENSE)