module.exports = {
  info: {
    title: 'explorer',
    version: '2.0.1',
    description: 'A sample API',
  },
  host: `localhost:${process.env.PORT || 3000}`,
  apis: ['routes/*.ts', 'swagger/*.ts'],
  basePath: '/api',
}

