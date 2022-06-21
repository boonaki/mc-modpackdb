const login = document.querySelector('login')
const signup = document.querySelector('#signup')

login.addEventListener('submit', (event) => {
    event.preventDefault()

    let data = {
        user: 'admin',
        pass: 'password'
    }

    console.log(data)
    
    fetch('/login', {
        method: 'POST',
        headers: {'Content-type': 'application/json'},
        body: JSON.stringify(data)
    })
        .then(res => res.json())
        .then((res) => {
            console.log(res)
        })
})

signup.addEventListener('click', _ => {
    let data = {
        user: 'admin',
        pass: 'password'
    }
    
    fetch('/signup', {
        method: 'POST',
        headers: {'Content-type': 'application/json'},
        body: JSON.stringify(data)
    })
        .then(res => res.json())
        .then((res) => {
            console.log(res)
        })
})