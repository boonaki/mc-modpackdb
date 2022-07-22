
//check if there is a cookie
//if there is, make fetch with cookie in body

let data = { 'cookie': document.cookie }

if (document.cookie) {
    fetch('/info', {
        method: 'POST',
        headers: { 'Content-type': 'application/json' },
        body: JSON.stringify(data)
    })
        .then(res => res.json())
        .then((res) => {
            // document.getElementById('indexUserInfo').innerHTML = res.user.name
        })
}

