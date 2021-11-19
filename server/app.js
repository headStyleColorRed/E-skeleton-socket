const express = require("express")
const app = express();
const port = 9005;
const Cors = require("cors")
const mongoose = require("mongoose")
const environment = process.env.NODE_ENV
const jwt = require('jsonwebtoken');
var dbLink = new String()
require('dotenv').config()

// Instantiate websocket server
require("./websocket/websocket.js")

// Modules
const Message = require("./mongoDB/messageModel.js")


// Set environment
console.log(`Current environment -> ${environment}`);
if (environment == "production")
	dbLink = "mongodb://roundCross_DB:27017/mongocross"
else 
	dbLink = "mongodb://localhost:27017/mongocross"


// Middelwares
app.use(Cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }))


// Routes
app.use("/messages", validateToken, require("./requests/messageRequest"))


// DataBase connection 
let timeOut = setInterval(() => {
  mongoose.connect(dbLink, { useNewUrlParser: true }, (err) => {
    if (err) {
      console.log("Encountered an error in Db Connection")
    } else {
      console.log("Succesfully connected with DB");
      clearInterval(timeOut)
    }
  })
}, 5000);


// JWT Authenticate only on production
function validateToken(req, res, next) {
    if (environment != "production") return next()

	const token = req.headers["authorization"]
	if (!token)
		return res.status(200).send({ code: "400", status: "Access denied, no authorization token received" });

	 jwt.verify(token, process.env.SECRET, (err, user) => {
		 if (err)
			return res.status(200).send({ code: "400", status: "Access denied, token expired or incorrect" });
		 next()
	 })
}


// Open port
app.listen(port, () => console.log("Listening on port " + port))

// ++++++++++++++++ HTTP METHODS +++++++++++++++++++ //

app.get("/", (req, res) => {
  res.send("Server is up and running! :D")
})

app.get("/messages", async (req, res) => {						//	 B O R R A R
	const messages = await Message.find();						//	 B O R R A R
	res.json(messages);									    	//	 B O R R A R
});

app.get("/delete_messages", async (req, res) => {				//	 B O R R A R
    await Message.deleteMany();					                //	 B O R R A R
	res.json("Mesages deleted");							 //	 B O R R A R
});