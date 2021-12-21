let puppeteer = {
    waitTime: async function(parameters, page) {
        return new Promise(function(resolve) { 
            setTimeout(function() {
                resolve(`Waited ${parameters.time} ms.`)
            }, parameters.time)
        });
    },
}

module.exports = puppeteer;