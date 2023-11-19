import Fastify from 'fastify';
import cors from '@fastify/cors';

import bcrypt from 'bcrypt';

import { sql } from './app.js';

import { v4 as uuidv4 } from 'uuid';

const fastify = Fastify({
    logger: true
})
await fastify.register(cors)

const port = 3333;

// Declare a route
fastify.post('/', async function(req, res) {

    const { email, password } = req.body

    const verifyUserDB = await sql`SELECT user_email, user_password FROM user_info WHERE user_email LIKE ${email} AND user_password = ${password} `
    
    if(verifyUserDB.length === 1){
        res.status(200).send('email e senha existe!')
    }

    if(verifyUserDB.length === 0){
        res.status(404).send('email ou senha não existe!')
    }

})

fastify.post('/createUser', async function(req, res) {

    var { name, email, password } = req.body

    var passwordString = password.toString();
    
    const salt = await bcrypt.genSalt(12)
    const passwordHash = await bcrypt.hash(passwordString, salt)

    const userID = uuidv4();

    try {
        
        await sql`
            INSERT INTO user_info(user_id,user_name,user_email,user_password)
            VALUES(${userID},${name},${email},${passwordHash})
        `
        res.status(201).send({ msg: "usuario criado com sucesso!" })
        
    } catch {
        res.status(400).send({ msg: "Usuario ja existente!"})
    }
    
})

fastify.post('/todoList/:user_id', async function(req, res) {
    const todoID = uuidv4();
    const { user_id } = req.params
    await sql`
        INSERT INTO user_todos(todo_id, todo_name, user_id_todo)
        VALUES(${todoID}, ${req.body.todo},${user_id})
    `
})

fastify.get('/todoList/:user_id', async function(req, res) {
    const { user_id } = req.params
    return await sql`SELECT * FROM user_todos WHERE user_id_todo = ${user_id}`
})

// Run the server!
try {
    await fastify.listen({ port: port })
} catch (err) {
    fastify.log.error(err)
    process.exit(1)
}