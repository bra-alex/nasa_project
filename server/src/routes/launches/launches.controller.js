const { 
    getAllLaunches, 
    addNewLaunch,
    launchExists,
    abortLaunch 
} = require('../../models/launches.model')

const { getPagination } = require('../../services/query')

async function httpGetAllLaunches(req, res){
    const { skip, limit } = getPagination(req.query)
    const launches = await getAllLaunches(skip, limit)

    return res.status(200).json(launches)
}

async function httpAddNewLaunch(req, res){
    const launch = req.body

    if (!launch.mission || !launch.rocket || !launch.target || !launch.launchDate){
        return res.status(400).json({
            error: "Missing mission parameter"
        })
    }
    
    launch.launchDate = new Date(launch.launchDate)
    
    if(isNaN(launch.launchDate)){
        return res.status(400).json({
            error: "Wrong date input"
        })
    }

    await addNewLaunch(launch)
    return res.status(201).json(launch)
}

async function httpAbortLaunch(req, res){
    const launchID = +req.params.id
    const exist = await launchExists(launchID)

    if(!exist){
        return res.status(404).json({
            error: "Launch does not exist"
        })
    }

    const aborted = await abortLaunch(launchID)

    if(!aborted){
        return res.status(400).json({
            error: "Launch not aborted"
        })
    }
    
    return res.status(200).json({
        ok: true
    })
}

module.exports = {
    httpGetAllLaunches,
    httpAddNewLaunch,
    httpAbortLaunch 
}