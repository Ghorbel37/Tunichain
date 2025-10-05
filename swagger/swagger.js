const swaggerAutogen = require('swagger-autogen')();

const doc = {
    info: {
        title: 'Tax Payment API',
        description: 'Auto-generated API docs',
    },
    host: 'localhost:4000',
    schemes: ['http'],
};

const outputFile = './swagger-output.json';
const endpointsFiles = ['../index.js']; // or routes folder

swaggerAutogen(outputFile, endpointsFiles).then(() => {
    require('../index.js'); // start your server after docs generation
});
