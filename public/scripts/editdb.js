let logoutEJS = document.querySelector('#logoutEditor')
let loginEJS = document.querySelector('#loginEditor')
let dropbtn = document.querySelector('.dropbtn')
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
            dropbtn.innerHTML = res.user.name
        })
} else {
    logoutEJS.classList.add('hidden')
    loginEJS.classList.remove('hidden')
}

logoutEJS.addEventListener('click', () => {
    if (!document.cookie) {
        alert('not logged in')
        return
    }
    let cookies = document.cookie.split(";");
    for (var i = 0; i < cookies.length; i++) {
        let spcook = cookies[i].split("=");
        deleteCookie(spcook[0]);
        dropbtn.innerHTML = 'USER'
        logoutEJS.classList.add('hidden')
        loginEJS.classList.remove('hidden')
    }

    function deleteCookie(cookiename) {
        let d = new Date();
        d.setDate(d.getDate() - 1);
        let expires = ";expires=" + d;
        let name = cookiename;
        //alert(name);
        let value = "";
        document.cookie = name + "=" + value + expires + "; path=/";
    }
    window.location = '/info'
})

/**** QUERY SEARCHING ****/

const button = document.getElementById('searchBtn')
const search = document.getElementById('editorSearchInputAdd')

button.addEventListener('click', () => {
    window.location = '/tempeditor?' + new URLSearchParams({ name: search.value })
})

/**** ADDING MODPACKS ****/

const addingUL = document.getElementById('mpEditorAdd')

addingUL.addEventListener('click', (e) => {
    if (e.target.matches('span.addButton')) {
        const modpackID = e.target.id.split('-')[1]
        fetch(`/retrievemp/${modpackID}`)
            .then(result => result.json())
            .then((result) => {
                console.log(result)
                if(result.length > 0){
                    fetch(`/showMP/${modpackID}`, {
                        method : 'PUT'
                    })
                        .then((status) => {
                            console.log("success")
                        })
                        .catch(err => console.error(err))
                }else{
                    fetch(`/addMP/${modpackID}`)
                        .then(res => res.json())
                        .then((res) => {
                            fetch('/editor', {
                                method: 'POST',
                                headers: { 'Content-type': 'application/json', 'Authorization' : "Bearer " + document.cookie, },
                                body : JSON.stringify(res)
                            })
                                .then(status => {
                                    if(status.ok) return status.json()
                                })
                                .catch(err => console.error(err))
                                
                        })
                        .catch(err => console.error(err))
                }
            })
    }
})

/**** HIDE MODPACKS ****/

const removeUL = document.getElementById('mpEditorRemove')

removeUL.addEventListener('click', (e) => {
    if(e.target.matches('span.hideButton')){
        const modpackID = e.target.id.split('-')[1]
        fetch(`/hideMP/${modpackID}`, {
            method : 'PUT'
        })
            .catch(err => console.error(err))
    }
})