const express = require("express")
const router = express.Router()

// Modules
const Message = require("../mongoDB/messageModel.js")
const ValidationManager = require("../tools/validation.js")

router.get("/room_messages", async (req, res) => {
    let body = req.body
    let limit = req.query.limit || 10
    let page = req.query.page || 1
    let messages = null

    // Validation
    let validationResult = ValidationManager.validateDataFields(body, ["chatroom"], "retrieving room messages");
    if (validationResult.isError)
        return res.status(400).send({ code: validationResult.error, status: validationResult.message });

    try {
        messages = await Message.paginate({}, { limit, page })
    } catch (err) {
        console.log(err);
        return res.status(400).send({ code: "400", message: "Error when retrieving messages", data: err })
    }


    res.status(200).send({ code: "200", message: "Success retrieving messages", data: messages })
});

router.post("/new_message", async (req, res) => {
    let body = req.body

    // Validation
    let validationResult = ValidationManager.validateDataFields(body, ["id", "chatroom", "message", "date", "status"], "saving new message");
    if (validationResult.isError)
        return res.status(400).send({ code: validationResult.error, status: validationResult.message });


    const message = new Message({ id: body.id, chatroom: body.chatroom, message: body.message, sender: body.sender, date: body.date, status: body.status });
    try {
        await message.save().catch((err) => { throw err })
    } catch (err) {
        return res.status(400).send({ code: "400", message: "Error when saving message", data: err })
    }

    res.status(200).send({ code: "200", message: "Added new message", data: null })
});

router.post("/delete_message", async (req, res) => {
    let body = req.body

    // Validation
    let validationResult = ValidationManager.validateDataFields(body, ["id"], "deleting new message");
    if (validationResult.isError)
        return res.status(400).send({ code: validationResult.error, status: validationResult.message });

    try {
        await Message.findOneAndDelete({ id: body.id }).catch((err) => { throw err })
    } catch (err) {
        return res.status(400).send({ code: "400", message: "Error when deleting message", data: err })
    }

    res.status(200).send({ code: "200", message: "Deleted message", data: null })
})

router.post("/edit_message", async (req, res) => {
    let body = req.body

    // Validation
    let validationResult = ValidationManager.validateDataFields(body, ["id", "newMessage"], "editing new message");
    if (validationResult.isError)
        return res.status(400).send({ code: validationResult.error, status: validationResult.message });

    try {
        await Message.findOneAndUpdate({ id: body.id }, { message: body.newMessage }).catch((err) => { throw err })
    } catch (err) {
        return res.status(400).send({ code: "400", message: "Error when editing message", data: err })
    }

    res.status(200).send({ code: "200", message: "Edited message", data: null })
})

module.exports = router;