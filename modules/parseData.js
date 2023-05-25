const cheerio = require('cheerio')
const axios = require('axios')

async function getData(url, family, country, partNumber) {
	try {
		const response = await axios.get(url)
		const $ = cheerio.load(response.data)
		const product = {
			sku: '',
			family: family,
			country: country,
			title: '',
			subtitle: '',
			bottomDescription: [],
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
				if( !product.title) {
					product.url = url
					console.log('kurwa mac, no data from url')
					return product
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
//Subtitle
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
				product.subtitle = dataSubtitle[ 0 ]
				//Top description MX-EX
				if(dataSubtitle.length > 3) product.topDescription = dataSubtitle[ 1 ]
				break
			default:
				const data = $('.u-full-width p')
					.first()
					.text()
					.split('  ')
				product.subtitle = data[ 0 ]
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

// Top description
		switch (family) {
			case 'Memory':
				product.topDescription = ''
				break
			default:
				const top = $('.u-full-width p')
					.first()
					.text()
					.split('  ')
					.filter(item => !product.subtitle.includes(item))
				if(top.length > 0) product.topDescription = top.toString()
		}
// Bottom description
		switch (family) {
			case 'Memory':
				product.bottomDescription = ''
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
						if(bottom.length > 0) {
							product.bottomDescription.push(bottom)
						} else {
							product.bottomDescription = ''
						}
						break
					default:
						//Rich content
						if($('#accessoriesRichMedia').text()) {
							let content = null
							const richContentOld = $('.ccs-cc-inline-feature-content')
								.first()
								.find('ul')
							const richContentNew = $('.ccs-cc-inline-feature-content')
								.last()
								.find('ul')
							if(richContentOld.length > 0) {
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
							product.bottomDescription.push(element)
							if(content.last().text() !== content.first().text()) {
								//Title second bullet
								product.bottomDescription.push(content.last().prev().text())
								//Second bullet
								const element = []
								content
									.last()
									.find('li')
									.each((i, el) => {
										element.push($(el).text())
									})
								product.bottomDescription.push(element)
							}
						} else {
							//Normal content
							//First bullet
							let list1 = []
							$('ul', '#overview_section')
								.first()
								.find('li')
								.each((i, el) => {
									list1.push($(el).text())
								})
							product.bottomDescription.push(list1)
							//Title bullet
							const title = $('ul', '#overview_section').last().prev().text()
							if(title) {
								product.bottomDescription.push(title)
							}
							//Second bullet
							let list2 = []
							$('ul', '#overview_section')
								.last()
								.find('li')
								.each((i, el) => {
									list2.push($(el).text())
								})
							list2 = list2.filter(item => !list1.includes(item))
							if(list2.length > 0) {
								product.bottomDescription.push(list2)
							}
						}
				}
		}
		return product
	} catch (error) {
		console.log(error.message)
		console.log('Kurwa mać, no data from url')
		return {
			sku: partNumber, url: url
		}
	}
}

module.exports = {getData}