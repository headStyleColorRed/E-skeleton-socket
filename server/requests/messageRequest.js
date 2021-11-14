const express = require("express")
const router = express.Router()

// Modules
const Message = require("../mongoDB/messageModel.js")
const ValidationManager = require("../tools/validation.js")


router.post("/new_message", async (req, res) => {
    let body = req.body

    // Validation
    let validationResult = ValidationManager.validateDataFields(body, ["id", "chatroom", "message", "sender", "date", "status"], "saving new message");
    if (validationResult.isError)
        return res.status(200).send({ code: validationResult.error, status: validationResult.message });


    const message = new Message({ id = body.id, chatroom = body.chatroom, message = body.message, sender = body.sender, date = body.date, status = body.status });
    try {
        await message.save().catch((err) => { throw err })
    } catch (err) {
        return res.status(200).send({ code: "400", message: "Error when saving message", data: err })
    }

    res.status(200).send({ code: "200", message: "Searched emergencies success", data: null })
});


module.exports = router;

