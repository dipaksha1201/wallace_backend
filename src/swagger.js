import swaggerJsDoc from 'swagger-jsdoc';

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API Documentation',
            version: '1.0.0',
            description: 'Wallace Project API Documentation',
        },
        servers: [
            {
                url: 'http://localhost:5001', // Update if deploying to production
            },
        ],
    },
    apis: ['./server.js'], // Path to the file containing Swagger annotations
};

const swaggerSpecs = swaggerJsDoc(swaggerOptions);
export default swaggerSpecs;