module.exports = class Member {
    constructor(userId, socket, roomId) {
        this.userId = userId
        this.socket = socket
        this.roomId = roomId
    }
}