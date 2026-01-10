var totalMember = 0
var member = []
var resultTest = []
const config = {
  totalMember,
  memberNumber: member,
  nhat: 1,
  nhi: 2,
  ba: 3,
  khuyenkhich: 5,
}
var nhatResult = []
var nhiResult = []
var baResult = []
var khuyenkhichResult = []

reset()
function appearResult(typeGift) {
  let timeOut = 1000
  switch (typeGift) {
    case 'nhat':
      timeOut = 8000
      break
    case 'nhi':
      timeOut = 5000
      break
    case 'ba':
      timeOut = 4000
      break
    case 'khuyenkhich':
      timeOut = 3000
      break
  }
  $('.palette .color').each(function (i, e) {
    setTimeout(function () {
      $(e).addClass('in')
      $(e).addClass('bg-frame' + getSTT(typeGift))
      spanValue = e.querySelector('span')
      const dataValue = parseInt($(e).attr('data-value'))
      animateValue(spanValue, dataValue + 100, dataValue, timeOut) //3 5 7 10
    }, i * timeOut)
  })
}

function createArrayByNumber(soLuong) {
  var mang = []
  for (var i = 1; i <= soLuong; i++) {
    mang.push(i)
  }
  return mang
}

// Modified to only use checked-in participants
function reset() {
  // Fetch only checked-in IDs from API
  fetch('/api/checked-in-ids')
    .then((response) => response.json())
    .then((data) => {
      if (data.ids && data.ids.length > 0) {
        totalMember = data.totalMembers || data.ids.length
        member = data.ids // Use the actual IDs array directly
        config.totalMember = totalMember
        console.log('Member IDs fetched:', member)

        // Update prize amounts
        config.nhat = 1
        $(`#amount-nhat`).text(config.nhat)
        $(`#amount-nhi`).text(config.nhi)
        $(`#amount-ba`).text(config.ba)
        $(`#amount-khuyenkhich`).text(config.khuyenkhich)

        console.log('Checked-in members loaded:', totalMember)
      } else {
        console.log('No checked-in participants found')
        totalMember = 0
        member = []
        config.totalMember = 0
      }
    })
    .catch((error) => {
      console.error('Error loading checked-in IDs:', error)
      // Don't proceed with lucky draw if we can't get data
      totalMember = 0
      member = []
      config.totalMember = 0
      console.log('Cannot proceed with lucky draw - database connection failed')
    })
}

function getRandomAndRemove(numberOfRandoms) {
  var result = []

  for (var i = 0; i < numberOfRandoms; i++) {
    if (member.length === 0) {
      break
    }
    var randomIndex = Math.floor(Math.random() * member.length)
    result.push(member[randomIndex])
    member = member.filter((m) => m != member[randomIndex])
  }
  return result
}

function animateValue(obj, start, end, duration) {
  const startTime = Date.now()

  const updateValue = () => {
    const currentTime = Date.now()
    const elapsedTime = currentTime - startTime

    if (elapsedTime >= duration) {
      obj.innerHTML = end
    } else {
      const randomValue = Math.floor(Math.random() * (end - start + 1) + start)
      obj.innerHTML = randomValue
      requestAnimationFrame(updateValue)
    }
  }

  requestAnimationFrame(updateValue)
}

function renderResult(numberOfRandoms, typeGift) {
  const results = getRandomAndRemove(numberOfRandoms)
  addToResult(results, typeGift)
  const paletteResult = $('#palette-result')
  paletteResult.empty()
  results.forEach((result) => {
    const colorDiv = $('<div>').addClass('color').attr('data-value', result)
    const spanNumber = $('<span>').text(result)
    colorDiv.append(spanNumber)
    paletteResult.append(colorDiv)
  })
  appearResult(typeGift)
}

function bookGift(element) {
  const typeGift = $(element).attr('data-tpe')
  let resultToRender = 0
  let ribbonSrc = 1

  switch (typeGift) {
    case 'nhat':
      resultToRender = Math.min(config.nhat, 1)
      ribbonSrc = 1
      break
    case 'nhi':
      resultToRender = Math.min(config.nhi, 2)
      ribbonSrc = 2
      break
    case 'ba':
      resultToRender = Math.min(config.ba, 3)
      ribbonSrc = 3
      break
    case 'khuyenkhich':
      resultToRender = Math.min(config.khuyenkhich, 5)
      ribbonSrc = 4
      break
  }
  resultToRender = Math.min(resultToRender, member.length)
  if (config[typeGift] == 0 || resultToRender == 0) {
    $(`#amount-${typeGift}`)
      .attr('data-toggle', 'modal')
      .attr('data-target', '#exampleModal')
  }
  config[typeGift] = config[typeGift] - resultToRender

  $(`#amount-${typeGift}`).text(config[typeGift])
  renderResult(resultToRender, typeGift)
  setRibbon(ribbonSrc)
  $('.footer').css({
    top: 'auto',
    bottom: '0',
    left: '50%',
    transform: 'translateX(-50%)',
  })
}

function getSTT(typeGift) {
  switch (typeGift) {
    case 'nhat':
      return 1
    case 'nhi':
      return 2
    case 'ba':
      return 3
    case 'khuyenkhich':
      return 4
  }
}

function setRibbon(number) {
  $('#ribbon-img').attr('src', `./assets/ribbon/ribbon${number}.png`).show()
}

function addToResult(result, typeGift) {
  if (result && result.length > 0) {
    switch (typeGift) {
      case 'nhat':
        nhatResult.push(result)
        break
      case 'nhi':
        nhiResult.push(result)
        break
      case 'ba':
        baResult.push(result)
        break
      case 'khuyenkhich':
        khuyenkhichResult.push(result)
        break
    }
  }
}
function renderResultLatest(typeGift) {
  const modalBody = $('.modal-body')
  modalBody.empty()
  let result = []
  switch (typeGift) {
    case 'nhat':
      result = nhatResult
      break
    case 'nhi':
      result = nhiResult
      break
    case 'ba':
      result = baResult
      break
    case 'khuyenkhich':
      result = khuyenkhichResult
      break
  }
  if (result && result.length > 0) {
    result.forEach((row, rowIndex) => {
      const resultRow = $("<div class='row'></div>")

      row.forEach((col, colIndex) => {
        const resultCol = $(`<div class='number-result col'>${col}</div>`)
        resultRow.append(resultCol)
      })

      modalBody.append(resultRow)
    })
  }
}

function renderSelectedPrizeResults(prizeId) {
  const typeGift = $(`#${prizeId}`).attr('data-tpe')
  let result = []
  switch (typeGift) {
    case 'nhat':
      result = nhatResult
      break
    case 'nhi':
      result = nhiResult
      break
    case 'ba':
      result = baResult
      break
    case 'khuyenkhich':
      result = khuyenkhichResult
      break
  }

  if (result && result.length > 0) {
    const paletteResult = $('#palette-result')
    paletteResult.empty()

    // Flatten all results and render them
    const allNumbers = result.flat()
    allNumbers.forEach((number) => {
      const colorDiv = $('<div>')
        .addClass('color in bg-frame' + getSTT(typeGift))
        .attr('data-value', number)
      const spanNumber = $('<span>').text(number)
      colorDiv.append(spanNumber)
      paletteResult.append(colorDiv)
    })

    // Set ribbon and footer position
    setRibbon(getSTT(typeGift))
    $('.footer').css({
      top: 'auto',
      bottom: '0',
      left: '50%',
      transform: 'translateX(-50%)',
    })
  }
}
