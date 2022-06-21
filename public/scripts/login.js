window.addEventListener("load", function () {
    const login = document.getElementById('login')

    login.addEventListener('submit', (event) => {
        event.preventDefault()
        let FD = new FormData(login)

        let data = {
            user: FD.get('user'),
            pass: FD.get('pass')
        }

        fetch('/login', {
            method: 'POST',
            headers: { 'Content-type': 'application/json' },
            body: JSON.stringify(data)
        })
            .then(res => res.json())
            .then((res) => {
                console.log(res)
            })
            .then(window.location.replace('/')) // return to homepage
    })
})