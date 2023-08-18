var discordImage = document.getElementById('Discord');
var popUpMessageElement = document.getElementById('popUpMessage');
let audioElement = document.getElementById('background-music');
let volume = 0.1;
audioElement.volume = volume;

// DISCORD COPY NAME
discordImage.addEventListener('click', function() {
    navigator.clipboard.writeText('.Micookie')
        .then(function() {
            popUpMessageElement.textContent = 'Discord Copied.';
            popUpMessageElement.classList.add('show-popup');
            setTimeout(function() {
                popUpMessageElement.classList.remove('show-popup');
            }, 2000);
        })
        .catch(function(err) {
            console.error('Failed to copy text: ', err);
        });
});

// AUDIO SOUND
window.addEventListener('wheel', function(event) {
    if (event.deltaY < 0) {
        volume += 0.02;
        if(volume > 1) volume = 1;
        audioElement.volume = volume;
    } else if (event.deltaY > 0) {
        volume -= 0.02;
        if(volume < 0) volume = 0;
        audioElement.volume = volume;
    }
});


// STARS
var bodyElement = document.body;
var starLayer = document.createElement('div');
starLayer.classList.add('star-layer');
bodyElement.appendChild(starLayer);

setInterval(function() {
    var randomX = Math.random() * window.innerWidth;
    var randomY = Math.random() * window.innerHeight;
    var randomSize = Math.floor(Math.random() * 11) + 20;
    var starElement = document.createElement('div');
    starElement.classList.add('star');
    starElement.style.left = randomX + 'px';
    starElement.style.top = randomY + 'px';
    starLayer.appendChild(starElement);
    starElement.getBoundingClientRect();
    starElement.style.opacity = '1';
    starElement.style.width = '0';
    starElement.style.height = '0';
    starElement.style.transform = 'translate(-50%, -50%) translateY(0)';
    setTimeout(function() {
        starElement.style.width = randomSize + 'px';
        starElement.style.height = randomSize + 'px';
        starElement.style.transform = 'translate(-50%, -50%) translateY(20px)';
        setTimeout(function() {
            starElement.style.opacity = '0';
            setTimeout(function() {
                starLayer.removeChild(starElement);
            }, 1000);
        }, 2000);
    }, 1);
}, 400);
