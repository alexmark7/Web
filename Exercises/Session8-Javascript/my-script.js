const msg = "hello world"

// string
let color = "pink"

// number
let dwards = 7.8

// boolean
let fun = true

// null
let pet = null

function add(a,b){
    return a + b
}

let add = (a,b) => a + b


let result = add(2,2)

console.log(msg)
console.log(result)


let person = {
    name: John,
    age: 50,
    speak: function() {
        console.log("Hello")
    }
}

person.isMarried = true

person.speak()

console.log(person.name)
console.log(person)

console.log(new Date().getHours().getMonth()+1)

let hobby1 = "photography"
let hobby2 = "programming"

let hobbies = ["photography", "programming"]

console.log(hobbies[1])


for (let i = 1; i <= 10 ; i++) {
    console.log(i)
}

let i = 0

while(i <= 10){
    console.log(i)
    i++
}


let fruits = ["apple", "banana", "cherry"]

for (const fruit of fruits){
    console.log(fruit)
}