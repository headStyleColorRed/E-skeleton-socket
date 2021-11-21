let member = {
    name: "Rodrigo",
    age: 29
}
let member2 = {
    name: "Ana",
    age: 28
}

let chatrooms = new Object()

chatrooms["1234"] = [member]


chatrooms["1234"].push(member2)

console.log(chatrooms);