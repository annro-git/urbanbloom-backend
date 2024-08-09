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

const isMember = (user, res) => {
    if(!user) {
        res.status(403)
        res.json({ result: false, error: 'User is not a member' })
    }
    return true
}

const isOwnerOrAdmin = () => {} // TODO

module.exports = { checkReq, isFound, isMember, isOwnerOrAdmin }