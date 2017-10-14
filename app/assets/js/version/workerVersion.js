/**
 * @module assets/version/index.js
 * @author Diego Alberto Molina Vera
 * @copyright 2016 - 2017
 * @license MIT License
 *
 * Check if there's a new version to download.
 * Will return 'major' if there's a new version or 'same' if it's the same version
 */

 /* -=================================== Modules ===================================- */
const https = require('https');

/* -=================================== Functions ===================================- */
this.onmessage = e => {
    'use strict'

    https.get({
        host: 'api.github.com',
        path: '/repos/dracotmolver/soube/releases/latest',
        headers: {
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:51.0) Gecko/20100101 Firefox/51.0'
        }
    }, res => {
        let data = ''
        res.setEncoding('utf8')
            .on('data', d => data += d)
            .on('end', () => {
                const actualVersion = e.data.version.split('.');
                const newVersion = JSON.parse(data).tag_name.split('.');

                function diff(b, c) {
                    let val = false
                    for (var i = 0, s = c.length; i < s; i++) {
                        if (parseInt(c[i]) > parseInt(b[i])) {
                            val = true
                            break
                        }
                    }

                    return val
                };

                postMessage({
                    version: diff(actualVersion, newVersion) ? 'major' : 'same'
                })
            });
    }).on('error', er => {
        console.log('err', er)
    }).end()
}
