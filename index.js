import path from "path"
import fs from "fs-extra"
import xlsx from 'xlsx'

import { queueSettings } from "./modules/queue.js"
import { readInput } from "./modules/getUrlModules.js"
import * as template from './templates/template.js'
import { getData } from "./modules/parseData.js"

const result = []

async function main(product) {
  try {
    const parsedData = await getData(product.dellProductLink, product.family, product.country, product.partNumber)
    if ('error' in parsedData) {
      result.push(parsedData)
      console.log(parsedData.sku, 'is absent')
    } else {
      // hdd    #1, 2, 4, 9, 13
      // memory #1, 2, 4, 8
      // cpu    #1, 2, 4, 9, 10
      const snippet = product.snippet
      const translation = template.translations[product.country.toLowerCase()]
      const compatibility = `${translation.compatibilityString}<br>${parsedData.compatibility}`
      const data = template.generalData
      data.lang = product.language.toLowerCase()
      data.link = product.dellProductLink
      data.mpn = product.partNumber
      data.components = template[snippet][product.country.toLowerCase()]
      // 1
      data.components.component_1.data.text.value = `<h3>${parsedData.h1Text}</h3>`
      // 2
      data.components.component_2.data.text.value = `<p>${translation.partString} ${product.partNumber}</p><br><p>${parsedData.topText}</p>`
      data.components.component_2.data.image.value = parsedData.imgSrc
      // 4
      data.components.component_4.data.image.value = parsedData.imgSrc
      switch (snippet){
        case 'hdd':
          if(parsedData.compatibility) data.components.component_9.data.text.value = compatibility
          else delete data.components.component_9
          data.components.component_13.data.text.value = parsedData.bottomText
          break
        case 'memory':
          if(parsedData.compatibility) data.components.component_8.data.text.value = compatibility
          else delete data.components.component_8
          break
        case 'netwProc':
          if(parsedData.compatibility) data.components.component_9.data.text.value = compatibility
          else delete data.components.component_9
          data.components.component_10.data.text.value = parsedData.bottomText
          break
      }
      const output = JSON.stringify(data, null, 2)
      await fs.writeFile(`${path.resolve('./output')}/${product.partNumber}_${product.language.toLowerCase()}.json`, output, 'utf8')
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
    const files = await fs.readdir(path.resolve('./input'))
    for (const inputFilePath of files) {
      if (path.extname(inputFilePath) === '.xlsx') {
        const products = readInput(`${path.resolve('./input')}/${inputFilePath}`)
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
