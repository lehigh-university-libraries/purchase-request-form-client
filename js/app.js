$(document).ready(function() {
  initUser();
  initListener();
});

function initUser() {
  $.ajaxSetup({
    headers: {
      'Authorization': "Basic " + btoa(WORKFLOW_USERNAME + ":" + WORKFLOW_PASSWORD)
    }
  });
}

function initListener() {
  $("#submit_button").on("click", function(event) {
    sendNewRequest();
  });
}

function sendNewRequest() {
  let title = $('#title_input').val();
  let contributor = $('#contributor_input').val();
  let format = $("#book_format input:checked").val();
  let speed = $("#speed input:checked").val();
  let destination = $("#destination input:checked").val();
  let request_data = {
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
      notifySuccess(title, contributor);
    },
    error: function(xhr, status, error) {
      console.log("failed with status " + status + " and error: " + error);
    }
  });
}

function notifySuccess(title, contributor) {
  let clone = $("#success_template").get(0).content.cloneNode(true);
  $(".text", clone)
    .text("Successfully submitted purchase request for " + title + " by " + contributor + ".");
  $("main").append(clone);
}
