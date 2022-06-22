window.addEventListener("load", function () {
    const login = document.getElementById('login')
    const test = document.querySelector('#test')
    const logout = document.querySelector('#logout')

    let accessToken = ""

    login.addEventListener('submit', (event) => {
        // Stops the default submit action and allows us to perform our own aciton
        event.preventDefault()

        // TODO: Check for accessToken and refreshToken cookies
        if (accessToken === "") {

            // Saves the data from the form into FD
            let FD = new FormData(login)

            // Creates the JSON data from FD
            let data = {
                user: FD.get('user'),
                pass: FD.get('pass')
            }

            // Makes the fetch request to server
            fetch('/login', {
                method: 'POST',
                headers: { 'Content-type': 'application/json' },
                body: JSON.stringify(data)
            })
                .then(res => res.json())
                .then((res) => {
                    console.log(res, res.statusCode)
                    if (res.status == 200) {
                        accessToken = res.accessToken // probably save as cookie or local storage or something
                    }
                })
            // .then(res => res.redirect('/')) // return to homepage
        } else {
            console.log("already logged in")
        }
    })

    test.addEventListener('click', () => {
        fetch('/test', {
            method: 'GET',
            headers: {
                "Authorization": "Bearer " + accessToken,
                "Content-type": "application/json"
            }
        })
            .then(res => res.json())
            .then((res) => {
                console.log(res)
            })
    })

    logout.addEventListener('click', () => {
        // delete access token cookie
    })
})
