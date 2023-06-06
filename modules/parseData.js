import cheerio from 'cheerio'
import axios from "axios"


// todo all parser need to be checked!!!!
export async function getData(url, family, country, partNumber) {
  try {
    let fullUrl = url
    if (!fullUrl.startsWith('http')) {
      fullUrl = `https://${url}`
    }
    const response = await axios.get(fullUrl)
    const $ = cheerio.load(response.data)
    const product = {
      sku: '',
      family: family,
      country: country,
      title: '',
      firstParagraph: '',
      bulletsBlock: [],
      compatibility: [],
      img: ''
    }
//Sku
    product.sku = partNumber
    // switch (country) {
    //   case 'MX-EX':
    //     let dataSku = $('#cntTabsCnt')
    //       .find('.title_emph')
    //       .last()
    //       .parent()
    //       .find('.para_small')
    //       .first()
    //       .text()
    //       .split('# ')
    //     dataSku = dataSku[2].split(' : ')
    //     product.sku = dataSku[dataSku.length - 1]
    // }
    //     break
    //   default:
    //    product.sku = partNumber
//Title
    switch (country) {
      case 'MX-EX':
        product.title = $('#fheader')
          .text()
        break
      default:
        product.title = $('span', '.pg-title')
          .text()
        if (!product.title) {
          product.url = url
          console.log('kurwa mac, no data from url')
          return {
            sku: partNumber, url: url, status: 'error', error: 'Not found'
          }
          // return product
        }
    }
//Img
    switch (country) {
      case 'MX-EX':
        product.img = $('img', '#product_main_image')
          .attr('src')
        break
      default:
        product.img = $('.carousel__slide')
          .find('img')
          .attr('src')
    }
//firstParagraph
    switch (country) {
      case 'MX-EX':
        const dataMx = $('#cntTabsCnt')
          .find('.title_emph')
          .last()
          .parent()
          .find('.para_small')
          .first()
          .html()
          .split('<br>')
        const dataSubtitle = dataMx.filter(empty => empty.length > 1)
        product.firstParagraph = dataSubtitle[0]
        //Top description MX-EX
        if (dataSubtitle.length > 3) product.secondParagraph = dataSubtitle[1]
        break
      default:
        // const data = $('.u-full-width p')
        // 	.first()
        // 	.text()
        // 	.split('  ')
        // product.firstParagraph = data[0]
        // if(!data[0].length) {
        // 	product.firstParagraph = data[1]
        // }
        let firstParagraph = ''
        $('.u-full-width p')
          .contents()
          .each((index, element) => {
            if ($(element).text().trim().length) {
              if ($(element).prop("tagName") === 'STRONG') {
                firstParagraph = `<b>${$(element).text().trim()}</b></br></br>`
              } else {
                firstParagraph += $(element).text().trim()
                return false
              }
            }
          })
        product.firstParagraph = firstParagraph.trim()
    }

// Compatibility
    switch (country) {
      case 'MX-EX':
        $('#cntTabsCnt')
          .find('.point_small')
          .each((i, el) => {
            product.compatibility.push($(el).text())
          })
        break
      default:
        $('li', '#compatibility')
          .each((i, el) => {
            product.compatibility.push($(el)
              .text()
              .trim())
          })
    }

// Second paragraph description
    switch (family) {
      case 'Memory':
        product.secondParagraph = ''
        break
      default:
        let secondParagraph
        $('.u-full-width p')
          .contents()
          .each((index, element) => {
            if ($(element).text().trim().length) {
              secondParagraph = $(element).text().trim()
              if (!product.firstParagraph.includes(secondParagraph)) {
                product.secondParagraph = secondParagraph
                return false
              }
            }
          })

      // const top = $('.u-full-width p')
      // 	.first()
      // 	.text()
      // 	.split('  ')
      // 	.filter(item => {
      // 		!product.subtitle.includes(item)
      // 	})
      // if(top.length > 0) product.topDescription = top.toString()
    }
// Bottom description
    switch (family) {
      case 'Memory':
        product.bulletsBlock = ''
        break
      default:
        switch (country) {
          case 'MX-EX':
            const bottom = []
            $('.para_small', '#cntTabsCnt')
              .first()
              .find('li')
              .each((i, el) => {
                bottom.push($(el).text())
              })
            if (bottom.length > 0) {
              product.bulletsBlock.push(bottom)
            } else {
              product.bulletsBlock = ''
            }
            break
          default:
            //Rich content
            if ($('#accessoriesRichMedia').text()) {
              let content = null
              const richContentOld = $('.ccs-cc-inline-feature-content')
                .first()
                .find('ul')
              const richContentNew = $('.ccs-cc-inline-feature-content')
                .last()
                .find('ul')
              if (richContentOld.length > 0) {
                content = richContentOld
              } else {
                content = richContentNew
              }
              const element = []
              //First bullet
              content
                .first()
                .find('li')
                .each((i, el) => {
                  element.push($(el).text())
                })
              product.bulletsBlock.push(element)
              if (content.last().text() !== content.first().text()) {
                //Title second bullet
                product.bulletsBlock.push(content.last().prev().text())
                //Second bullet
                const element = []
                content
                  .last()
                  .find('li')
                  .each((i, el) => {
                    element.push($(el).text())
                  })
                product.bulletsBlock.push(element)
              }
            } else {
              //Normal content
              let liBulletList = []
              $('.u-full-width')
                .contents()
                .each((index, element) => {
                  // check if the item is list item
                  if ($(element).text().trim().length && $(element).prop('tagName') !== 'STRONG') {

                    let ulBulletsList = []
                    if($(element).prop("tagName")==='LI'){
                      liBulletList.push($(element).text().trim())
                    } else {
                      $(element).children('li').each((idx, subElement) => {
                        ulBulletsList.push($(subElement).text().trim())
                      })
                    }
                    product.bulletsBlock.push(ulBulletsList)
                  }
                  // logic for strong text in bullets
                  else {
                    product.bulletsBlock.push($(element).text().trim())
                  }
                })
              if(liBulletList.length) {
                product.bulletsBlock.push(liBulletList)
              }
            }
        }
    }
    return product
  } catch (error) {
    console.error(error.message)
    console.log('Kurwa mać, no data from url', partNumber)
    return {
      sku: partNumber, url: url, status: 'error', error: error.message
    }
  }
}

