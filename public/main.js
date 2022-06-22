const modEditSection = document.querySelector('#mods')
const addMod = document.querySelector('#addModButton')

addMod.addEventListener('click', _ => {
    let forms = modEditSection.getElementsByClassName('addMod')
    let firstForm = forms[0]
    let formClone = firstForm.cloneNode(true)
    modEditSection.appendChild(formClone)
})