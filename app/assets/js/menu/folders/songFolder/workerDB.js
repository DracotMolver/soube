this.onmessage = e => {
    if (e.data.state === 'open')
        postMessage({ state: 'next' })
    else if (e.data.state === 'done')
        postMessage({ state: 'stop' })
}