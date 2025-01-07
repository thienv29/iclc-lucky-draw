
$(document).ready(function () {
    function exportResultsToCSV() {
      const allResults = [
        { name: "May mắn", data: maymanResult },
        { name: "Khuyến khích", data: khuyenkhichResult },
        { name: "Ba", data: baResult },
        { name: "Nhì", data: nhiResult },
        { name: "Nhất", data: nhatResult },
      ];

      let csvContent = "";

      allResults.forEach((result) => {
        const rows = result.data.map((row) => row.join(",")).join("\n");
        csvContent += `${result.name}\n${rows}\n\n`;
      });

      // Create a blob with the CSV content and create a download link
      const blob = new Blob([csvContent], { type: "text/csv" });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = "results.csv";
      link.click();
    }
    // video
    var video = $("#intro-video");
    if (video.length) {
      video.on("ended", function () {
        $(".intro").remove();
      });
    }
    // Function to hide all gift divs
    function hideAllGifts() {
      $(".prize").hide();
    }
    function showAllGifts() {
      $(".prize").show();
    }
    // Function to show the specified gift div9
    function showGift(giftType) {
      hideAllGifts(); // Hide all gifts first
      $("#" + giftType).show();
    }
    function emptyResult() {
      const paletteResult = $("#palette-result");
      paletteResult.empty();
    }

    // Event listener for key press
    $(document).keydown(function (event) {
      if (event.key == "0") {
        const audio = $("#myAudio")[0];
        if (audio.paused) {
          audio.play();
        } else {
          audio.pause();
        }
      }
      if (event.key == "9") {
        const audio = $("#myAudio2")[0];
        if (audio.paused) {
          audio.play();
        } else {
          audio.pause();
        }
      }
      if (event.key == "8") {
        if (video[0].paused) {
          video[0].play();
        } else {
          video[0].pause();
        }
      }
      if (event.key == "1") {
        showGift("giainhat");
        emptyResult();
        setRibbon(event.key);
      }
      if (event.key == "2") {
        showGift("giainhi");
        emptyResult();
        setRibbon(event.key);
      }
      if (event.key == "3") {
        showGift("giaiba");
        emptyResult();
        setRibbon(event.key);
      }
      if (event.key == "4") {
        showGift("giaikhuyenkhich");
        emptyResult();
        setRibbon(event.key);
      }
      if (event.key == "5") {
        showGift("giaimayman");
        emptyResult();
        setRibbon(event.key);
      }
      if (event.key == "6") {
        showAllGifts();
      }
      if (event.key == "7") {
        exportResultsToCSV();
      }
    });
  });
