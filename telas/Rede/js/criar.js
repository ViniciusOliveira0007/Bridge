document.getElementById('btn-selecionar').addEventListener('click', () => { 
  document.getElementById('file').click();
});

// 🌆 Preview da imagem selecionada
const fileInput = document.getElementById('file');
const previewImagem = document.getElementById('previewImagem');

fileInput.addEventListener('change', () => {
  const arquivo = fileInput.files[0];
  if (arquivo) {
    console.log("Imagem selecionada:", arquivo.name); // debug
    const urlTemporaria = URL.createObjectURL(arquivo);
    previewImagem.src = urlTemporaria;
    previewImagem.style.objectFit = 'cover';
    previewImagem.style.borderRadius = '15px';
  } else {
    console.log("Nenhum arquivo selecionado"); // debug
    previewImagem.src = 'assetsConnect/files.png';
    previewImagem.style.objectFit = 'contain';
  }
});

document.getElementById('btn-publicar').addEventListener('click', async () => {
  const title = document.getElementById('title').value;
  const content = document.getElementById('content').value;
  const file = fileInput.files && fileInput.files[0];
  const authorId = 1; // substituir pelo ID do usuário logado

  if (!title.trim()) {
    alert("Digite um título para o post!");
    return;
  }

  const formData = new FormData();
  formData.append('title', title);
  formData.append('content', content);
  formData.append('authorId', authorId);
  if (file) formData.append('image', file);

  try {
    const res = await fetch('/api/posts', {
      method: 'POST',
      body: formData
    });

    if (res.ok) {
      alert('Post criado com sucesso!');
      window.location.href = '/telas/Rede/connect.html';
    } else {
      const err = await res.json();
      alert('Erro ao criar o post: ' + (err.error || ''));
    }
  } catch (err) {
    console.error('Erro ao enviar post:', err);
    alert('Erro na requisição.');
  }
});
