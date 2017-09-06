this.onmessage = function (e) {
    if (e.data.state === 'open')
        postMessage({ state: 'next' })
    else (e.data.state === 'done')
        postMessage({ state: 'stop' })
}