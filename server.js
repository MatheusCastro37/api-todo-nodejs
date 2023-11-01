import { sql } from './app.js';
import Fastify from 'fastify';

const fastify = Fastify({
    logger: true
})

const port = 3333;

// Declare a route
fastify.get('/', async function() {
    return await sql`SELECT * FROM user_info`
})

// Run the server!
try {
    await fastify.listen({ port: port })
} catch (err) {
    fastify.log.error(err)
    process.exit(1)
}