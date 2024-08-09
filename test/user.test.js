const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app'); // Assurez-vous que le chemin est correct
const User = require('../models/users');
const Event = require('../models/events');
const Garden = require('../models/gardens');
const bcrypt = require('bcrypt');
const uid2 = require('uid2');

describe('User Routes', () => {
    beforeAll(async () => {
        await mongoose.connect(process.env.CONNECTION_STRING, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
    });

    beforeEach(async () => {
        await User.deleteMany({});
        await Garden.deleteMany({});
    });

    afterAll(async () => {
        await User.deleteMany({});
        await Garden.deleteMany({});
        await mongoose.connection.close();
    });

    test('should create a new user', async () => {
        const response = await request(app)
            .post('/user')
            .send({
                email: 'test@example.com',
                password: 'password123',
                firstname: 'John',
                lastname: 'Doe'
            });

        expect(response.status).toBe(201);
        expect(response.body.result).toBe(true);
        expect(response.body).toHaveProperty('token');
    });

    test('should get user token', async () => {
        const user = new User({
            email: 'test@example.com',
            password: bcrypt.hashSync('password123', 10),
            firstname: 'John',
            lastname: 'Doe',
            token: uid2(32)
        });
        await user.save();

        const response = await request(app)
            .post('/user/token')
            .send({
                email: 'test@example.com',
                password: 'password123'
            });

        expect(response.status).toBe(200);
        expect(response.body.result).toBe(true);
        expect(response.body).toHaveProperty('token', user.token);
    });

    test('should delete a user', async () => {
        const user = new User({
            email: 'test@example.com',
            password: bcrypt.hashSync('password123', 10),
            firstname: 'John',
            lastname: 'Doe',
            token: uid2(32)
        });
        await user.save();

        const response = await request(app)
            .delete('/user')
            .send({ token: user.token });

        expect(response.status).toBe(200);
        expect(response.body.result).toBe(true);
        expect(response.body.message).toBe('User and related datas deleted');
    });

    test('should get user gardens', async () => {
        const user = new User({
            email: 'test@example.com',
            password: bcrypt.hashSync('password123', 10),
            firstname: 'John',
            lastname: 'Doe',
            token: uid2(32),
            gardens: []
        });
        await user.save();

        const response = await request(app)
            .get('/user/gardens')
            .send({ token: user.token });

        expect(response.status).toBe(200);
        expect(response.body.result).toBe(true);
        expect(response.body).toHaveProperty('gardens');
    });

    test('should update user gardens', async () => {
        const user = new User({
            email: 'test@example.com',
            password: bcrypt.hashSync('password123', 10),
            firstname: 'John',
            lastname: 'Doe',
            token: uid2(32),
            gardens: []
        });
        await user.save();

        const garden = new Garden({
            name: 'Test Garden',
            description: 'A beautiful garden',
            coordinates: {
                longitude: 12.34,
                latitude: 56.78
            },
        });
        await garden.save();

        const response = await request(app)
            .put(`/user/garden/${garden._id}`)
            .send({ token: user.token });

        expect(response.status).toBe(200);
        expect(response.body.result).toBe(true);
        expect(response.body.message).toMatch(/Garden .* (added|removed)/);
    });
});