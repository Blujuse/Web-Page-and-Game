
//
// Splash Screen Variables
//
// Creates a variable called splash after searching for elements with the .gameSplash class
const splash = document.querySelector('.gameSplash') // .gameSplash can be found in the style.css file

// Waits for page to fully load
// Checks if 2 seconds has passed then fades into the game and removes the display
document.addEventListener('DOMContentLoaded', (e)=>
{
    setTimeout(()=>{
        splash.classList.add('displayNone'); // Adds the displayNone class to hide the splash screen
    }, 2000);
})