import * as cheerio from 'cheerio'
import axios from "axios"
import JSON5 from 'json5'

export async function getData(url, family, country, partNumber) {
  try {
    let fullUrl = url
    if (!fullUrl.startsWith('http')) {
      fullUrl = `https://${url}`
    }
    const headers = {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36'
    }
    if (fullUrl.includes('cnetcontentcast')) {
      const urlObj = new URL(fullUrl)
      const params = new URLSearchParams(urlObj.search)
      let paramStr = ''
      params.forEach((value, key) => {
        if (key !== 'width') {
          if (key === 'mfr') {
            paramStr += `mf=${value}&`
          } else if (key === 'width') {
            console.log('width', value)
          } else if (key === 'locale') {
            paramStr += `lang=${value}&`
          } else paramStr += `${key}=${value}&`
        }
      })
      const response = await axios.get(`https://ws.cs.1worldsync.com/ca9d0f5f/script/b034595d62?${paramStr}host=demo.cnetcontentcast.com&nld=1`)
      const match = response.data.match(/window\["ccs_cc_loadQueue"\].push\((\{.*\})\);/s)
      if (match) {
        const jsonString = match[1]

        const parsedResponse = JSON5.parse(jsonString)
        const htmlBlocksArr = parsedResponse['htmlBlocks']
        const html = htmlBlocksArr.map(block => block['html']).join('')
        const $ = await cheerio.load(html)
        const imgSrc = $('div.ccs-cc-inline-header-hero img').attr('src') || $('a.ccs-cc-inline-thumbnail-image').attr('data-url')
        const h1Text = $('h2.ccs-cc-inline-section-title').first().text() || $('div.ccs-cc-inline-feature-content.ccs-cc-inline-feature-description h3').first().text()
        const bottomTextElement = $('div.ccs-cc-inline-feature[data-type="text"] div.ccs-cc-inline-feature-content').last()
        bottomTextElement.find('sup').each(function () {
          $(this).replaceWith($(this).html())
        })
        let bottomText = bottomTextElement.html().replace(/<!--/gm, '')
          .replace(/-->/gm, '')
          .trim()
        let topText = ''
        bottomTextElement
          .last()
          .find('*') // Ищем все элементы внутри контейнера
          .addBack() // Добавляем и сам контейнер для проверки его текста
          .contents() // Извлекаем все дочерние элементы (включая текстовые узлы)
          .each(function () {
            // Если нода текстовая (nodeType === 3) и не пустая
            if (this.nodeType === 3 && this.nodeValue.trim() !== '') {
              // Добавляем текст в topText
              topText += this.nodeValue.trim() + ' '
            } else if (this.nodeType !== 3 && topText !== '') {
              // Как только встретили не текстовую ноду, останавливаемся
              return false
            }
          })
        topText = `<p>${topText.replace(/ ®/gm, '®').trim()}</p>`
        bottomTextElement.remove()

        let compatibility = ''
        const compatibilityHtml = $('div.ccs-cc-inline-feature[data-type="text"] div.ccs-cc-inline-feature-content ul').filter(function () {
          return Object.keys($(this).attr()).length === 0
        }).html()
        if (compatibilityHtml) {
          compatibility = `<ul>${compatibilityHtml}</ul>`
        }

        return { imgSrc, h1Text, topText, compatibility, bottomText }
      }
    } else {
      const response = await axios.get(fullUrl, {
        headers
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
          if (elem.tagName.toLowerCase() === 'sup') {
            $(elem).replaceWith($(elem).html()) // Заменяем <sup> его содержимым
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
      const bottomText = textHtmlArr.join('<br>').replace('<br><br><', '<')
      let topText = textHtmlArr[0]
      const match = bottomText.match(/>(.*?)</s)
      if (match) {
        topText = `<p>${match[1].trim()}</p>`
      }
      // console.log('image:\n', imgSrc)
      // console.log('title:\n', h1Text)
      // console.log('compatibility\n', compatibility)
      // console.log('top text\n', topText)

      return { imgSrc, h1Text, topText, compatibility, bottomText }
    }


  } catch
    (error) {
    console.error('Error:', partNumber, ' - ', error.message)
    return {
      sku: partNumber, url: url, status: 'error', error: error.message
    }
  }
}

