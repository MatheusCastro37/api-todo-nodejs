import Fastify from 'fastify';
const fastify = Fastify({
    logger: true
})

const port = 3333;

// Declare a route
fastify.get('/', async function handler(request, reply) {
    return { hello: 'world' }
})

// Run the server!
try {
    await fastify.listen({ port: port })
} catch (err) {
    fastify.log.error(err)
    process.exit(1)
}