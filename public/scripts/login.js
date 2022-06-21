window.addEventListener("load", function () {
    const login = document.getElementById('login')

    login.addEventListener('submit', (event) => {
        // Stops the default submit action and allows us to perform our own aciton
        event.preventDefault()
        
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
                console.log(res)
            })
            .then(window.location.replace('/')) // return to homepage
    })
})
