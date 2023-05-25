const getUrl = require('./modules/getUrlModules')
const parse = require('./modules/parseData')
const addData = require('./modules/dataToExcel')
const parsingData1 = 'data/data_for_parse/Batch1_14032023-ICECAT EMEA-ES.xlsx'
const parsingData2 = 'data/data_for_parse/Batch2_14032023-ICECAT EMEA-ES.xlsx'
const parsingData3 = 'data/data_for_parse/Batch3_14032023-ICECAT EMEA-ES.xlsx'
const parsingData4 = 'data/data_for_parse/Batch4_14032023-ICECAT EMEA-ES.xlsx'
const recordData = 'data/recordData.xlsx'

async function parseDell(parsingData, recordData) {
  const data = getUrl.getDataList(parsingData)
  const productData = []
  for (const elem of data) {
    // productData.push(await parse.getData(elem.dellProductLink, elem.family, 'MX-EX', elem.partNumber))
    productData.push(await parse.getData(elem.dellProductLink, elem.family, elem.country, elem.partNumber))
  }
  console.log(productData.length)
  await addData.writeDataToExcel(productData, recordData)
}

parseDell(parsingData1, recordData)
parseDell(parsingData2, recordData)
parseDell(parsingData3, recordData)
parseDell(parsingData4, recordData)

