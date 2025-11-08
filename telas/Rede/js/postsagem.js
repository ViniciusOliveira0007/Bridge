async function carregarPosts() {
  try {
    const res = await fetch('/api/posts');
    if (!res.ok) throw new Error('Falha ao buscar posts');
    const posts = await res.json();

    const feed = document.getElementById('feed');
    if (!feed) {
      console.error("Elemento #feed não encontrado!");
      return;
    }

    feed.innerHTML = '';

    posts.forEach(post => {
      const item = document.createElement('div');
      item.classList.add('postagem');

      const imageHtml = post.imageUrl ? `<img src="${post.imageUrl}" class="imagem">` : '';

      const contentText = post.content || '';
      const truncated = contentText.length > 150 ? contentText.substring(0, 150) + "..." : contentText;

      item.innerHTML = `
        <div class="perfilPost">
          <img src="./assetsConnect/Rodrigo.jpg" class="fotoPost">
          <div class="infosPost">
            <div class="cabecalho">
              <div class="nome-bloco">
                <div class="linha"></div>
                <span class="nome">Rodrigo_Santos54</span>
                <div class="detalhes">
                  <span>Aluno</span>
                  <span>Etec</span>
                </div>
              </div>
              <span class="tempo">· ${new Date(post.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>

        ${imageHtml}

        <div class="reacoes">
          <div class="reacoesPrincipais">
            <div class="reacao"><span class="iconeSimples">favorite</span></div>
            <div class="reacao"><span class="iconeSimples">chat</span></div>
            <div class="reacao"><span class="iconeSimples">send</span></div>
          </div>
          <div class="reacao"><span class="iconeSimples">star</span></div>
        </div>

        <p class="comentario-post">${truncated}</p>
        ${contentText.length > 150 ? `<span class="ler-mais" data-completo="${contentText.replace(/"/g, '&quot;')}">Ler mais</span>` : ""}
      `;

      // ⚙️ Evento "Ler mais"
      const lerMaisBtn = item.querySelector(".ler-mais");
      if (lerMaisBtn) {
        lerMaisBtn.addEventListener("click", () => {
          const p = item.querySelector(".comentario-post");
          p.classList.add("expandido"); // remove o limite visual
          p.textContent = contentText;  // mostra o texto completo
          lerMaisBtn.remove();          // remove o botão
        });
      }

      feed.appendChild(item);
    });
  } catch (err) {
    console.error("Erro ao carregar posts:", err);
  }
}

document.addEventListener("DOMContentLoaded", carregarPosts);