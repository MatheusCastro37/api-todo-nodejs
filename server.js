import Fastify from 'fastify';
import cors from '@fastify/cors';

import { sql } from './app.js';

import { v4 as uuidv4 } from 'uuid';

const fastify = Fastify({
    logger: true
})
await fastify.register(cors)

const port = 3333;

// Declare a route
fastify.get('/', async function() {
    return await sql`SELECT * FROM user_info`
})

fastify.get('/createUser', async function(req, res) {
    return await sql`SELECT * FROM user_info`
})

fastify.get('/todoList/:user_id', async function(req, res) {
    const { user_id } = req.params
    return await sql`SELECT * FROM user_todos WHERE user_id_todo = ${user_id}`
})

fastify.post('/createUser', async function(req, res) {
    const userID = uuidv4();
    await sql`
    INSERT INTO user_info(user_id,user_name,user_email,user_password)
    VALUES(${userID},${req.body.name},${req.body.email},${req.body.password})
    `
})

// Run the server!
try {
    await fastify.listen({ port: port })
} catch (err) {
    fastify.log.error(err)
    process.exit(1)
}