$(document).ready(function() {
  initUser();
  initListeners();

  bootstrap();
});

function bootstrap() {
  let params = new URLSearchParams(window.location.search);
  if (params.has("username")) {
    let username = params.get('username');
    $("#username_input").val(username);
    $("#login_button").click();
  }
}

function initUser() {
  $.ajaxSetup({
    headers: {
      'Authorization': "Basic " + btoa(WORKFLOW_USERNAME + ":" + WORKFLOW_PASSWORD)
    }
  });
}

function initListeners() {
  $("#login_input_section").on("submit", function(event) {
    event.preventDefault();
    $("login_button").click();
  });
  $("#login_button").on("click", function(event) {
    login();
  });

  $("#item_input_section").on("submit", function(event) {
    event.preventDefault();
    $("search_button").click();
  });
  $("#search_button").on("click", function(event) {
    search();
  });

  $("#reject_local_holdings_button").on("click", function(event) {
    rejectLocalHoldings();
  });

  $("#submit_button").on("click", function(event) {
    sendNewRequest();
  });
}

function login() {
  // hide login input
  $("#login_input_section").hide();

  // show login done
  $("#username").text($('#username_input').val());
  $("#login_done_section").show();

  // show item input
  $("#item_input_section").show();

  bootstrapSearch();
}

function bootstrapSearch() {
  let params = new URLSearchParams(window.location.search);
  if (params.has("title")) {
    $("#title_input").val(params.get('title'));
  }
  if (params.has("contributor")) {
    $("#contributor_input").val(params.get('contributor'));
  }
}

function search() {
  let title = normalize($('#title_input').val());
  let contributor = normalize($('#contributor_input').val());
  let request_data = {
    title: title,
    contributor: contributor,
  };

  $.ajax({
    url: "http://localhost:8080/search-matches?" + new URLSearchParams(request_data),
    method: "GET",
    contentType: 'application/json',
    success: function(data, status, xhr) {
      console.log("search call succeeded");
      searchSucceeded(data);
    },
    error: function(xhr, status, error) {
      console.log("search failed with status " + status + " and error: " + error);
    }
  });
}

function searchSucceeded(data) {
  // hide item input
  $("#item_input_section").hide();

  // show the item searched for
  $("#title").text($("#title_input").val());
  $("#contributor").text($("#contributor_input").val());
  $("#search_done_section").show();

  console.log("number of results: " + data.length);
  if (data.length > 0) {
    // show the search results
    $("#local_results").empty();
    for (let i=0; i < data.length; i++) {
      let result = data[i];
      let url = CATALOG_URL_FOR_OCLC_NUMBER.replace("{oclc}", result.oclcNumber);
      let link = $("<a>").attr("href", url).attr("target", "_blank").text(result.title);
      let local_item = $("<li>").append(link).append(" by ").append(result.contributor);
      $("#local_results").append(local_item);
    }
    $("#local_holdings_input_section").show();
  }
  else {
    // show delivery input
    $("#delivery_input_section").show();
  }
}

function rejectLocalHoldings() {
  $("#local_holdings_input_section").hide();
  $("#delivery_input_section").show();
}

function sendNewRequest() {
  let reporterName = normalize($('#username_input').val());
  let title = normalize($('#title_input').val());
  let contributor = normalize($('#contributor_input').val());
  let format = $("#format_input input:checked").val();
  let speed = $("#speed_input input:checked").val();
  let destination = $("#destination_input input:checked").val();
  let request_data = {
    reporterName: reporterName,
    title: title,
    contributor: contributor,
    format: format,
    speed: speed,
    destination: destination,
  };
  $.ajax({
    url: "http://localhost:8080/purchase-requests",
    method: "POST",
    contentType: 'application/json',
    data: JSON.stringify(request_data),
    success: function(data, status, xhr) {
      console.log("call succeeded");
      requestSucceeded(title, contributor);
    },
    error: function(xhr, status, error) {
      console.log("failed with status " + status + " and error: " + error);
    }
  });
}

function normalize(input) {
  if (input != null && input.length == 0) {
    return null;
  }
  return input;
}

function requestSucceeded(title, contributor) {
  // hide delivery input
  $("#delivery_input_section").hide();

  // show the delivery choices
  $("#format").text($("#format_input input:checked").parent().text().trim());
  $("#speed").text($("#speed_input input:checked").parent().text().trim());
  $("#destination").text($("#destination_input input:checked").parent().text().trim());
  $("#delivery_done_section").show();

  // add notification
  let clone = $("#success_template").get(0).content.cloneNode(true);
  $(".text", clone)
    .text("Successfully submitted purchase request for " + title + " by " + contributor + ".");
  $("main").append(clone);
}
