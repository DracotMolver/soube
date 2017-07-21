/**
 * @author Diego Alberto Molina Vera
 * @copyright 2016 - 2017
 */
/* --------------------------------- Functions --------------------------------- */
// Check if there's a new version to download.
// Will return 'major' if there's a new version or 'same' if it's the same version
module.exports = function (net, version, fn) {
    const request = new net.ClientRequest({
        method: 'GET',
        protocol: 'https:',
        hostname: 'api.github.com',
        path: '/repos/dracotmolver/soube/releases/latest',
        headers: {
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:51.0) Gecko/20100101 Firefox/51.0'
        }
    })

    //   request.chunkedEncoding = true
    request.on('response', function (response) {
        var data;
        response.on('data', function (chunk) {
            data += chunk
        }).on('end', function () {
            console.log('end', data)
        })

        //     // var data = ''
        //     // response.on('end', function () {
        //     // console.log(data)
        //     //     const diff = function (b, c) {
        //     //       let val = false
        //     //       for (var i = 0, s = c.length; i < s; i++) {
        //     //         if (parseInt(c[i]) > parseInt(b[i])) {
        //     //           val = true
        //     //           break
        //     //         }
        //     //       }
        //     //       return val
        //     //     }
        //     //     console.log(diff)
        //     //     fn(diff(version.split('.'), JSON.parse(data).tag_name.split('.')) ? 'major' : 'same')
        //     // })
    }).on('error', function () {
        console.log('error')
    })

    request.end()
}