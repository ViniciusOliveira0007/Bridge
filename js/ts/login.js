"use strict";
const btnEntrar = document.getElementById('btnEntrar');
const telaInicial = document.getElementById('tela-inicial');
const janela = document.getElementById('janela');
const containerTelaInicial = document.getElementById('container-tela-inicial');
btnEntrar.addEventListener('click', () => {
    // Add your login logic here
    console.log('Login button clicked');
    telaInicial.classList.add('ativo');
    janela.classList.add('ativo');
    containerTelaInicial.classList.add('ativo');
});
