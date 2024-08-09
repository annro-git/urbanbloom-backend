const request = require('supertest');
const mongoose = require('mongoose');
const User = require('../models/users');
const Garden = require('../models/gardens');
const app = require('../app')
const uid2 = require('uid2');
const bcrypt = require('bcrypt');


describe('Garden Routes', () => {
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

    test('should create a new garden', async () => {
        const user = new User({
            email: 'test@example.com',
            password: bcrypt.hashSync('password123', 10),
            firstname: 'John',
            lastname: 'Doe',
            token: uid2(32)
        });
        await user.save();

        const response = await request(app)
            .post('/garden')
            .send({
                latitude: 12.34,
                longitude: 56.78,
                name: 'Test Garden',
                description: 'A beautiful garden',
                token: user.token,
                interests: 'flowers, vegetables',
                bonus: 'dogs, water'
            });

        expect(response.status).toBe(201);
        expect(response.body.result).toBe(true);
        expect(response.body.message).toMatch(/Garden .* created and added to .* gardens/);
    });

    test('should create a new post in a garden', async () => {
        const user = new User({
            email: 'test@example.com',
            password: bcrypt.hashSync('password123', 10),
            firstname: 'John',
            lastname: 'Doe',
            token: uid2(32)
        });
        await user.save();

        const garden = new Garden({
            coordinates: { latitude: 12.34, longitude: 56.78 },
            name: 'Test Garden',
            description: 'A beautiful garden',
            owners: [user],
            members: [user],
            filters: { interests: ['flowers', 'vegetables'], bonus: ['dogs', 'water'] }
        });
        await garden.save();

        const response = await request(app)
            .post(`/garden/${garden._id}/post`)
            .send({
                token: user.token,
                title: 'New Post',
                text: 'This is a new post',
                pictures: []
            });

        expect(response.status).toBe(201);
        expect(response.body.result).toBe(true);
        expect(response.body.message).toBe('Post created');
    });

    test('should get garden posts', async () => {
        const user = new User({
            email: 'test@example.com',
            password: bcrypt.hashSync('password123', 10),
            firstname: 'John',
            lastname: 'Doe',
            token: uid2(32)
        });
        await user.save();

        const garden = new Garden({
            coordinates: { latitude: 12.34, longitude: 56.78 },
            name: 'Test Garden',
            description: 'A beautiful garden',
            owners: [user],
            members: [user],
            filters: { interests: ['flowers', 'vegetables'], bonus: ['dogs', 'water'] },
            posts: [{ owner: user._id, title: 'New Post', text: 'This is a new post', pictures: [] }]
        });
        await garden.save();

        const response = await request(app)
            .get(`/garden/${garden._id}/posts`)
            .send({ token: user.token });

        expect(response.status).toBe(200);
        expect(response.body.result).toBe(true);
        expect(response.body.posts).toHaveLength(1);
    });

    test('should create a reply to a post', async () => {
        const user = new User({
            email: 'test@example.com',
            password: bcrypt.hashSync('password123', 10),
            firstname: 'John',
            lastname: 'Doe',
            token: uid2(32)
        });
        await user.save();

        const garden = new Garden({
            coordinates: { latitude: 12.34, longitude: 56.78 },
            name: 'Test Garden',
            description: 'A beautiful garden',
            owners: [user],
            members: [user],
            filters: { interests: ['flowers', 'vegetables'], bonus: ['dogs', 'water'] },
            posts: [{ _id: new mongoose.Types.ObjectId(), owner: user._id, title: 'New Post', text: 'This is a new post', pictures: [], replies: [] }]
        });
        await garden.save();

        const postId = garden.posts[0]._id;

        const response = await request(app)
            .post(`/garden/${garden._id}/post/${postId}`)
            .send({
                token: user.token,
                text: 'This is a reply'
            });

        expect(response.status).toBe(200);
        expect(response.body.result).toBe(true);
        expect(response.body.message).toMatch(/Reply added to post/);
    });

    test('should get replies to a post', async () => {
        const user = new User({
            email: 'test@example.com',
            password: bcrypt.hashSync('password123', 10),
            firstname: 'John',
            lastname: 'Doe',
            token: uid2(32)
        });
        await user.save();

        const garden = new Garden({
            coordinates: { latitude: 12.34, longitude: 56.78 },
            name: 'Test Garden',
            description: 'A beautiful garden',
            owners: [user],
            members: [user],
            filters: { interests: ['flowers', 'vegetables'], bonus: ['dogs', 'water'] },
            posts: [{ _id: new mongoose.Types.ObjectId(), owner: user._id, title: 'New Post', text: 'This is a new post', pictures: [], replies: [{ owner: user._id, text: 'This is a reply', date: new Date() }] }]
        });
        await garden.save();

        const postId = garden.posts[0]._id;

        const response = await request(app)
            .get(`/garden/${garden._id}/post/${postId}`)
            .send({ token: user.token });

        expect(response.status).toBe(200);
        expect(response.body.result).toBe(true);
        expect(response.body.replies).toHaveLength(1);
    });

    test('should create a new event in a garden', async () => {
        const user = new User({
            email: 'test@example.com',
            password: bcrypt.hashSync('password123', 10),
            firstname: 'John',
            lastname: 'Doe',
            token: uid2(32)
        });
        await user.save();

        const garden = new Garden({
            coordinates: { latitude: 12.34, longitude: 56.78 },
            name: 'Test Garden',
            description: 'A beautiful garden',
            owners: [user],
            members: [user],
            filters: { interests: ['flowers', 'vegetables'], bonus: ['dogs', 'water'] }
        });
        await garden.save();

        const response = await request(app)
            .post(`/garden/${garden._id}/event`)
            .send({
                token: user.token,
                title: 'New Event',
                text: 'This is a new event',
                pictures: [],
                date: new Date()
            });

        expect(response.status).toBe(201);
        expect(response.body.result).toBe(true);
        expect(response.body.message).toBe('Event created');
    });

    test('should get garden events', async () => {
        const user = new User({
            email: 'test@example.com',
            password: bcrypt.hashSync('password123', 10),
            firstname: 'John',
            lastname: 'Doe',
            token: uid2(32)
        });
        await user.save();

        const garden = new Garden({
            coordinates: { latitude: 12.34, longitude: 56.78 },
            name: 'Test Garden',
            description: 'A beautiful garden',
            owners: [user],
            members: [user],
            filters: { interests: ['flowers', 'vegetables'], bonus: ['dogs', 'water'] },
            events: [{ owner: user._id, title: 'New Event', text: 'This is a new event', pictures: [], date: new Date() }]
        });
        await garden.save();

        const response = await request(app)
            .get(`/garden/${garden._id}/events`)
            .send({ token: user.token });

        expect(response.status).toBe(200);
        expect(response.body.result).toBe(true);
        expect(response.body.events).toHaveLength(1);
    });

    it('should return 404 if garden ID is invalid', async () => {
        const response = await request(app)
            .get('/garden/invalidGardenId/filters')
            .send();

        expect(response.status).toBe(404);
        expect(response.body.result).toBe(false);
        expect(response.body.message).toBe('Jardin non trouvé.');
    });

    it('should return 404 if garden is not found', async () => {
        const validObjectId = new mongoose.Types.ObjectId();
        const response = await request(app)
            .get(`/garden/${validObjectId}/filters`)
            .send();

        expect(response.status).toBe(404);
        expect(response.body.result).toBe(false);
        expect(response.body.message).toBe('Jardin non trouvé.');
    });

    it('should return 200 and garden filters if garden is found', async () => {
        const garden = new Garden({
            name: 'Test Garden',
            description: 'A beautiful garden',
            coordinates: {
                longitude: 12.34,
                latitude: 56.78
            },
            interests: ['flowers', 'trees'],
            bonus: ['fountain']
        });
        await garden.save();

        const response = await request(app)
            .get(`/garden/${garden._id}/filters`)
            .send();

        expect(response.status).toBe(200);
        expect(response.body.result).toBe(true);
        expect(response.body.data).toEqual({
            interests: garden.interests,
            bonus: garden.bonus
        });

        await Garden.findByIdAndDelete(garden._id); // Nettoie la base de données après le test
    });

    it('should return 500 if there is an internal server error', async () => {
        jest.spyOn(Garden, 'findById').mockImplementation(() => {
            throw new Error('Internal Server Error');
        });

        const validObjectId = new mongoose.Types.ObjectId();
        const response = await request(app)
            .get(`/garden/${validObjectId}/filters`)
            .send();

        expect(response.status).toBe(500);
        expect(response.body.result).toBe(false);
        expect(response.body.message).toBe('Erreur interne du serveur.');

        Garden.findById.mockRestore(); // Restaure l'implémentation originale de findById
    });
});