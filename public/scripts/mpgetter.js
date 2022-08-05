const button = document.getElementById('btn')
const search = document.getElementById('editorSearchInputAdd')
const parent = document.getElementById('mpEditorAdd')

button.addEventListener('click', () => {
    window.location = '/mpgetter?' + new URLSearchParams({name: search.value})
})

parent.addEventListener('click', (e) => {
    console.log(e.target)
    if (e.target.matches('span.addButton')) {
        const modpackID = e.target.id.split('-')[1]

        // Fetch mod list from modpackindex
        fetch(`https://www.modpackindex.com/api/v1/modpack/${modpackID}/mods`)
            .then(result => result.json())
            .then((result) => {
                
            })
    }
})

