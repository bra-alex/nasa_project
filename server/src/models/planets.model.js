const fs = require('fs')
const path = require('path')
const { parse } = require('csv-parse')

const planets = require('./planets.mongo')

function isHabitable(planet) {
    return planet['koi_disposition'] === 'CONFIRMED' 
    && planet['koi_insol'] > 0.36 && planet['koi_insol'] < 1.11
    && planet['koi_prad'] < 1.6
}
 
function loadPlanetsData() {
    const filePath = path.join(__dirname, '..', '..', 'data', 'kepler_data.csv')
    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(parse({
                comment: '#',
                columns: true
            }))
            .on('data', async data => {
                if(isHabitable(data)){
                    savePlanet(data)
                }
            })
            .on('error', (error) => {
                console.log(error)
                reject(error)
            })
            .on('end', async () => {
                const planetsCount = (await getAllPlanets()).length
                console.log(`${planetsCount} planets found`)
                resolve()
            })
        })
}

async function getAllPlanets(){
    return await planets.find({}, {
        '_id': 0, 
        '__v': 0
    })
}

async function savePlanet(planet){
    try {
        await planets.updateOne({
            keplerName: planet.kepler_name
        }, {
            keplerName: planet.kepler_name
        }, {
            upsert: true
        })
    } catch (err) {
        console.error(`Couldn't save planet ${err}`)
    }
    
}

module.exports = {
    loadPlanetsData,
    getAllPlanets
}
