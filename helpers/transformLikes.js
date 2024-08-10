const transformLikes = (likes) => {
    const result = {}

    likes.forEach(like => {
        if(!result[like.likeType]){
            result[like.likeType] = []
            result[like.likeType].push(like.owner.username)
            return
        }
        result[like.likeType].push(like.owner.username)
    })

    return result
}

module.exports = { transformLikes }