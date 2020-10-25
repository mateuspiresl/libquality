import swaggerJSDoc from 'swagger-jsdoc';

export const swaggerSpec = swaggerJSDoc({
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'LibQuality API',
      version: '0.0.0',
    },
    servers: [{ url: '/api' }],
  },
  apis: ['./docs/swagger/*.yml'],
});

export const swaggerUiOptions = { explorer: true };
