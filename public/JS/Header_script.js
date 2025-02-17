const navbar = document.querySelector('.navbar');
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('nav-links');

let lastScroll = 0;


window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY; // Usando scrollY em vez de pageYOffset

    // Esconder a navbar ao rolar para baixo
    if (currentScroll > lastScroll && currentScroll > 50) {
        navbar.classList.add('hidden');
    } 
    // Mostrar a navbar ao rolar para cima
    else if (currentScroll < lastScroll) {
        navbar.classList.remove('hidden');
    }

    lastScroll = currentScroll;
});

hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('active');
});