const request = require('supertest')
const app = require('../../app')
const { mongoConnect, mongoDisconnect } = require('../../services/mongo')

describe('Launches API', () => {
    jest.setTimeout(15000);

    beforeAll(async () => {
        await mongoConnect()
    })

    afterAll(async () => {
        await mongoDisconnect()
    })

    describe('Test GET /launches', () =>{
        test('Should respond with 200', async () => { 
            await request(app)
                .get('/v1/launches')
                .expect('Content-Type', /json/)
                .expect(200)
        })
    })

    describe('Test POST /launches', () => {
        const launchData = {
            mission: 'Mission to the west',
            rocket: 'Explorer IS1',
            target: 'Kepler-442 b',
            launchDate: "January 21, 2099"
        }

        const launchDataWithInvalidDate = {
            mission: 'Mission to the west',
            rocket: 'Explorer IS1',
            target: 'Kepler-442 b',
            launchDate: "hi"
        }

        const launchDataWithoutDate = {
            mission: 'Mission to the west',
            rocket: 'Explorer IS1',
            target: 'Kepler-442 b'
        }

        test('Should respond with 201 created', async () => {
            const response = await request(app)
                .post('/v1/launches')
                .send(launchData)
                .expect('Content-Type', /json/)
                .expect(201)

            const requestDate = new Date(launchData.launchDate).valueOf()
            const responseDate = new Date(response.body.launchDate).valueOf()

            expect(requestDate).toBe(responseDate)
            expect(response.body).toMatchObject(launchDataWithoutDate) 

        })

        test('Missing mission parameter', async () => {
            const response = await request(app)
                .post('/v1/launches')
                .send(launchDataWithoutDate)
                .expect('Content-Type', /json/)
                .expect(400)

            expect(response.body).toStrictEqual({
                error: "Missing mission parameter"
            })
        })

        test('"Wrong date input"', async () => {
            const response = await request(app)
                .post('/v1/launches')
                .send(launchDataWithInvalidDate)
                .expect('Content-Type', /json/)
                .expect(400)

            expect(response.body).toStrictEqual({
                error: "Wrong date input"
            })
        })
    })
})