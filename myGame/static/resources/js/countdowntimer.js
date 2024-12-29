// REFERENCES : https://www.w3schools.com/howto/howto_js_countdown.asp

//
// GAME END VARIABLES
//
window.timerExpired = false; // Create a global variable, can be accessed in other js scripts then

document.addEventListener("DOMContentLoaded", function() {
    // Set countdown for 3 minutes from now
    var countDownDate = new Date(new Date().getTime() + 3 * 60 * 1000).getTime();

    // Select the element to update
    var element = document.getElementById("countdownTimer");

    // Check if the element exists
    if (!element) {
        console.error("Element with id 'countdownTimer' not found.");
        return;
    }

    // Update the count down every 1 second
    var x = setInterval(function() {
        var currentTime = new Date().getTime();
        var distance = countDownDate - currentTime;

        var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((distance % (1000 * 60)) / 1000);

        var countdownText = minutes + "m " + seconds + "s ";
        element.textContent = countdownText;

        if (distance < 0) {
            clearInterval(x);
            element.textContent = "EXPIRED";
            timerExpired = true; // Set to true so can be used in setting the game to end
        }
    }, 1000);
});