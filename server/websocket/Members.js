const Member = require("./Member.js")
const axios = require("axios")

module.exports = class Members {
    constructor() {
        this.members = new Array()
    }

    // Methods
    register(userId, socket, roomId) {
        let member = new Member(userId, socket, roomId)

        this.members.push(member)
        console.log(this.members.length);
    }

    async broadcast(rawMessage, senderSocket) {
        // Decode message and get room id and user id
        let message = rawMessage.utf8Data
        let decoded_message = JSON.parse(message)
        let roomId = decoded_message.chatroom
        let userId = decoded_message.sender.id

        // Save message into database
        let successSavingMessage = await this.saveMessageToServer(decoded_message, senderSocket)
        if (!successSavingMessage) { return }

        // Send server saving receipt back to sender
        this.sendSavingConfirmationToMember(decoded_message, senderSocket)

        // Get all users in this room
        let roomMembers = this.members.filter((member) => { return member.roomId = roomId })

        // Send message to the rest of users in room
        roomMembers.forEach(member => {
            if (member.userId != userId) {
                member.socket.send(message)
            }
        });
    }

    purgeInactiveSockets() {
        let indexOfSocketToRemove = 0

        let i = 0
        this.members.forEach(member => {
            if (!member.socket.connected) {
                indexOfSocketToRemove = i
            }
            i++
        });

        this.members.splice(indexOfSocketToRemove, indexOfSocketToRemove + 1)
    }

    async saveMessageToServer(message) {
        return axios.post("http://localhost:9005/messages/new_message", message)
            .then((res) => { return true })
            .catch((err) => { return false })
    }

    sendSavingConfirmationToMember(message, senderSocket) {
        let receipt = {
            "messageId": message.id,
            "sender": {
                "id": message.sender.id,
                "name": message.sender.name
            },
            "receiptAuthor": "server",
            "chatroom": message.chatroom
        }

        senderSocket.send(receipt)
    }
}
