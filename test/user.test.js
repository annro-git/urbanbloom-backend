const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app'); // Assurez-vous que le chemin est correct
const User = require('../models/users');
const Event = require('../models/events');
const bcrypt = require('bcrypt');
const uid2 = require('uid2');

describe('User Routes', () => {
    beforeAll(async () => {
        // Connect to the database using the connection string from environment variables
        await mongoose.connect(process.env.CONNECTION_STRING, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
    });

    beforeEach(async () => {
        // Clean up the database before each test
        await User.deleteMany({});
        await Event.deleteMany({});
    });

    afterAll(async () => {
        // Clean up the database after all tests
        await User.deleteMany({});
        await Event.deleteMany({});
        // Close the database connection
        await mongoose.connection.close();
    });

    test('should get all users', async () => {
        const response = await request(app).get('/');

        expect(response.status).toBe(200);
        expect(response.body.result).toBe(true);
        expect(response.body.users).toBeInstanceOf(Array);
    });

    test('should register a new user', async () => {
        const response = await request(app)
            .post('/register')
            .send({
                firstname: 'John',
                lastname: 'Doe',
                email: 'john.doe@example.com',
                password: 'password123',
                username: 'johndoe'
            });

        expect(response.status).toBe(200);
        expect(response.body.result).toBe(true);
        expect(response.body.user).toHaveProperty('username', 'johndoe');
    });

    test('should login a user', async () => {
        const user = new User({
            firstname: 'John',
            lastname: 'Doe',
            email: 'john.doe@example.com',
            password: bcrypt.hashSync('password123', 10),
            username: 'johndoe',
            token: uid2(32)
        });
        await user.save();

        const response = await request(app)
            .post('/login')
            .send({
                username: 'johndoe',
                password: 'password123'
            });

        expect(response.status).toBe(200);
        expect(response.body.result).toBe(true);
        expect(response.body.user).toHaveProperty('username', 'johndoe');
    });

    test('should get events by user ID', async () => {
        const event = new Event({ /* propriétés de l'événement */ });
        await event.save();

        const response = await request(app)
            .get(`/event/${event._id}`)
            .send({ token: 'sometoken' });

        expect(response.status).toBe(200);
        expect(response.body.result).toBe(true);
        expect(response.body.events).toHaveProperty('_id', event._id.toString());
    });
});