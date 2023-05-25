const cheerio = require('cheerio')
const axios = require('axios')

class Parser {
    constructor() {
        this.product = {
            sku: ''
        }
    }

    async getData(url) {
        //initCheerio
        try{
            const response = await axios.get(url)
            if(response.status === 200)
            const $ = cheerio.load(response.data)

            //Sku
            let dataSku = $('#cntTabsCnt').find('.title_emph').last().parent().find('.para_small').first().text().split('# ')
            dataSku = dataSku[2].split(' : ')
            this.product.sku = dataSku[dataSku.length - 1]
            console.log(`Product num ${this.product.sku} : `, this.product.sku)
            return this.product
        } catch (error) {
            console.error(`Error loading URL: ${url}`, error)
            throw error
        }
    }
}

module.exports = new Parser()