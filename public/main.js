const signup = document.querySelector('#signup')

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