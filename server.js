import Fastify from 'fastify';
import cors from '@fastify/cors';

import fastifyCookie from "@fastify/cookie";

import Jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import 'dotenv/config'

import { sql } from './app.js';

import { v4 as uuidv4 } from 'uuid';

const fastify = Fastify({
    logger: true
})

await fastify.register(cors, {
    origin: 'https://todo-list-beta-sable.vercel.app',
    credentials: true
})

await fastify.register(fastifyCookie, {
    secret: process.env.COOKIE_SECRET,
    hook: 'onRequest',
    parseOptions: {}
})

const port = 3333;

// Declare a route
fastify.post('/', async function(req, res) {

    var { email, password } = req.body
    password = password.toString();

    const [ verifyUserDB ] = await sql`SELECT user_id, user_email, user_password FROM user_info WHERE user_email LIKE ${email}`

    if(!verifyUserDB) {
        res.status(400).send({ msg: "Email não cadastrado!" })
    }

    const comparedPassword = await bcrypt.compare(password, verifyUserDB.user_password)

    if(!comparedPassword) {
        res.status(400).send({ msg: "Senha Invalida!" })
    }

    try {

        const token = Jwt.sign({ userID: verifyUserDB.user_id, email: verifyUserDB.user_email }, process.env.SECRET)

        res.cookie('tokenAPI', token, {
            domain: 'todo-list-beta-sable.vercel.app',
            httpOnly: true,
            signed: true,
            secure: true,
            sameSite: 'none',
            path: '/',
            partitioned: true,
            maxAge: 123456789
        })

        res.status(201).send({ msg: 'login feito!' })

    } catch (error) {
        res.status(500).send(error)
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

fastify.post('/todoList', async function(req, res) {

    const token = req.unsignCookie(req.cookies.tokenAPI)
    const decoded = Jwt.verify(token.value, process.env.SECRET)
    const todoID = uuidv4();

    await sql`
        INSERT INTO user_todos(todo_id, todo_name, user_id_todo)
        VALUES(${todoID}, ${req.body.todo},${decoded.userID})
    `

    res.status(201)
})

fastify.get('/todoList',{
        preHandler: (req, res, done) => {
            const cookieTokenAPI = req.unsignCookie(req.cookies.tokenAPI)

            if(!cookieTokenAPI.valid) {
                res.status(401).send({ msg: 'Cookie não autorizado' })
            }

            const tokenAPI = cookieTokenAPI.value
            
            Jwt.verify(tokenAPI, process.env.SECRET, (err, decoded) => {

                if(err) {
                    res.status(401).send(err.message)
                }

                if(decoded) {
                    req.user = decoded.userID
                    done()
                }
                
            })

        }
    },
    async function(req, res) {
        res.status(200)
        return await sql`SELECT todo_id, todo_name FROM user_todos WHERE user_id_todo = ${req.user}`
    }
)

fastify.delete('/todoList', async function(req, res) {

    const todoID = req.body
    await sql`
        DELETE FROM user_todos
        WHERE todo_id LIKE ${todoID}
    `
    res.status(200).send({ msg: 'Tarefa deletada com sucesso!' })

})

// Run the server!
try {
    fastify.listen({ 
        host: '0.0.0.0',
        port: process.env.PORT ?? port
    })
} catch (err) {
    fastify.log.error(err)
    process.exit(1)
}