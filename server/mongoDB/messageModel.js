// Message.model.js
const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
	id: {
		type: String,
		required: [true, "can't be blank"],
		unique: true,
	},
	chatroom: {
		type: String,
		required: [true, "can't be blank"]
	},
	message: {
		type: String
	},
	sender: {
		type: Object
	},
	date: {
		type: String
	},
	status: {
		type: String
	}

});

const Message = mongoose.model("Message", messageSchema);


module.exports = Message;