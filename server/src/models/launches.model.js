const axios = require('axios')

const launches = require('./launches.mongo')
const planets = require('./planets.mongo')

const DEFAULT_FLIGHT_NUMBER = 100
const SPACEX_API_URL = 'https://api.spacexdata.com/v5/launches/query'

async function populateLaunches(){

    console.log('Uploading launch data')

    const response = await axios.post(SPACEX_API_URL, {
        query: {},
        options: {
            pagination: false,
            populate:[
                {
                    path: 'rocket',
                    select: {
                        name: 1
                    }
                },
                {
                    path: 'payloads',
                    select: {
                        customers: 1
                    }
                }
            ]
        }
    })

    if(response.status !== 200){
        console.log('Problem downloading launch data')
        throw new Error('Download failed')
    }

    const launchDocs = response.data.docs

    for(const launchDoc of launchDocs) {
        const payloads = launchDoc['payloads']
        const customers = payloads.flatMap((payload) => payload['customers'])

        const launch = {
            flightNumber: launchDoc['flight_number'],
            mission: launchDoc['name'],
            rocket: launchDoc['rocket']['name'],
            launchDate: launchDoc['date_local'],
            upcoming: launchDoc['upcoming'],
            success: launchDoc['success'],
            customers
        }

        console.log(`${launch.flightNumber} ${launch.mission}`)

        await saveLaunch(launch)
    }
}

async function loadLaunchData(){
    const launchExists = await findLaunch({
        flightNumber: 1,
        rocket: 'Falcon 1',
        mission: 'FalconSat'
    })
    

    if(launchExists){
        console.log('Launch Exists')
        return
    }
    
    await populateLaunches()
}

async function findLaunch(filter){
    return await launches.findOne(filter)
}

async function getAllLaunches(skip, limit){
    return await launches
    .find({}, {
        '_id': 0, 
        '__v': 0
    })
    .sort({
        flightNumber: 1
    })
    .skip(skip)
    .limit(limit)
}

async function getLatestFlightNumber(){
    const flightNumber = await launches
        .findOne()
        .sort('-flightNumber')

    if(!flightNumber){
        return DEFAULT_FLIGHT_NUMBER
    }

    return flightNumber.flightNumber
}

async function saveLaunch(launchData){
    try {
        await launches.findOneAndUpdate({
            flightNumber: launchData.flightNumber
        }, launchData, {
            upsert: true
        })
        
    }catch(err){
        console.error(`Could not save launch data ${err}`)
    }
}

async function addNewLaunch(launch){
    const planet = await planets.findOne({keplerName: launch.target})

    if(!planet){
        throw new Error('No matches found')
    }

    const newFlightNumber = await getLatestFlightNumber() + 1
    const newLaunch = Object.assign(launch, {
        flightNumber: newFlightNumber,
        customers: ['GASA', 'FWA'],
        upcoming: true,
        success: true
    })

    await saveLaunch(newLaunch)
}

async function launchExists(launchID){
    return await findLaunch({
        flightNumber: launchID
    })
}

async function abortLaunch(launchID){
    const aborted = await launches
        .updateOne({
            flightNumber: launchID
        },
        {
            upcoming: false,
            success: false
        })

    return aborted.modifiedCount === 1
}

module.exports = {
    loadLaunchData,
    getAllLaunches,
    addNewLaunch,
    launchExists,
    abortLaunch
}