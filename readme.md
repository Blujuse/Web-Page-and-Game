# Sandcastle Smasher!

Sandcastle Smasher is a fast-paced, browser-based game that uses THREE.js for 3D rendering and ammo.js for realistic physics. Your mission is simple: smash as many sandcastles as possible before the timer runs out!
However, be cautious—your beach balls are limited, and running out will end the game. Use your ammunition wisely, time your shots, and aim for maximum destruction to rack up the highest score before time is up!

Alongside the game there is also a website which has been created, you can find images of both the game and webpages below!

## Controls

Left Click - Shoot
Mouse - Aiming

## Game Gallery

<p float="left">
  <img src="/CustomAssets/GameImgOne.png" alt="Game Image One" width="300" height="200">
  <img src="/CustomAssets/GameImgTwo.png" alt="Game Image Two" width="300" height="200">
</p>

<p float="left">
  <img src="/CustomAssets/GameImgThree.png" alt="Game Image Three" width="300" height="200">
  <img src="/CustomAssets/GameImgFour.png" alt="Game Image Four" width="300" height="200">
</p>

## Webpage Galley

### Index Page
![Index Page Image One](/CustomAssets/IndexPageOne.png)
![Index Page Image Two](/CustomAssets/IndexPageTwo.png)

### Sign In & Registration Pages
![Sign In Page](/CustomAssets/SignInPage.png)
![Register Page](CustomAssets/RegisterPage.png)

### 404 Page
![Register Page](CustomAssets/FourOFourPage.png)

### Game Page
![Game Page](CustomAssets/GamePage.png)
![Game End Page](CustomAssets/GamePage.png)

## Server

The server for the website is deployed using nodejs and the information for users is stored on a php database. This database contains ID, username, password, and score, the password is encrypted so it is stored securely.
The user remains logged in using cookies, which uses a key to keep their current session secure, as this is a project i've named it "TEMP_KEY" as it is all for testing is not for actual use!

## Project Structure
```
myGame://
|   app.js
|
+---secure
|       database.json
|
\---static
    |   401page.html
    |   404page.html
    |   game.html
    |   index.html
    |   login.html
    |   register.html
    |
    \---resources
        +---ammo
        |       ammo.js
        |       three.core.js
        |       three.module.js
        |
        +---audio
        |       BackgroundMusic.mp3
        |       Ocean.mp3
        |       Pop.wav
        |       Sand.wav
        |       Seagulls.mp3
        |
        +---css
        |       style.css
        |
        +---images
        |       beachballs.jpg
        |       GameImgFour.png
        |       GameImgOne.png
        |       GameImgThree.png
        |       GameImgTwo.png
        |       HowToPlayFour.png
        |       HowToPlayOne.png
        |       HowToPlayThree.png
        |       HowToPlayTwo.png
        |       SandcastleBox.png
        |       Website_BG.png
        |
        +---js
        |       countdowntimer.js
        |       game.js
        |       splashscreen.js
        |       tutorialsessions.js
        |
        +---models
        |       beach_ball.glb
        |       low_poly_helicopter.glb
        |
        \---text
                SANDCASTLE.otf
                SANDCASTLE.ttf

```
