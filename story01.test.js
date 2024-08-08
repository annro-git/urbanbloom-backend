const request = require('supertest')
const app = require('./app')

const userBody = { email: 'email@fai.com', password: '0Azertyuiop', }

it('01 - User signup', async () => {

    await request(app).post('/user/')
        .send(userBody)
        .expect(201)
        .then(async(response) => {
            expect(response.body.result).toBeTruthy()
        })
})

it('02 - User signin and create a new Garden', async () => {

    let token = ''
    await request(app).get('/user/')
        .send(userBody)
        .expect(200)
        .then(async(response) => {
            expect(response.body.result).toBeTruthy()
            token = response.body.token
        })

    const gardenBody = { 
        latitude: 1, 
        longitude: 2, 
        name: 'Jardin Test', 
        description: 'Description du Jardin Test', 
        interests: '[\'fruits\']', 
        bonus: '[\'dogs\']', 
        token,
    }

    await request(app).post('/garden/')
        .send(gardenBody)
        .expect(201)
        .then(async(response) => {
            expect(response.body.result).toBeTruthy()
        })
})

it('0x - User signin and delete account', async () => {

    let token = ''
    await request(app).get('/user/')
        .send(userBody)
        .expect(200)
        .then(async(response) => {
            expect(response.body.result).toBeTruthy()
            token = await response.body.token
        })
    
    const body = { token }
    await request(app).delete('/user/')
        .send(body)
        .expect(200)
        .then(async(response) => {
            expect(response.body.result).toBeTruthy()
        })

})