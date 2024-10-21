import * as cheerio from 'cheerio'
import axios from "axios"


export async function getData(url, family, country, partNumber) {
  try {
    let fullUrl = url
    if (!fullUrl.startsWith('http')) {
      fullUrl = `https://${url}`
    }
    const response = await axios.get(fullUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
      }
    })
    const $ = await cheerio.load(response.data)
    const imgSrc = $('div#heroImage .carousel__slide img').attr('src')
    const h1Text = $('.pg-title h1 span').text()
    const compatibilityList = ['<ul>']
    $('ul.dds__list li text').each((i, el) => {
      if ($(el).text()) compatibilityList.push(`<li>${$(el).text()}</li>`)
    })
    compatibilityList.push('</ul>')

    const fullWidthDivs = $('#overview_section div.u-full-width')
    const textHtmlArr = []
    fullWidthDivs.each((i, div) => {
      const clonedDiv = $(div).clone()
      clonedDiv.find('*').each((j, elem) => {

        if (elem.tagName === 'strong') {
          elem.tagName = 'b'
        }
        const hasContent = $(elem).text().trim() !== '' || $(elem).children().length > 0
        if (!hasContent && elem.tagName.toLowerCase() !== 'br') {
          $(elem).remove()
        } else {
          elem.attribs = {}
        }
      })
      textHtmlArr.push(clonedDiv.html())
    })
    let compatibility = ''
    if (compatibilityList.length > 2) {
      compatibility = compatibilityList.join('\n')
    }
    const bottomText = textHtmlArr.join('\n').replace('<br><br><', '<')
    let topText = textHtmlArr[0]
    const match = bottomText.match(/>(.*?)</s)
    if (match) {
      topText = `<p>${match[1].trim()}</p>`
    }
    // console.log('image:\n', imgSrc)
    // console.log('title:\n', h1Text)
    // console.log('compatibility\n', compatibility)
    // console.log('all text\n', bottomText)
    // console.log('top text\n', topText)

    return { imgSrc, h1Text, topText, compatibility, bottomText }

  } catch
    (error) {
    console.error('Error:', partNumber, ' - ', error.message)
    return {
      sku: partNumber, url: url, status: 'error', error: error.message
    }
  }
}

