const XLSX = require("xlsx")

function getFamily(family) {
  const familyGrope = {
    ['Hard drive']:['HDD SAS','HDD SATA','LTO','SSD NvME','SSD SAS','SSD SATA','Optical Drive'],
    ['Networking and Processor']: ['Networking','Optics','GPU','CPU','Accessories'],
    ['Memory']: ['Memory']
  }
  const keys = Object.keys(familyGrope)
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    const values = familyGrope[key]
    if (values.includes(family)) {
      return key
    }
  }
}
function getDataList(filePath) {
  const workbook = XLSX.readFile(filePath)
  const data =  XLSX.utils.sheet_to_json(workbook.Sheets['Лист1']||workbook.Sheets['Sheet1'])
  const collection = []
  for (let i = 0; i < data.length; i++) {
    const {['Part Number']: partNumber,
          ['Dell Product Link']: dellProductLink,
          ['Country'] :country } = data[i]
    const family = getFamily(data[i]['Family'])
    collection.push({family, partNumber, dellProductLink, country })
  }
  return collection
}

module.exports = {
  getDataList
}