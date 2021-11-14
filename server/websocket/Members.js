const Member = require ("./Member.js")

module.exports = class Members {
    constructor() {
        this.members = new Array()
    }

    // Methods
    register(userId, socket, roomId) {
        let member = new Member(userId, socket, roomId)
        this.members.push(member)
    }

    broadcast(message) {
        // Decode message and get room id and user id
        let decoded_message = JSON.parse(message.utf8Data)
        let roomId = decoded_message['chatroom']
        let userId = decoded_message['sender'].id
        
        // Get all users in this room
        let roomMembers = this.members.filter((member) => { return member.roomId = roomId })

        // Send message to the rest of users in room
        roomMembers.forEach(member => {
            if (member.userId != userId) {
                member.socket.send(message.utf8Data)
            }
        });
    }
}