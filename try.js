var checkboxes = document.getElementsByClassName('radio-input');
var submitButton = document.getElementById('submit-button');
var selectionCounts = document.getElementsByClassName('selection-count');
var progressBarFills = document.getElementsByClassName('selection-count-fill');
var lastVoteTime = 0;
var canVote = true; // Flag to indicate if the user can vote
var selectedOption = null; // Variable to store the selected option
var messageElement = document.getElementById('message');
var timerElement = document.getElementById('timer');
var sendButton = document.querySelector('.button1');
var serverURL = 'http://10.100.102.13:5000'; // Update with your server URL
var timeout = 10; // Declare the timeout variable
var startTime = 0; // Declare the startTime variable


for (var i = 0; i < checkboxes.length; i++) {
  
  checkboxes[i].addEventListener('click', function () {
    if (!canVote) {
      showMessage('You cannot change your vote at this time.', 'error-message');
      this.checked = false; // Deselect the checkbox
      return;
    }

    // Deselect other checkboxes
    for (var j = 0; j < checkboxes.length; j++) {
      if (checkboxes[j] !== this) {
        checkboxes[j].classList.remove('checked');
      }
    }

    // Toggle the selected checkbox
    this.classList.toggle('checked');

    // Store the selected option value
    if (this.classList.contains('checked')) {
      selectedOption = this.value;
    } else {
      selectedOption = null;
    }
  });
}

function handleResponse(response) {
  if (!response.ok) {
    throw new Error('Error: ' + response.status);
  }
  return response.json();
}

function sendMessage() {
  var inputElement = document.getElementById('chat-input');
  var message = inputElement.value;

  // Reset the input field
  inputElement.value = '';

  // Get the IP address of the connected webpage
  var ipAddress = window.location.hostname;

  // Send the message and IP address to the server
  // Modify the URL and method based on your server implementation
  var url = serverURL + '/send-message?message=' + message + '&ip=' + ipAddress;
  var options = {
    method: 'POST',
    body: JSON.stringify({ message: message, ip: ipAddress }),
    headers: {
      'Content-Type': 'application/json',
    },
  };

  fetch(url, options)
    .then(handleResponse)
    .then(function (data) {
      // Handle the server response
      console.log(data);
    })
    .catch(function (error) {
      console.log(error.message);
    });
}


sendButton.addEventListener('click', sendMessage);


function submitTasks(event) {
  if (event) {
    event.preventDefault(); // Prevent default form submission
  }

  // Check if the user can vote
  if (!canVote) {
    showMessage('You cannot vote again at this time.', 'error-message');
    return;
  }

  var ipAddress = window.location.hostname;

  if (selectedOption) {
    const optionValue = selectedOption;
    const url = serverURL + '/submit?option=' + optionValue + '&ip=' + ipAddress;

    fetch(url, { method: 'POST' })
      .then(handleResponse)
      .then(function (data) {
        console.log(data.message);
        canVote = false;
        updateCounts();

        // Start cooldown timer
        startTime = Date.now();
        timerInterval = setInterval(updateTimer, 1000);

        // Request timeout from the server
        fetch(serverURL + '/timeout')
          .then(handleResponse)
          .then(function (timeoutData) {
            timeout = timeoutData.timeout; // Assuming the server responds with a JSON object containing the timeout value
            showMessage('You can vote again in ' + timeout + ' seconds.', 'success-message');

            setTimeout(function () {
              clearInterval(timerInterval);
              canVote = true;
              showMessage('voting ended', 'error-message');
              submitButton.removeEventListener('click', submitTasks); // Remove the event listener
            }, timeout * 1000); // Convert seconds to milliseconds
          })
          .catch(function (error) {
            console.log(error);
            showMessage('An error occurred.', 'error-message');
          });
      })
      .catch(function (error) {
        console.log(error);
        if (error.message === 'An error occurred.') {
          showMessage('You have already voted!', 'error-message');
        } else {
          showMessage('You have already voted!', 'error-message');
        }
      });
  } else {
    showMessage('Please select an option.', 'error-message');
  }
}

function updateCounts() {
  const url = serverURL + '/counters';

  fetch(url)
    .then(handleResponse)
    .then(function (data) {
      const counters = data.counters;
      const names = data.names;

      const selectionLabels = document.getElementsByClassName('label');
      const selectionTexts = document.getElementsByClassName('label-text');

      // Update the option names and hide unnecessary options
      for (let i = 0; i < selectionCounts.length; i++) {
        if (i < names.length) {
          selectionLabels[i].style.display = 'flex';
          selectionTexts[i].textContent = names[i];
        } else {
          selectionLabels[i].style.display = 'none';
        }
      }

      let totalCount = 0;

      // Calculate the total count
      for (let i = 0; i < selectionCounts.length; i++) {
        const option = selectionCounts[i].getAttribute('data-option');
        const count = counters[option] || 0;
        totalCount += count;
      }

      // Update the percentage and width for each option
      for (let i = 0; i < selectionCounts.length; i++) {
        const option = selectionCounts[i].getAttribute('data-option');
        const count = counters[option] || 0;

        selectionCounts[i].textContent = totalCount === 0 ? '0%' : ((count / totalCount) * 100).toFixed(2) + '%';
        progressBarFills[i].style.width = totalCount === 0 ? '0%' : (count / totalCount) * 100 + '%';
      }
    })
    .catch(function (error) {
      console.log('Error retrieving counters:', error.message);
    });
}



function updateTimer() {
  var currentTime = Date.now();
  var elapsedTime = Math.floor((currentTime - startTime) / 1000);
  var remainingTime = timeout - elapsedTime; // Countdown from timeout seconds

  var minutes = Math.floor(remainingTime / 60);
  var seconds = remainingTime % 60;

  var formattedTime = padZero(minutes) + ':' + padZero(seconds);

  timerElement.textContent = formattedTime;
}

function padZero(number) {
  return (number < 10 ? '0' : '') + number;
}

// Function to show the message
function showMessage(text, className) {
  messageElement.textContent = text;
  messageElement.className = className;
  messageElement.style.display = 'block';
}

// Function to hide the message
function hideMessage() {
  messageElement.textContent = '';
  messageElement.className = '';
  messageElement.style.display = 'none';
}

// Handle the response from fetch requests
function handleResponse(response) {
  if (response.ok) {
    return response.json();
  } else {
    throw new Error('Error: ' + response.status);
  }
}

var timeout = 0; // Declare the timeout variable
var startTime = 0; // Declare the startTime variable

function getRemainingTime() {
  // Start cooldown timer
  startTime = Date.now();
  timerInterval = setInterval(updateTimer, 1000);

  // Request timeout from the server
  fetch(serverURL + '/timeout')
  .then(handleResponse)
  .then(function (timeoutData) {
    timeout = timeoutData.timeout; // Assuming the server responds with a JSON object containing the timeout value
    showMessage('You can vote again in ' + timeout + ' seconds.', 'success-message');

    setTimeout(function () {
      clearInterval(timerInterval);
      canVote = true;
      showMessage('Voting ended!', 'error-message');
      submitButton.removeEventListener('click', submitTasks); // Remove the event listener
    }, timeout * 1000); // Convert seconds to milliseconds
  });
}

getRemainingTime();

setInterval(updateCounts, 500);
