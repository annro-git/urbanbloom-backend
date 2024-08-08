const request = require('supertest');
const mongoose = require('mongoose');
const User = require('../models/users');
const Garden = require('../models/gardens');
const app = require('../app')

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
    await Garden.deleteMany({});
});

afterAll(async () => {
    // Disconnect from the in-memory database
    await mongoose.connection.close();
});

describe('POST /garden', () => {
    it('should create a new garden with valid data', async () => {
        const user = new User({ token: 'valid-token' });
        await user.save();

        const response = await request(app)
            .post('/garden')
            .send({
                latitude: 48.8566,
                longitude: 2.3522,
                name: 'My Garden',
                description: 'A beautiful garden',
                token: 'valid-token',
                interests: 'flowers,vegetables',
                bonus: 'fountain,bench'
            });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('result', true);
        expect(response.body).toHaveProperty('data');
    });

    it('should return 400 if any field is missing', async () => {
        const response = await request(app)
            .post('/garden')
            .send({
                latitude: 48.8566,
                longitude: 2.3522,
                name: 'My Garden',
                description: 'A beautiful garden',
                token: 'valid-token',
                interests: 'flowers,vegetables'
                // Missing 'bonus'
            });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('result', false);
        expect(response.body).toHaveProperty('error', 'Missing or empty fields');
    });

    it('should return 404 if user is not found', async () => {
        const response = await request(app)
            .post('/garden')
            .send({
                latitude: 48.8566,
                longitude: 2.3522,
                name: 'My Garden',
                description: 'A beautiful garden',
                token: 'invalid-token',
                interests: 'flowers,vegetables',
                bonus: 'fountain,bench'
            });

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('result', false);
        expect(response.body).toHaveProperty('error', 'User not found');
    });
});


describe('POST /garden/:id/post', () => {
    it('should return 400 if any field is missing', async () => {
        const response = await request(app)
            .post('/garden/12345/post')
            .send({
                token: 'valid-token',
                title: 'My Post',
                text: 'This is a post',
                // Missing 'pictures'
            });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('result', false);
        expect(response.body).toHaveProperty('error', 'Missing or empty fields');
    });

    it('should return 404 if garden does not exist', async () => {
        const response = await request(app)
            .post('/garden/invalid-id/post')
            .send({
                token: 'valid-token',
                title: 'My Post',
                text: 'This is a post',
                pictures: ['pic1.jpg', 'pic2.jpg']
            });

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('result', false);
        expect(response.body).toHaveProperty('error', 'Garden not found');
    });

    it('should return 404 if user does not exist', async () => {
        const response = await request(app)
            .post('/garden/12345/post')
            .send({
                token: 'invalid-token',
                title: 'My Post',
                text: 'This is a post',
                pictures: ['pic1.jpg', 'pic2.jpg']
            });

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('result', false);
        expect(response.body).toHaveProperty('error', 'User not found');
    });

    it('should return 201 if all fields are present and valid', async () => {
        const response = await request(app)
            .post('/garden/12345/post')
            .send({
                token: 'valid-token',
                title: 'My Post',
                text: 'This is a post',
                pictures: ['pic1.jpg', 'pic2.jpg']
            });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('result', true);
        expect(response.body).toHaveProperty('message', expect.stringContaining('Post created successfully'));
    });
});


describe('POST /garden/:id/event', () => {
    it('should return 400 if any field is missing', async () => {
        const response = await request(app)
            .post('/garden/12345/event')
            .send({
                token: 'valid-token',
                title: 'Event Title',
                text: 'Event description',
                pictures: ['pic1.jpg', 'pic2.jpg'],
                // Missing 'date'
            });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('result', false);
        expect(response.body).toHaveProperty('error', 'Missing or empty fields');
    });

    it('should return 404 if garden does not exist', async () => {
        const response = await request(app)
            .post('/garden/invalid-id/event')
            .send({
                token: 'valid-token',
                title: 'Event Title',
                text: 'Event description',
                pictures: ['pic1.jpg', 'pic2.jpg'],
                date: '2023-10-10'
            });

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('result', false);
        expect(response.body).toHaveProperty('error', 'Garden not found');
    });

    it('should return 404 if user does not exist', async () => {
        const response = await request(app)
            .post('/garden/12345/event')
            .send({
                token: 'invalid-token',
                title: 'Event Title',
                text: 'Event description',
                pictures: ['pic1.jpg', 'pic2.jpg'],
                date: '2023-10-10'
            });

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('result', false);
        expect(response.body).toHaveProperty('error', 'User not found');
    });

    it('should return 201 if all fields are present and valid', async () => {
        const response = await request(app)
            .post('/garden/12345/event')
            .send({
                token: 'valid-token',
                title: 'Event Title',
                text: 'Event description',
                pictures: ['pic1.jpg', 'pic2.jpg'],
                date: '2023-10-10'
            });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('result', true);
        expect(response.body).toHaveProperty('message', expect.stringContaining('Event created successfully'));
    });
});