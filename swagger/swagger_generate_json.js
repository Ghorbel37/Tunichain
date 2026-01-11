// const swaggerAutogen = require('swagger-autogen')();
import swaggerAutogen from 'swagger-autogen';
const doc = {
    info: {
        title: 'Tunichain API',
        version: '1.0.0',
        description: 'API documentation for Tunichain backend',
    },
    servers: [
        {
            url: 'http://localhost:4000',
            description: 'Express development server'
        },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'SIWE JWT token obtained from /api/auth/verify',
            },
        },
    },
    security: [
        {
            bearerAuth: [],
        },
    ]
};

const outputFile = './swagger-output.json';
const endpointsFiles = ['../index.js']; // or routes folder

swaggerAutogen({ openapi: '3.0.0' })(outputFile, endpointsFiles, doc).then(async () => {
    await import('../server.js'); // start your server after docs generation
});
