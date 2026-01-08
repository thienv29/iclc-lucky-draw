$(document).ready(function () {
  var selectedPrize = null
  function exportResultsToCSV() {
    const allResults = [
      { name: 'Nhất', data: nhatResult },
      { name: 'Nhì', data: nhiResult },
      { name: 'Ba', data: baResult },
      { name: 'Khuyến khích', data: khuyenkhichResult },
    ]

    let csvContent = ''

    allResults.forEach((result) => {
      const rows = result.data.map((row) => row.join(',')).join('\n')
      csvContent += `${result.name}\n${rows}\n\n`
    })

    // Create a blob with the CSV content and create a download link
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const link = document.createElement('a')
    link.href = window.URL.createObjectURL(blob)
    link.download = 'results.csv'
    link.click()
  }
  // video
  var video = $('#intro-video')
  if (video.length) {
    video.on('ended', function () {
      jQuery('.intro').fadeOut(1000, function () {
        jQuery(this).remove() // Xóa phần tử sau khi hiệu ứng fadeOut hoàn thành
      })
    })
  }
  // Function to hide all gift divs
  function hideAllGifts() {
    $('.prize').hide()
  }
  function showAllGifts() {
    $('.prize').show()
    $('.footer').css({
      top: '50%',
      bottom: 'auto',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    })
    emptyResult()
    $('#ribbon-img').hide()
  }
  // Function to show the specified gift div9
  function showGift(giftType) {
    hideAllGifts() // Hide all gifts first
    $('#' + giftType).show()
  }
  function emptyResult() {
    const paletteResult = $('#palette-result')
    paletteResult.empty()
  }

  // Event listener for key press
  $(document).keydown(function (event) {
    if (event.key == '0') {
      const audio = $('#myAudio')[0]
      if (audio.paused) {
        audio.play()
      } else {
        audio.pause()
      }
    }
    if (event.key == '9') {
      const audio = $('#myAudio2')[0]
      if (audio.paused) {
        audio.play()
      } else {
        audio.pause()
      }
    }
    if (event.key == '8') {
      if (video[0].paused) {
        video[0].play()
      } else {
        video[0].pause()
      }
    }
    if (event.key == 'n' || event.key == 'N') {
      video[0].pause()
      jQuery('.intro').fadeOut(1000, function () {
        jQuery(this).remove()
      })
    }
    if (event.key == '1') {
      selectedPrize = 'giainhat'
      showGift('giainhat')
      emptyResult()
      setRibbon(1)
      $('.footer').css({
        top: 'auto',
        bottom: '0',
        left: '50%',
        transform: 'translateX(-50%)',
      })
    }
    if (event.key == '2') {
      selectedPrize = 'giainhi'
      showGift('giainhi')
      emptyResult()
      setRibbon(2)
      $('.footer').css({
        top: 'auto',
        bottom: '0',
        left: '50%',
        transform: 'translateX(-50%)',
      })
    }
    if (event.key == '3') {
      selectedPrize = 'giaiba'
      showGift('giaiba')
      emptyResult()
      setRibbon(3)
      $('.footer').css({
        top: 'auto',
        bottom: '0',
        left: '50%',
        transform: 'translateX(-50%)',
      })
    }
    if (event.key == '4') {
      selectedPrize = 'giaikhuyenkhich'
      showGift('giaikhuyenkhich')
      emptyResult()
      setRibbon(4)
      $('.footer').css({
        top: 'auto',
        bottom: '0',
        left: '50%',
        transform: 'translateX(-50%)',
      })
    }
    if (event.key == ' ') {
      if (selectedPrize) {
        $(`#${selectedPrize}`).click()
      }
    }
    if (event.key == '6') {
      showAllGifts()
    }
    if (event.key == '7') {
      exportResultsToCSV()
    }
    if (event.key == 's' || event.key == 'S') {
      if (selectedPrize) {
        renderSelectedPrizeResults(selectedPrize)
      }
    }
  })
})

showAllGifts()
