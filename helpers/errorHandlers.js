const checkReq = (keys, res) => {
    if(keys.some(e => !e)){
        res.status(400)
        res.json({ result: false, error: 'Missing or empty field(s)' })
        return false
    }
}

const isFound = (name, type, res) => {
    if(!type) {
        res.status(404)
        res.json({ result: false, error: `${name} not found` })
        return false
    }
}

const isMember = (user, res) => {
    if(!user) {
        res.status(403)
        res.json({ result: false, error: 'User is not a member' })
    }
}

const isOwnerOrAdmin = () => {} // TODO

module.exports = { checkReq, isFound, isMember, isOwnerOrAdmin }