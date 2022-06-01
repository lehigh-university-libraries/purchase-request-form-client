$(document).ready(function() {
  initUser();
  initListeners();
  loadDeliveryOptions();

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

function loadDeliveryOptions() {
  for (let i=0; i < DESTINATION_OPTIONS.length; i++) {
    let destinationOption = DESTINATION_OPTIONS[i];
    let inputElement = $("<input>")
      .attr("type", "radio")
      .attr("name", "destination")
      .attr("value", destinationOption[0]);
    let labelElement = $("<label>")
      .addClass("radio")
      .text(destinationOption[1])
      .prepend(inputElement);
    $("#destination_input .control").append(labelElement);
  }
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
    url: WORKFLOW_SERVICE_BASE_URL + "/search-matches?" + new URLSearchParams(request_data),
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
      let local_item = $("<li>").append(link);
      if (result.contributor != null) {
        local_item.append(" by ").append(result.contributor);
      }
      $("#local_results").append(local_item);
    }
    $("#local_holdings_input_section").show();
  }
  else {
    showDeliveryInput();
  }
}

function rejectLocalHoldings() {
  $("#local_holdings_input_section").hide();
  showDeliveryInput();
}

function showDeliveryInput() {
  // reset to the first destination option being selected
  $("#destination_input .control label[class=radio]").first().children("input").prop("checked", true);

  // show the delivery panel
  $("#delivery_input_section").show();
}

function sendNewRequest() {
  let requesterUsername = normalize($('#username_input').val());
  let title = normalize($('#title_input').val());
  let contributor = normalize($('#contributor_input').val());
  let format = $("#format_input input:checked").val();
  let speed = $("#speed_input input:checked").val();
  let destination = $("#destination_input input:checked").val();
  let request_data = {
    requesterUsername: requesterUsername,
    title: title,
    contributor: contributor,
    format: format,
    speed: speed,
    destination: destination,
  };
  $.ajax({
    url: WORKFLOW_SERVICE_BASE_URL + "/purchase-requests",
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
