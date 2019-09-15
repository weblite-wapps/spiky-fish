import req from "superagent"

//user info
let userName = "temp_username"
let wisId = "temp_wisId"
let wappId = "temp_wappId"

const W = window.W

W.setHooks({
  wappWillStart(start) {
    W.loadData().then(({ user: { name } }) => {
      userName = name
      wisId = W.wisId
      wappId = W.wappId
    })

    start()
  }
})

const width = document.body.clientWidth
const height = document.body.getBoundingClientRect().height

const obsNumber = height / 38
let visObsNum = obsNumber / 4

const fps = 60
const deltaTime = 1 / fps

let gAcc = 9.8

let direction = 1

let failure = false

let speedY = 0
let speedX = 3
let score = 0
let playerPosY = height / 5
let playerPosX = width / 2
let playerDim = 30

let leftObstacles = []
let rightObstacles = []
let topObstacles = []

//requests to server

const port = "8080"
const url = "http://localhost:" + port

const getTopScores = () =>
  req
    .get(url + "/getTopScores")
    .query({ wisId })
    .query({ numOfScores: 10 })
    .then(res => JSON.parse(res.text))
    .catch(err => console.log(err))

const insertScore = () =>
  req
    .post(url + "/insertScore")
    .send({ wisId, wappId, userName, score })
    .catch(err => console.log(err))

//

document.getElementById("failText").style.display = "none"

//creating obsticles

for (let i = 0; i < obsNumber; i++) {
  const obs = document.createElement("img")
  obs.className = "rightObs"
  obs.id = i
  obs.style.display = "none"
  obs.style.height = `${20}px`
  obs.style.width = `${30}px`
  obs.style.position = "absolute"
  obs.style.top = `${i * 35 + 35}px`
  obs.style.right = "0"
  obs.src = "/public/spike.png"
  obs.style.transform = "rotate(180deg) translateX(-14px)"
  rightObstacles.push(obs)
  document.body.appendChild(obs)
}

for (let i = 0; i < obsNumber; i++) {
  const obs = document.createElement("img")
  obs.className = "leftObs"
  obs.id = i
  obs.style.display = "none"
  obs.style.height = `${20}px`
  obs.style.width = `${30}px`
  obs.style.position = "absolute"
  obs.style.top = `${i * 35 + 35}px`
  obs.style.left = "0"
  obs.src = "/public/spike.png"
  obs.style.transform = "rotate(0deg) translateX(-14px)"
  leftObstacles.push(obs)
  document.body.appendChild(obs)
}

for (let i = 0; i < width / 30; i++) {
  const obs = document.createElement("img")
  obs.className = "topObs"
  obs.style.display = "inline"
  obs.id = i
  obs.style.height = `${20}px`
  obs.style.width = `${30}px`
  obs.style.position = "absolute"
  obs.style.left = `${i * 35}px`
  obs.style.top = "0"
  obs.src = "/public/spike.png"
  obs.style.transform = "rotate(90deg) translateX(-14px)"
  topObstacles.push(obs)
  document.body.appendChild(obs)
}

//functions

const makeRand = function(max, numOfNumbers) {
  let randNumbers = []
  for (let i = 0; i < numOfNumbers; i++) {
    let rand = Math.floor(Math.random() * Math.floor(max))
    if (randNumbers.includes(rand)) {
      i--
    } else randNumbers.push(rand)
  }
  return randNumbers
}

const makeRightObsVisible = () => {
  let randNumbers = makeRand(obsNumber, visObsNum)
  let num
  let obs
  for (num of randNumbers) {
    rightObstacles[num].style.display = "inline"
  }
  for (obs of leftObstacles) {
    obs.style.display = "none"
  }
}

const makeLeftObsVisible = function() {
  let randNumbers = makeRand(obsNumber, visObsNum)
  let num
  let obs
  for (num of randNumbers) {
    leftObstacles[num].style.display = "inline"
  }
  for (obs of rightObstacles) {
    obs.style.display = "none"
  }
}

const wallCollision = function(x) {
  if (x <= 0) {
    makeRightObsVisible()
    score++
    direction *= -1
    document.getElementById("player").style.transform = `scaleX(${direction})`
    new Audio("/public/score.mp3").play()
  } else if (x >= width - playerDim) {
    makeLeftObsVisible()
    score++
    direction *= -1
    document.getElementById("player").style.transform = `scaleX(${direction})`
    new Audio("/public/score.mp3").play()
    if (score == 10 || score == 36 || score == 70 || score == 100) speedX++
  }
}

const obsCollision = function(x, y) {
  let failed = false
  for (let i = 0; i < leftObstacles.length; i++) {
    if (
      leftObstacles[i].style.display === "inline" &&
      x <= playerDim - 20 &&
      i * 35 + 35 + 5 < y + playerDim / 2 &&
      y + playerDim / 2 < i * 35 + playerDim + 35 - 5
    ) {
      failed = true
      break
    } else if (
      rightObstacles[i].style.display === "inline" &&
      x + playerDim >= width - 30 + 20 &&
      i * 35 + 35 + 5 < y + playerDim / 2 &&
      y + playerDim / 2 < i * 35 + playerDim + 35 - 5
    ) {
      failed = true
      break
    }
  }
  return failed
}

const bubbleMaker = function(x, y) {
  if (direction == 1) x = x - 10
  else x = x + playerDim
  const bubble = document.createElement("div")
  const bubbleContainer = document.createElement("div")
  bubbleContainer.appendChild(bubble)
  bubble.classList.add("bubble-shape")
  bubbleContainer.classList.add("bubble-up")
  bubbleContainer.style.top = y + "px"
  bubbleContainer.style.left = x + "px"
  bubble.classList.add("bubble-shake")
  document.body.appendChild(bubbleContainer)
  setTimeout(() => {
    document.body.removeChild(bubbleContainer)
  }, 1500)
}

//html handling

document.getElementById("failText").addEventListener("click", retryFun)

document.body.addEventListener("click", clickFun)

document.getElementById("scoresButton").addEventListener("click", goToScores)

document
  .getElementById("backButton")
  .addEventListener(
    "click",
    () => (document.getElementById("topScores").style.display = "none")
  )

const failed = function(x, y) {
  if (obsCollision(x, y) || y <= 10 || y >= height - playerDim + 1) {
    speedX = 0
    speedY = 0
    document.getElementById("failText").style.display = "flex"
    document.getElementById("scoresButton").style.display = "flex"
    if (!failure) insertScore()
    failure = true
  }
}

function retryFun() {
  location.reload()
}

function clickFun() {
  if (!failure) {
    speedY = 4
    bubbleMaker(playerPosX, playerPosY)
  }
}

function goToScores() {
  getTopScores().then(scores => {
    for (let i = 0; i < Math.min(scores.length, 10); i++) {
      var el = document.createElement("li")
      var txt = document.createTextNode(
        scores[i].userName + " : " + scores[i].score
      )
      el.appendChild(txt)
      document.getElementById("scoresList").appendChild(el)
    }
    document.getElementById("topScores").style.display = "inline"
  })
}

// Game implementation

const initializePlayer = function(player) {
  player.style.position = "fixed"
  player.style.left = `calc(50% - ${playerDim / 2}px)`
  player.style.top = `${playerPosY - playerDim / 2}px`
}

document.body.addEventListener("keydown", e => {
  if (e.key === " " && !failure) {
    speedY = 4
    bubbleMaker(playerPosX, playerPosY)
  }
})

const player = document.getElementById("player")
initializePlayer(player)

setInterval(function() {
  speedY -= deltaTime * gAcc
  playerPosY -= speedY
  playerPosX -= speedX * direction
  player.style.left = `${playerPosX}px`
  player.style.top = `${playerPosY}px`
  wallCollision(playerPosX)
  failed(playerPosX, playerPosY)
  document.getElementById("score").innerHTML = score
}, 1000 / fps)

setInterval(function() {
  if (visObsNum < obsNumber - 3) visObsNum++
}, 14000)
