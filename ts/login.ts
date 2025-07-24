const btnEntrar = document.getElementById('btnEntrar') as HTMLButtonElement;
const telaInicial = document.getElementById('tela-inicial') as HTMLElement;
const janela = document.getElementById('janela') as HTMLButtonElement;
const containerTelaInicial = document.getElementById('container-tela-inicial') as HTMLElement;



btnEntrar.addEventListener('click', () => {
  // Add your login logic here
  console.log('Login button clicked');

  telaInicial.classList.add('ativo');
  janela.classList.add('ativo');
  containerTelaInicial.classList.add('ativo');

  
});

