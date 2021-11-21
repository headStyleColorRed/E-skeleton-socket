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
    }

    async broadcast(rawMessage, senderSocket) {
        // Decode message and get room id and user id
        let message = rawMessage.utf8Data
        let decoded_message = JSON.parse(message)

        switch (decoded_message.messageType) {
            case "text":
                this.handleTextMessage(message, decoded_message, senderSocket)
                break;
            case "receipt":
                this.handleUsersReceipt(decoded_message)
                break;
            case "delete":
                this.handleMessageDeletion(decoded_message)
                break;
            case "edit":
                this.handleMessageEdition(decoded_message)
                break;
            default:
                console.log("This message type isn't handled by the server => " + decoded_message.messageType);
        }
    }

    async handleTextMessage(message, decoded_message, senderSocket) {
        let roomId = decoded_message.chatroom
        let userId = decoded_message.sender.id

        // Save message into database
        let successSavingMessage = await this.saveMessageToServer(decoded_message, senderSocket)
        if (!successSavingMessage) { return }

        // Send confirmation of server recival to original sender user
        this.sendServerSavingConfirmationToMember(decoded_message, senderSocket)

        // Get all users in this room
        let roomMembers = this.usersInRoom(roomId)

        // Send message to the rest of users in room
        roomMembers.forEach(member => {
            if (member.userId != userId) {
                member.socket.send(message)
            }
        });
    }

    // Removing all sockets where there's no connection
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

    sendServerSavingConfirmationToMember(message, senderSocket) {
        let receipt = {
            "messageId": message.id,
            "sender": {
                "id": message.sender.id,
                "name": message.sender.name
            },
            "receiptAuthor": "server",
            "chatroom": message.chatroom,
            "messageType": "receipt"
        }

        senderSocket.send(JSON.stringify(receipt))
    }

    handleUsersReceipt(message) {
        let userIdForReceipt = message.sender.id
        let userSocketForReceipt = this.members.filter((member) => { return member.userId == userIdForReceipt })[0].socket
        userSocketForReceipt.send(JSON.stringify(message))
    }


    // + + + + + + + + + + + + + + + + + NODE SERVER + + + + + + + + + + + + + + + + + + + + //
    async saveMessageToServer(message) {
        if (message.receiptAuthor != undefined) { return true }

        return axios.post("http://localhost:9005/messages/new_message", message)
            .then((res) => { return true })
            .catch((err) => { return false })
    }

    async handleMessageDeletion(decoded_message) {
        let success = await axios.post("http://localhost:9005/messages/delete_message", { id: decoded_message.messageId })
            .then((res) => true)
            .catch((err) => false)

        // Change
        decoded_message.success = success

        // Get all users in this room
        let roomMembers = this.usersInRoom(decoded_message.chatroom)

        // Send message to the rest of users in room
        roomMembers.forEach(member => {
            member.socket.send(JSON.stringify(decoded_message))
        });
    }

    async handleMessageEdition(decoded_message) {
        let success = await axios.post("http://localhost:9005/messages/edit_message", { id: decoded_message.messageId, newMessage: decoded_message.newMessage })
            .then((res) => true)
            .catch((err) => false)

        // Change
        decoded_message.success = success

        // Get all users in this room
        let roomMembers = this.usersInRoom(decoded_message.chatroom)

        // Send message to the rest of users in room
        roomMembers.forEach(member => {
            member.socket.send(JSON.stringify(decoded_message))
        });
    }


    // + + + + + + + + + + + + + + + + +  UTILS + + + + + + + + + + + + + + + + + + + + //
    usersInRoom(roomId) {
        return this.members.filter((member) => { return member.roomId = roomId })
    }
}