var totalMember = 0;
var member = [];
var resultTest = [];
const config = {
  totalMember,
  memberNumber: member,
  nhat: 1,
  nhi: 2,
  ba: 3,
  khuyenkhich: 10,
  mayman: totalMember - 16,
};
var maymanResult = [];
var khuyenkhichResult = [];
var nhatResult = [];
var nhiResult = [];
var baResult = [];

reset();
function appearResult(typeGift) {
  $(".palette .color").each(function (i, e) {
    setTimeout(function () {
      $(e).addClass("in");
      $(e).addClass("bg-frame" + getSTT(typeGift));
      spanValue = e.querySelector("span");
      const dataValue = parseInt($(e).attr("data-value"));
      animateValue(spanValue, dataValue - 30, dataValue, 1000);
    }, i * 600);
  });
}

function createArrayByNumber(soLuong) {
  var mang = [];
  for (var i = 1; i <= soLuong; i++) {
    mang.push(i);
  }
  return mang;
}

function reset() {
  totalMember = 150;
  member = createArrayByNumber(totalMember);
  config.mayman = totalMember - 16;
  $(`#amount-nhat`).text(config.nhat);
  $(`#amount-nhi`).text(config.nhi);
  $(`#amount-ba`).text(config.ba);
  $(`#amount-khuyenkhich`).text(config.khuyenkhich);
  $(`#amount-mayman`).text(config.mayman);
}

function getRandomAndRemove(numberOfRandoms) {
  var result = [];

  for (var i = 0; i < numberOfRandoms; i++) {
    if (member.length === 0) {
      break;
    }
    var randomIndex = Math.floor(Math.random() * member.length);
    result.push(member[randomIndex]);
    member = member.filter((m) => m != member[randomIndex]);
  }
  return result;
}

function animateValue(obj, start, end, duration) {
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    obj.innerHTML = Math.floor(progress * (end - start) + start);
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}

function renderResult(numberOfRandoms, typeGift) {
  const results = getRandomAndRemove(numberOfRandoms);
  addToResult(results, typeGift);
  const paletteResult = $("#palette-result");
  paletteResult.empty();
  results.forEach((result) => {
    const colorDiv = $("<div>").addClass("color").attr("data-value", result);
    const spanNumber = $("<span>").text(result);
    colorDiv.append(spanNumber);
    paletteResult.append(colorDiv);
  });
  appearResult(typeGift);
}

function bookGift(element) {
  const typeGift = $(element).attr("data-tpe");
  let resultToRender = 0;
  let ribbonSrc = 1;

  if (config[typeGift] == 0) {
    $(`#amount-${typeGift}`)
      .attr("data-toggle", "modal")
      .attr("data-target", "#exampleModal");
  }
  switch (typeGift) {
    case "nhat":
      resultToRender = Math.min(config.nhat, 1);
      ribbonSrc = 1;
      break;
    case "nhi":
      resultToRender = Math.min(config.nhi, 2);
      ribbonSrc = 2;
      break;
    case "ba":
      resultToRender = Math.min(config.ba, 3);
      ribbonSrc = 3;
      break;
    case "khuyenkhich":
      resultToRender = Math.min(config.khuyenkhich, 5);
      ribbonSrc = 4;
      break;
    case "mayman":
      resultToRender = Math.min(config.mayman, 10);
      ribbonSrc = 5;
      break;
  }
  config[typeGift] = config[typeGift] - resultToRender;

  $(`#amount-${typeGift}`).text(config[typeGift]);
  renderResult(resultToRender, typeGift);
  setRibbon(ribbonSrc);
}

function getSTT(typeGift) {
  switch (typeGift) {
    case "nhat":
      return 1;
    case "nhi":
      return 2;
    case "ba":
      return 3;
    case "khuyenkhich":
      return 4;
    case "mayman":
      return 5;
  }
}

function setRibbon(number) {
  $("#ribbon-img").attr("src", `./assets/ribbon/ribbon${number}.png`);
}

function addToResult(result, typeGift) {
  if (result && result.length > 0) {
    switch (typeGift) {
      case "nhat":
        nhatResult.push(result);
        break;
      case "nhi":
        nhiResult.push(result);
        break;
      case "ba":
        baResult.push(result);
        break;
      case "khuyenkhich":
        khuyenkhichResult.push(result);
        break;
      case "mayman":
        maymanResult.push(result);
        break;
    }
  }
}
function renderResultLatest(typeGift) {
  const modalBody = $(".modal-body");
  modalBody.empty();
  let result = [];
  switch (typeGift) {
    case "nhat":
      result = nhatResult;
      break;
    case "nhi":
      result = nhiResult;
      break;
    case "ba":
      result = baResult;
      break;
    case "khuyenkhich":
      result = khuyenkhichResult;
      break;
    case "mayman":
      result = maymanResult;
      break;
  }
  if (result && result.length > 0) {
    result.forEach((row, rowIndex) => {
      const resultRow = $("<div class='row'></div>");

      row.forEach((col, colIndex) => {
        const resultCol = $(`<div class='number-result col'>${col}</div>`);
        resultRow.append(resultCol);
      });

      modalBody.append(resultRow);
    });
  }
}
