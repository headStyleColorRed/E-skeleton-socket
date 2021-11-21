const Member = require("./Member.js")
const axios = require("axios")

module.exports = class Members {
    constructor() {
        this.chatrooms = new Object()
    }

    // Methods

    // Iterates over all roomsId's and appends the new member to
    // the proper chatrooms
    register(userId, socket, roomsId) {
        roomsId.forEach(roomId => {
            let member = new Member(userId, socket, roomId)
            this.addToRoom(member, roomId)
        });
    }

    // Creates or appends a user into the roomId key's array
    addToRoom(member, roomId) {
        // If room exists push member
        // else create array with new member
        if (roomId in this.chatrooms) {
            this.chatrooms[roomId].push(member)
        } else {
            this.chatrooms[roomId] = [member]
        }
    }

    async handleMessage(rawMessage, senderSocket) {
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

        // Save message into database
        let successSavingMessage = await this.saveMessageToServer(decoded_message, senderSocket)
        if (!successSavingMessage) { return }

        // Send confirmation of server recival to original sender user
        this.sendServerSavingConfirmationToMember(decoded_message, senderSocket)

        // Send message to the rest of users in room
        this.broadCastToOtherUsers(roomId, message, decoded_message.sender.id)
    }

    // Removing all sockets where there's no connection
    purgeInactiveSockets() {
        for (const chatroom in this.chatrooms) {
            this.removeSockets(this.chatrooms[chatroom])
            if (this.chatrooms[chatroom].length == 0) { 
                delete this.chatrooms[chatroom]
            }
        }
    }

    removeSockets(chatroom) {
        let indexOfSocketToRemove = 0

        let i = 0
        chatroom.forEach(member => {
            if (!member.socket.connected) {
                indexOfSocketToRemove = i
            }
            i++
        });

        chatroom.splice(indexOfSocketToRemove, indexOfSocketToRemove + 1)
    }

    sendServerSavingConfirmationToMember(message, senderSocket) {
        let receipt = {
            "messageId": message.id,
            "sender": {
                "id": message.sender.id,
                "name": message.sender.name,
                "imgUrl": message.sender.imgUrl
            },
            "receiptAuthor": "server",
            "chatroom": message.chatroom,
            "messageType": "receipt"
        }

        senderSocket.send(JSON.stringify(receipt))
    }

    // Get user that needs the receipt, find him in his chatroom and send him
    handleUsersReceipt(decoded_message) {
        let userIdForReceipt = decoded_message.sender.id
        let roomId = decoded_message.chatroom
        let chatroomMembers = this.usersInRoom(roomId)

        let userSocketForReceipt = chatroomMembers.filter((member) => { return member.userId == userIdForReceipt })[0].socket
        userSocketForReceipt.send(JSON.stringify(decoded_message))
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
        this.broadCastToAllUsers(decoded_message.chatroom, JSON.stringify(decoded_message))
    }

    async handleMessageEdition(decoded_message) {
        let success = await axios.post("http://localhost:9005/messages/edit_message", { id: decoded_message.messageId, newMessage: decoded_message.newMessage })
            .then((res) => true)
            .catch((err) => false)

        // Change
        decoded_message.success = success

        // Get all users in this room
        this.broadCastToAllUsers(decoded_message.chatroom, JSON.stringify(decoded_message))
    }


    // + + + + + + + + + + + + + + + + +  UTILS + + + + + + + + + + + + + + + + + + + + //
    usersInRoom(roomId) {
        return this.chatrooms[roomId].filter((member) => { return member.roomId = roomId })
    }

    broadCastToAllUsers(roomId, message) {
        this.usersInRoom(roomId).forEach(member => {
            member.socket.send(message)
        });
    }

    // Send message to the rest of users in room
    broadCastToOtherUsers(roomId, message, senderId) {
        this.usersInRoom(roomId).forEach(member => {
            if (member.userId != senderId) {
                member.socket.send(message)
            }
        });
    }
}