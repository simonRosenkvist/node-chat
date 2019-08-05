const socket = io()

const chatForm = document.querySelector('#chat-form')
const chatFormInput = chatForm.querySelector('input')
const chatFormButton = chatForm.querySelector('button')
const locationBtn = document.querySelector('#share-location')
const messages = document.querySelector('#messages')

const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sideBarTemplate = document.querySelector('#sidebar-template').innerHTML

const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoScroll = () => {
  const newMessage = messages.lastElementChild

  const newMessageStyles = getComputedStyle(newMessage)
  const newMessageMargin = parseInt(newMessageStyles.marginBottom)
  const newMessageHeight = newMessage.offsetHeight + newMessageMargin
  
  const visibleHeight = messages.offsetHeight
  const containerHeight = messages.scrollHeight
  const scrollOffset = messages.scrollTop + visibleHeight
  if (containerHeight - newMessageHeight <= scrollOffset) {
    messages.scrollTop = messages.scrollHeight
  }
}

socket.on('message', (message) => {
  console.log(message)
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format('HH:mm:SS')
  })
  messages.insertAdjacentHTML('beforeend', html)
  autoScroll()
})

socket.on('locationMessage', (url) => {
  console.log(url)
  const html = Mustache.render(locationTemplate, {
    username,
    url: url.url,
    createdAt: moment(url.createdAt).format('HH:mm:SS')
  })
  messages.insertAdjacentHTML('beforeend', html)
  autoScroll()
})

socket.on('roomData', ({ room, users}) => {
  const html = Mustache.render(sideBarTemplate, {
    room,
    users
  })
  document.querySelector('#sidebar').innerHTML = html
})

chatForm.addEventListener('submit', (e) => {
  e.preventDefault()

  chatFormButton.setAttribute('disabled', 'disabled')

  const message = e.target.elements.message.value

  socket.emit('sendMessage', message, (error) => {
    chatFormButton.removeAttribute('disabled')
    chatFormInput.value = ''
    chatFormInput.focus()

    if (error) {
      return console.log(error)
    }

    console.log('Message delivered!')
  })

})

locationBtn.addEventListener('click', () => {
  if (!navigator.geolocation) {
    return alert('Geolocation is not supported by your browser.')
  }

  locationBtn.setAttribute('disabled', 'disabled')

  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit('sendLocation', {
      lat: position.coords.latitude,
      lon: position.coords.longitude
    }, (locationMessage) => {
      locationBtn.removeAttribute('disabled')
      console.log(locationMessage)
    })
  })
})

socket.emit('join', { username, room }, (error) => {
  if (error) {
    alert(error)
    location.href = '/'
  }
})