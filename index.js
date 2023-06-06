import path from "path"
import fs from "fs-extra"
import xlsx from 'xlsx'

import { queueSettings } from "./modules/queue.js"
import { readInput } from "./modules/getUrlModules.js"
import * as template from './data/templates/template.js'
import { dataToJson } from "./modules/doOutputJson.js"
import { getData } from "./modules/parseData.js"

const result = []

async function main(product) {
  try {
    const parsedData = await getData(product.dellProductLink, product.family, product.country, product.partNumber)
    if('error' in parsedData){
      result.push(parsedData)
      console.log(parsedData.sku, 'is absent')
    } else {
      const snippet = product.snippet
      const templateData = template[snippet][product.country.toLowerCase()]
      const outputJson = await dataToJson(product, templateData, parsedData, snippet)
      const output = JSON.stringify(outputJson, null, 2)
      await fs.writeFile(`${path.resolve('./data/output')}/${product.partNumber}.json`, output, 'utf8')
      result.push({
        sku: product.partNumber,
        url: product.dellProductLink,
        status: 'JSON is created'
      })
    }

  } catch (e) {
    console.error(e)
  } finally {
    await writeResult(result)
  }
}

async function writeResult(errors) {
  const workBook = xlsx.utils.book_new()
  const workSheet = xlsx.utils.json_to_sheet(errors)
  xlsx.utils.book_append_sheet(workBook, workSheet, 'report')
  xlsx.writeFile(workBook, './data/report/report.xlsx')
  console.log('report is created')
}

async function start() {
  try {
    const queue = queueSettings()
    const files = await fs.readdir(path.resolve('./data/input'))
    for (const inputFilePath of files) {
      if (path.extname(inputFilePath) === '.xlsx') {
        const products = readInput(`${path.resolve('./data/input')}/${inputFilePath}`)
        for (const product of products) {
          queue.add(() => main(product))
        }
      }
    }
  } catch (e) {
    console.error(e)

  }
}

start()
