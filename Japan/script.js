
let current = "none";
let choice = "none";
let list;
let score = 0;
let clic = 0;

const japanRegions = [
    {
        name: 'Hokkaido',
        prefectures: ['Hokkaido']
    },
    {
        name: 'Tohoku',
        prefectures: ['Aomori', 'Iwate', 'Miyagi', 'Akita', 'Yamagata', 'Fukushima']
    },
    {
        name: 'Kanto',
        prefectures: ['Ibaraki', 'Tochigi', 'Gunma', 'Saitama', 'Chiba', 'Tokyo', 'Kanagawa']
    },
    {
        name: 'Chubu',
        prefectures: ['Niigata', 'Toyama', 'Ishikawa', 'Fukui', 'Yamanashi', 'Nagano', 'Gifu', 'Shizuoka', 'Aichi']
    },
    {
        name: 'Kansai',
        prefectures: ['Mie', 'Shiga', 'Kyoto', 'Osaka', 'Hyōgo', 'Nara', 'Wakayama']
    },
    {
        name: 'Chugoku',
        prefectures: ['Tottori', 'Shimane', 'Okayama', 'Hiroshima', 'Yamaguchi']
    },
    {
        name: 'Shikoku',
        prefectures: ['Tokushima', 'Kagawa', 'Ehime', 'Kochi']
    },
    {
        name: 'Kyushu',
        prefectures: ['Fukuoka', 'Saga', 'Nagasaki', 'Kumamoto', 'Oita', 'Miyazaki', 'Kagoshima', 'Okinawa']
    }
];

const allPrefecture = japanRegions.map(region => region.prefectures).flat();

window.addEventListener('load', function() {
    const paths = document.querySelectorAll('path');

    allPref();

    paths.forEach(path => {
        path.addEventListener('click', function(event) {
            const name = this.getAttribute('name');

            if(name == choice) right();
            else clic++;
            if(clic >=3) skip();

            const bubble = document.createElement('div');
            bubble.classList.add('bubble');
            bubble.textContent = name;

            bubble.style.left = (event.pageX + 10) + 'px';
            bubble.style.top = (event.pageY + 10) + 'px';

            document.body.appendChild(bubble);

            setTimeout(() => bubble.remove(), 2000);
        });
    });

    const closeButton = document.getElementById('menu-close-button');
    const menuButton = document.getElementById('menu-button');
    const menu = document.getElementById('menu');
    
    menuButton.addEventListener('click', function() {
        menu.classList.toggle('show');
    });

    closeButton.addEventListener('click', function() {
        menu.classList.remove('show');
    });

});

function hokkaido(){
    const paths = document.getElementsByTagName('path');
    for (let i = 0; i < paths.length; i++) {
        if (japanRegions[0].prefectures.includes(paths[i].getAttribute('name'))) {
            paths[i].setAttribute('fill', '#b2e8b0');
        } else {
            paths[i].setAttribute('fill', '#8fc08d');
        }
    }
    current = "hokkaido";
    start();
}
function tohoku() {
    const paths = document.getElementsByTagName('path');
    for (let i = 0; i < paths.length; i++) {
        if (japanRegions[1].prefectures.includes(paths[i].getAttribute('name'))) {
            paths[i].setAttribute('fill', '#b2e8b0');
        } else {
            paths[i].setAttribute('fill', '#8fc08d');
        }
    }
    current = "tohoku";
    start();
}
function kanto() {
    const paths = document.getElementsByTagName('path');
    for (let i = 0; i < paths.length; i++) {
        if (japanRegions[2].prefectures.includes(paths[i].getAttribute('name'))) {
            paths[i].setAttribute('fill', '#b2e8b0');
        } else {
            paths[i].setAttribute('fill', '#8fc08d');
        }
    }
    current = "kanto";
    start();
}
function chubu() {
    const paths = document.getElementsByTagName('path');
    for (let i = 0; i < paths.length; i++) {
        if (japanRegions[3].prefectures.includes(paths[i].getAttribute('name'))) {
            paths[i].setAttribute('fill', '#b2e8b0');
        } else {
            paths[i].setAttribute('fill', '#8fc08d');
        }
    }
    current = "chubu";
    start();
}
function kansai() {
    const paths = document.getElementsByTagName('path');
    for (let i = 0; i < paths.length; i++) {
        if (japanRegions[4].prefectures.includes(paths[i].getAttribute('name'))) {
            paths[i].setAttribute('fill', '#b2e8b0');
        } else {
            paths[i].setAttribute('fill', '#8fc08d');
        }
    }
    current = "kansai";
    start();
}
function chugoku() {
    const paths = document.getElementsByTagName('path');
    for (let i = 0; i < paths.length; i++) {
        if (japanRegions[5].prefectures.includes(paths[i].getAttribute('name'))) {
            paths[i].setAttribute('fill', '#b2e8b0');
        } else {
            paths[i].setAttribute('fill', '#8fc08d');
        }
    }
    current = "chugoku";
    start();
}
function shikoku() {
    const paths = document.getElementsByTagName('path');
    for (let i = 0; i < paths.length; i++) {
        if (japanRegions[6].prefectures.includes(paths[i].getAttribute('name'))) {
            paths[i].setAttribute('fill', '#b2e8b0');
        } else {
            paths[i].setAttribute('fill', '#8fc08d');
        }
    }
    current = "shikoku";
    start();
}
function kyushu() {
    const paths = document.getElementsByTagName('path');
    for (let i = 0; i < paths.length; i++) {
        if (japanRegions[7].prefectures.includes(paths[i].getAttribute('name'))) {
            paths[i].setAttribute('fill', '#b2e8b0');
        } else {
            paths[i].setAttribute('fill', '#8fc08d');
        }
    }
    current = "kyushu";
    start();
}
function allPref() {
    const paths = document.querySelectorAll('path');

    paths.forEach(path => {
        path.setAttribute('fill', '#b2e8b0');
    });
    current = "all";
    start();
}

function start() {

    clic = 0;

    score = 0;

    if(current == "hokkaido"){
        list = japanRegions[0].prefectures.slice();

        let randomIndex = Math.floor(Math.random() * list.length);
        choice = list[randomIndex];
        list.splice(randomIndex, 1);

        document.getElementById('prefecture').textContent = choice;
        document.getElementById('score-value').textContent = score + " / " + japanRegions[0].prefectures.length;
    }
    else if(current == "tohoku"){
        list = japanRegions[1].prefectures.slice();

        let randomIndex = Math.floor(Math.random() * list.length);
        choice = list[randomIndex];
        list.splice(randomIndex, 1);

        document.getElementById('prefecture').textContent = choice;
        document.getElementById('score-value').textContent = score + " / " + japanRegions[1].prefectures.length;
    }
    else if(current == "kanto"){
        list = japanRegions[2].prefectures.slice();

        let randomIndex = Math.floor(Math.random() * list.length);
        choice = list[randomIndex];
        list.splice(randomIndex, 1);

        document.getElementById('prefecture').textContent = choice;
        document.getElementById('score-value').textContent = score + " / " + japanRegions[2].prefectures.length;
    }
    else if(current == "chubu"){
        list = japanRegions[3].prefectures.slice();

        let randomIndex = Math.floor(Math.random() * list.length);
        choice = list[randomIndex];
        list.splice(randomIndex, 1);

        document.getElementById('prefecture').textContent = choice;
        document.getElementById('score-value').textContent = score + " / " + japanRegions[3].prefectures.length;
    }
    else if(current == "kansai"){
        list = japanRegions[4].prefectures.slice();

        let randomIndex = Math.floor(Math.random() * list.length);
        choice = list[randomIndex];
        list.splice(randomIndex, 1);

        document.getElementById('prefecture').textContent = choice;
        document.getElementById('score-value').textContent = score + " / " + japanRegions[4].prefectures.length;
    }
    else if(current == "chugoku"){
        list = japanRegions[5].prefectures.slice();

        let randomIndex = Math.floor(Math.random() * list.length);
        choice = list[randomIndex];
        list.splice(randomIndex, 1);

        document.getElementById('prefecture').textContent = choice;
        document.getElementById('score-value').textContent = score + " / " + japanRegions[5].prefectures.length;
    }
    else if(current == "shikoku"){
        list = japanRegions[6].prefectures.slice();

        let randomIndex = Math.floor(Math.random() * list.length);
        choice = list[randomIndex];
        list.splice(randomIndex, 1);

        document.getElementById('prefecture').textContent = choice;
        document.getElementById('score-value').textContent = score + " / " + japanRegions[6].prefectures.length;
    }
    else if(current == "kyushu"){
        list = japanRegions[7].prefectures.slice();

        let randomIndex = Math.floor(Math.random() * list.length);
        choice = list[randomIndex];
        list.splice(randomIndex, 1);

        document.getElementById('prefecture').textContent = choice;
        document.getElementById('score-value').textContent = score + " / " + japanRegions[7].prefectures.length;
    }
    else if(current == "all"){
        list = allPrefecture.slice();

        let randomIndex = Math.floor(Math.random() * list.length);
        choice = list[randomIndex];
        list.splice(randomIndex, 1);

        document.getElementById('prefecture').textContent = choice;
        document.getElementById('score-value').textContent = score + " / " + allPrefecture.length;
    }
}

function right() {
    score++;
    const paths = document.getElementsByTagName('path');
    for (let i = 0; i < paths.length; i++) {
        if (choice == paths[i].getAttribute('name')) {

            if(clic == 0) paths[i].setAttribute('fill', '#fff');
            else if(clic == 1) paths[i].setAttribute('fill', '#f8fa8e');
            else if(clic == 2) paths[i].setAttribute('fill', '#fad18e');
        }
    }
    game();
}

function skip(){
    const paths = document.getElementsByTagName('path');
    for (let i = 0; i < paths.length; i++) {
        if (choice == paths[i].getAttribute('name')) {
            paths[i].setAttribute('fill', '#ecb3b1');
        }
    }
    game();
}

function game() {

    clic = 0;

    if(current == "hokkaido"){

        let randomIndex = Math.floor(Math.random() * list.length);
        choice = list[randomIndex];
        list.splice(randomIndex, 1);

        document.getElementById('prefecture').textContent = choice;
        document.getElementById('score-value').textContent = score + " / " + japanRegions[0].prefectures.length;
    }
    else if(current == "tohoku"){

        let randomIndex = Math.floor(Math.random() * list.length);
        choice = list[randomIndex];
        list.splice(randomIndex, 1);

        document.getElementById('prefecture').textContent = choice;
        document.getElementById('score-value').textContent = score + " / " + japanRegions[1].prefectures.length;
    }
    else if(current == "kanto"){

        let randomIndex = Math.floor(Math.random() * list.length);
        choice = list[randomIndex];
        list.splice(randomIndex, 1);

        document.getElementById('prefecture').textContent = choice;
        document.getElementById('score-value').textContent = score + " / " + japanRegions[2].prefectures.length;
    }
    else if(current == "chubu"){

        let randomIndex = Math.floor(Math.random() * list.length);
        choice = list[randomIndex];
        list.splice(randomIndex, 1);

        document.getElementById('prefecture').textContent = choice;
        document.getElementById('score-value').textContent = score + " / " + japanRegions[3].prefectures.length;
    }
    else if(current == "kansai"){

        let randomIndex = Math.floor(Math.random() * list.length);
        choice = list[randomIndex];
        list.splice(randomIndex, 1);

        document.getElementById('prefecture').textContent = choice;
        document.getElementById('score-value').textContent = score + " / " + japanRegions[4].prefectures.length;
    }
    else if(current == "chugoku"){

        let randomIndex = Math.floor(Math.random() * list.length);
        choice = list[randomIndex];
        list.splice(randomIndex, 1);

        document.getElementById('prefecture').textContent = choice;
        document.getElementById('score-value').textContent = score + " / " + japanRegions[5].prefectures.length;
    }
    else if(current == "shikoku"){

        let randomIndex = Math.floor(Math.random() * list.length);
        choice = list[randomIndex];
        list.splice(randomIndex, 1);

        document.getElementById('prefecture').textContent = choice;
        document.getElementById('score-value').textContent = score + " / " + japanRegions[6].prefectures.length;
    }
    else if(current == "kyushu"){

        let randomIndex = Math.floor(Math.random() * list.length);
        choice = list[randomIndex];
        list.splice(randomIndex, 1);

        document.getElementById('prefecture').textContent = choice;
        document.getElementById('score-value').textContent = score + " / " + japanRegions[7].prefectures.length;
    }
    else if(current == "all"){

        let randomIndex = Math.floor(Math.random() * list.length);
        choice = list[randomIndex];
        list.splice(randomIndex, 1);

        document.getElementById('prefecture').textContent = choice;
        document.getElementById('score-value').textContent = score + " / " + allPrefecture.length;
    }
}