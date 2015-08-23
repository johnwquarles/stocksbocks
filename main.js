var API_URL = "http://dev.markitondemand.com/Api/v2/Quote/jsonp?";
var FIREBASE_URL = "https://stocksbocks.firebaseio.com/stocksbocks.json"
var $SUBMITBUTTON = $(".submit");
var $TEXTFIELD = $(".textfield");
var $BUYFORM = $(".buyform");
var $QUOTE = $(".quote");
var $ERROR = $(".error");
var $THANKYOU = $(".thankyou");
var $BUYTABLE = $(".buytable");
var $TOTAL_CELL;
var CURRENT_STOCK_OBJ;
var running_total = 0;

$BUYTABLE.on('click', '.delete-button', function() {
  deleteFromFirebase($(this).closest('tr').attr('data_id'));
  $(this).closest('tr').fadeOut(500, function() { $(this).remove(); });
  /*$(this).closest('tr').remove();*/
  running_total -= $(this).closest('tr').attr('total_cost');
  updateTotal();
})

initialLoad();

function deleteFromFirebase(id) {
  var deleteUrl = FIREBASE_URL.slice(0, -5) + '/' + id + '.json';
  $.ajax({url: deleteUrl, type: 'DELETE'})
}

function makeError() {
  var docFragment = document.createDocumentFragment(); // contains all gathered nodes

  var p = document.createElement('P');
  docFragment.appendChild(p);
  var text = document.createTextNode("(ノಠ益ಠ)ノ WAT");
  p.appendChild(text);

  return docFragment;
}

function makeThankyou() {
  var docFragment = document.createDocumentFragment(); // contains all gathered nodes

  var p = document.createElement('P');
  docFragment.appendChild(p);
  var text = document.createTextNode("｜*￣∇￣｜ thanku ♪");
  p.appendChild(text);

  return docFragment;
}

function addQuote(data) {
  CURRENT_STOCK_OBJ = data;
  $QUOTE.empty();
  $ERROR.empty();
  if (!(data.LastPrice)) {
    $ERROR.append(makeError());
    fadeIn(".error");
    $BUYFORM.empty();
    return false;
  }
  $QUOTE.append(makeQuote(data));

  if (!($(".buyform input").length)) {
    appendBuyForm();
  }
}

function makeQuote(data) {
  var obj = new Date(data.Timestamp);
  var date = obj.toDateString();

  var docFragment = document.createDocumentFragment(); // contains all gathered nodes

  var time = document.createElement('TIME');
  docFragment.appendChild(time);
  var text = document.createTextNode(date);
  time.appendChild(text);

  var company = document.createElement('COMPANY');
  docFragment.appendChild(company);
  var text_0 = document.createTextNode(data.Name);
  company.appendChild(text_0);

  var price = document.createElement('PRICE');
  docFragment.appendChild(price);
  var text_1 = document.createTextNode("$" + data.LastPrice);
  price.appendChild(text_1);

  var high = document.createElement('HIGH');
  docFragment.appendChild(high);
  var text_2 = document.createTextNode("High: $" + data.High);
  high.appendChild(text_2);

  var low = document.createElement('LOW');
  docFragment.appendChild(low);
  var text_3 = document.createTextNode("Low: $" + data.Low);
  low.appendChild(text_3);

  return docFragment;
}

$SUBMITBUTTON.click(function(event) {
  event.preventDefault();
  var symbol = $TEXTFIELD.val();
  var request_url = API_URL + "symbol=" + symbol;
  $.get(request_url, addQuote, 'jsonp');
})

function appendBuyForm() {
  $BUYFORM.append(makeBuyForm());
  var $buy_button = $(".buyform > form > button");

  $buy_button.click(function(event) {
    event.preventDefault();
    var regex = /^([1-9]|[1-9][0-9]+)$$/
    var $QUANTITYINPUT = $('.buyform form input.textfield');
    if (!($QUANTITYINPUT.val().match(regex))) {
      if (!$ERROR.html()) {
        $THANKYOU.empty();
        $ERROR.append(makeError());
        fadeIn(".error");
      }
      return false;
    }
    $ERROR.empty();
    if (!$THANKYOU.html()) {
      $THANKYOU.append(makeThankyou());
      fadeIn(".thankyou");
      setTimeout(function() {
        $THANKYOU.children().fadeOut(1600, function() {
          $(this).remove();
          $(this).css('display', '');
        })
      }, 3000)
    }
    writeToFirebase();
    // writeToTable function call moved to the success parameter (as a function) of the $.post call
    // so that it won't attempt to write to the table until the data object is successfully loaded in;
    // if that change hadn't been made, it'd attempt to write to the table before it had the necessary
    // data.
  })
}

function fadeIn(selector) {
  var element = document.querySelector(selector);
  element.style.opacity = 0;
  window.getComputedStyle(element).opacity;
  element.style.opacity = 1;
}

function writeToFirebase() {
  var writeObj = {};
  var buy_number = $(".buyform input.textfield").val();
  writeObj.Buy_number = buy_number;
  writeObj.Symbol = CURRENT_STOCK_OBJ.Symbol;
  writeObj.Name = CURRENT_STOCK_OBJ.Name;
  writeObj.LastPrice = CURRENT_STOCK_OBJ.LastPrice.toFixed(2);
  $.post(FIREBASE_URL, JSON.stringify(writeObj), function(response) {
    //res = {name: "ouhrfgouih2093458thushdf"}
    CURRENT_STOCK_OBJ.data_id = response.name;
    insertToTable();
  });
}

function initialLoad() {
  $.get(FIREBASE_URL, function(db_data) {
  // below: not working from an array; is a hash. key gives you the exact data_id string.
  db_data && Object.keys(db_data).forEach(function(key) {
    insertToTable(db_data[key], key);
  });
});
}

function insertToTable(db_data, id) {
  if (!($("table").length)) {
      $(".buytable").append(makeTableHeading());
      $BUYTABLE = $(".buytable table");
      $BUYTABLE.append(makeTableFooter());
      $TOTAL_CELL = $(".total_cost_cell");
    }

  $(makeBuyRow(db_data, id)).insertBefore($("table tfoot"));
  updateTotal();
}

function updateTotal() {
  $TOTAL_CELL.html("$" + running_total.toFixed(2));
}

function makeBuyRow(db_data, id) {
  var buy_number = ((db_data && db_data.Buy_number) || document.querySelector(".buyform input.textfield").value);
  var LastPrice_use_this = ((db_data && db_data.LastPrice) || CURRENT_STOCK_OBJ.LastPrice);
  var total_cost_this_time = buy_number * LastPrice_use_this;
  running_total += total_cost_this_time;

  var docFragment = document.createDocumentFragment(); // contains all gathered nodes

  var tr = document.createElement('TR');
  tr.setAttribute("data_id", (id || CURRENT_STOCK_OBJ.data_id.toString()));
  tr.setAttribute("total_cost", total_cost_this_time);
  docFragment.appendChild(tr);

  var td = document.createElement('TD');
  tr.appendChild(td);
  var text = document.createTextNode(((db_data && db_data.Symbol) || CURRENT_STOCK_OBJ.Symbol));
  td.appendChild(text);

  var td_0 = document.createElement('TD');
  tr.appendChild(td_0);
  var text_0 = document.createTextNode(((db_data && db_data.Name) || CURRENT_STOCK_OBJ.Name));
  td_0.appendChild(text_0);

  var td_1 = document.createElement('TD');
  tr.appendChild(td_1);
  var text_1 = document.createTextNode(commafy(buy_number));
  td_1.appendChild(text_1);

  var td_2 = document.createElement('TD');
  tr.appendChild(td_2);
  var text_2 = document.createTextNode("$" + parseFloat(LastPrice_use_this).toFixed(2));
  td_2.appendChild(text_2);

  var td_3 = document.createElement('TD');
  tr.appendChild(td_3);
  var text_3 = document.createTextNode("$" + commafy((LastPrice_use_this * parseInt(buy_number)).toFixed(2)));
  td_3.appendChild(text_3);

  var td_4 = document.createElement('TD');
  td_4.classList.add("delete-cell");
  tr.appendChild(td_4);
  var button_3 = document.createElement('button');
  button_3.classList.add("delete-button");
  var button_text = document.createTextNode("Delete");
  button_3.appendChild(button_text);
  td_4.appendChild(button_3);

  return docFragment;
}

function makeTableFooter() {
  var docFragment = document.createDocumentFragment(); // contains all gathered nodes

  var tfoot = document.createElement('TFOOT');
  docFragment.appendChild(tfoot);
  var blank_tr = document.createElement('TR');
  tfoot.appendChild(blank_tr);
  var blank_td = document.createElement('TD');
  blank_td.classList.add("hide");
  blank_tr.appendChild(blank_td);
  var dummy_text = document.createTextNode("nothing to see here");
  blank_td.appendChild(dummy_text);
  var tr = document.createElement('TR');
  tfoot.appendChild(tr);
  var tdplaceholder = document.createElement('TD');
  tr.appendChild(tdplaceholder);
  var tdplaceholder2 = document.createElement('TD');
  tr.appendChild(tdplaceholder2);
  var tdplaceholder3 = document.createElement('TD');
  tr.appendChild(tdplaceholder3);
  var td2 = document.createElement('TD');
  var text = document.createTextNode("Total cost:\xA0\xA0");
  td2.appendChild(text);

  tr.appendChild(td2);

  var td = document.createElement('TD');
  td.classList.add("total_cost_cell");
  tr.appendChild(td);

  return docFragment;
}

function makeTableHeading() {
  var docFragment = document.createDocumentFragment(); // contains all gathered nodes

  var table = document.createElement('TABLE');
  docFragment.appendChild(table);

  var tbody = document.createElement('THEAD');
  table.appendChild(tbody);

  var tr = document.createElement('TR');
  tbody.appendChild(tr);

  var th = document.createElement('TH');
  tr.appendChild(th);
  var text = document.createTextNode("Symbol");
  th.appendChild(text);

  var th_0 = document.createElement('TH');
  tr.appendChild(th_0);
  var text_0 = document.createTextNode("Stock");
  th_0.appendChild(text_0);

  var th_1 = document.createElement('TH');
  tr.appendChild(th_1);
  var text_1 = document.createTextNode("Amount");
  th_1.appendChild(text_1);

  var th_2 = document.createElement('TH');
  tr.appendChild(th_2);
  var text_2 = document.createTextNode("Price per");
  th_2.appendChild(text_2);

  var th_3 = document.createElement('TH');
  tr.appendChild(th_3);
  var text_3 = document.createTextNode("Total price");
  th_3.appendChild(text_3);

  var th_4 = document.createElement("TH");
  tr.appendChild(th_3);

 return docFragment;
}

function makeBuyForm() {
  var docFragment = document.createDocumentFragment(); // contains all gathered nodes

  var form = document.createElement('FORM');
  docFragment.appendChild(form);

  var input = document.createElement('INPUT');
  input.setAttribute("type", "text");
  input.setAttribute("class", "textfield");
  input.setAttribute("placeholder", "How many?");
  form.appendChild(input);

  var button = document.createElement('BUTTON');
  button.setAttribute("class", "submit");
  form.appendChild(button);
  var text = document.createTextNode("Purchase");
  button.appendChild(text);

  p_element = document.createElement('P');
  docFragment.appendChild(p_element);
  var p_text = document.createTextNode("note that 'purchase' refers to shares of the currently displayed stock quote");
  p_element.appendChild(p_text);

  return docFragment;
}

function commafy(num) {
  var decimal = num.indexOf(".");
  if (decimal !== -1) {
    var num_arr = num.split("").slice(0,decimal).reverse();
    var decimal_part = num.split("").slice(decimal).join("");
  } else {
    var num_arr = num.split("").reverse();
  }
  for (var i = 1; i < num_arr.length; i++) {
    if (i % 3 === 0) {
      num_arr[i] += ",";
    }
  }
  new_num = num_arr.reverse().join("");
  if (decimal_part) {
    new_num += decimal_part;
  }
  return new_num;
}
