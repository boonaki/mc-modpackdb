window.addEventListener("load", function () {
    const login = document.getElementById('login')
    const test = document.querySelector('#test')
    const logout = document.querySelector('#logout')

    //put into cookies to save that they logged in
    let accessToken = ""

    login.addEventListener('submit', (event) => {
        // Stops the default submit action and allows us to perform our own aciton
        event.preventDefault()

        // TODO: Check for accessToken
        if (!accessToken) {

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
                        document.cookie = res.accessToken //saves user access token as a cookie
                        //accessToken = res.accessToken
                    }
                })
            // .then(res => res.redirect('/')) // return to homepage
        } else {
            console.log("already logged in")
        }
    })

    test.addEventListener('click', () => {
        let temp = document.cookie
        fetch('/test', {
            method: 'GET',
            headers: {
                "Authorization": "Bearer " + temp,
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
