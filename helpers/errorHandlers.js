const checkReq = (keys, res) => {
    if(keys.some(e => !e)){
        res.status(400)
        res.json({ result: false, error: 'Missing or empty field(s)' })
        return false
    }
    return true
}

const isFound = (name, type, res) => {
    if(!type) {
        res.status(404)
        res.json({ result: false, error: `${name} not found` })
        return false
    }
    return true
}

const userCredential = (group, user, garden, res) => {  
    if(group === 'admins'){
        if(!user.isAdmin){
            res.status(403)
            res.json({ result: false, error: 'Run, you fools!'})
            return false
        }
        return true
    }
    if(!group || !garden[group]){
        res.status(404)
        res.json({ result: false, error: 'Group not found'})
        return false
    }
    if(!garden[group].some(e => String(e) === String(user._id))){
        res.status(403)
        res.json({ result: false, error: `${user.username} is not ${group}` })
        return false
    }
    return true
}

module.exports = { checkReq, isFound, userCredential }