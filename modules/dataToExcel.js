const Excel = require('exceljs')

async function writeDataToExcel(data, filePath) {
  try {
    const workbook = new Excel.Workbook()
    const sheetName = 'Sheet1'
    await workbook.xlsx.readFile(filePath)
    const worksheet = workbook.getWorksheet(sheetName)
    worksheet.columns = [
      {header: 'SKU', key: 'sku', width:15},
      {header: 'URL', key: 'url', width:15},
      {header: 'Family', key: 'family', width:15},
      {header: 'Country', key: 'country', width:5},
      {header: 'title', key: 'title', width:40},
      {header: 'subtitle', key: 'subtitle', width:40},
      {header: 'topDescription', key: 'topDescription', width:40},
      {header: 'bottomDescription', key: 'bottomDescription', width:40},
      {header: 'img', key: 'img', width:40},
      {header: 'compatibility', key: 'compatibility', width:40}
    ]
    await data.map((values,idx) => {
      if(values){
        worksheet.addRow({
          sku: values.sku,
          url: values.url,
          family: values.family,
          country: values.country,
          title: values.title,
          subtitle: values.subtitle,
          topDescription: values.topDescription,
          bottomDescription: values.bottomDescription,
          img: values.img,
          compatibility: values.compatibility
        })
      }
    })
    await workbook.xlsx.writeFile(filePath)
    console.log(`File recording is complete! ${data.length} products recorded`)
  } catch (error) {
      console.log(error)
    }
}

module.exports = {
  writeDataToExcel
}