// const swaggerAutogen = require('swagger-autogen')();
import swaggerAutogen from 'swagger-autogen';
const doc = {
    info: {
        title: 'Tax Payment API',
        description: 'Auto-generated API docs',
    },
    host: 'localhost:4000',
    schemes: ['http'],
};

const outputFile = './swagger-output.json';
const endpointsFiles = ['../server.js']; // or routes folder

swaggerAutogen(outputFile, endpointsFiles).then(() => {
    require('../server.js'); // start your server after docs generation
});
