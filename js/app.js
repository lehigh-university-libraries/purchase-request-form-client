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
  let request_data = {
    title: title,
    contributor: contributor,
  };
  $.ajax({
    url: "http://localhost:8080/purchase-requests",
    method: "POST",
    contentType: 'application/json',
    data: JSON.stringify(request_data),
    success: function(data, status, xhr) {
      console.log("call succeeded");
    },
    error: function(xhr, status, error) {
      console.log("failed with status " + status + " and error: " + error);
    }
  });
}
