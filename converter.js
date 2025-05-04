Object.keys(difficultySettings).forEach(difficulty => {
    if (!!localStorage[difficulty]) {
        const data = localStorage.getItem(difficulty)
		const comp = LZString.compressToEncodedURIComponent(data)
		localStorage.removeItem(difficulty)
		localStorage.setItem(`savedata-${difficulty}`, comp)
    }
})