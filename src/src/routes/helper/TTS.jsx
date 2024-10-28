const txtToSpeech = (e, path) => {
    let audio = new Audio(`${process.env.REACT_APP_UPLOAD}audio/${path}`)
    audio.addEventListener("canplaythrough", (event) => {
        audio.play()
        e.target.disabled = true
    })
    audio.addEventListener('ended', () => e.target.disabled = false)
}

export default txtToSpeech