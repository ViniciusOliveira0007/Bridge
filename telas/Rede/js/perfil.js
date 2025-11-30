// perfil.js
async function carregarPostsPerfil() {
  try {
    const res = await fetch('/api/posts');
    if (!res.ok) throw new Error('Erro ao buscar posts');
    const posts = await res.json();

    const grupo1 = document.getElementById('grupo1');
    if (!grupo1) {
      console.error("Elemento #grupo1 não encontrado!");
      return;
    }

    grupo1.innerHTML = '';

    const agrupamento = document.createElement('div');
    agrupamento.classList.add('agrupamento');

    const blocos = document.createElement('div');
    blocos.classList.add('blocos');

    let bloco = document.createElement('div');
    bloco.classList.add('bloco');

    // Carrega as imagens para calcular proporção
    const promessas = posts.map(post => {
      return new Promise(resolve => {
        if (!post.imageUrl) return resolve(null);

        const img = new Image();
        img.src = post.imageUrl;
        img.onload = () => {
          const proporcao = img.width / img.height;
          resolve({ ...post, proporcao, image: img });
        };
        img.onerror = () => resolve(null);
      });
    });

    const postsComProporcao = (await Promise.all(promessas)).filter(Boolean);

    // Verifica se há imagem vertical para ser a caixaG
    const vertical = postsComProporcao.find(p => p.proporcao < 0.9);
    const caixaG = vertical ? criarCaixaG(vertical) : null;

    const postsMenores = vertical
      ? postsComProporcao.filter(p => p !== vertical)
      : postsComProporcao;

    // Cria as miniaturas
    postsMenores.forEach((post, index) => {
      const caixa = document.createElement('div');
      caixa.classList.add('caixa');

      const img = document.createElement('img');
      img.src = post.image.src;
      img.alt = post.title || 'Post';
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      img.style.borderRadius = '20px';
      img.style.cursor = 'pointer';

      // 🔹 Ao clicar, abre modal com estrutura de postagem.js
      caixa.addEventListener('click', () => abrirModalPostagem(post));

      caixa.appendChild(img);
      bloco.appendChild(caixa);

      if ((index + 1) % 2 === 0) {
        blocos.appendChild(bloco);
        bloco = document.createElement('div');
        bloco.classList.add('bloco');
      }
    });

    if (bloco.childNodes.length > 0) blocos.appendChild(bloco);

    agrupamento.appendChild(blocos);

    if (caixaG) {
      agrupamento.appendChild(caixaG);
      agrupamento.classList.add('com-caixaG');
    } else {
      agrupamento.classList.add('sem-caixaG');
    }

    grupo1.appendChild(agrupamento);

  } catch (err) {
    console.error('Erro ao carregar posts no perfil:', err);
  }
}

// 🔹 Caixa grande (vertical)
function criarCaixaG(post) {
  const caixaG = document.createElement('div');
  caixaG.classList.add('caixaG');

  const img = document.createElement('img');
  img.src = post.image.src;
  img.alt = 'Destaque';
  img.style.width = '100%';
  img.style.height = '100%';
  img.style.objectFit = 'cover';
  img.style.borderRadius = '20px';
  img.style.cursor = 'pointer';

  caixaG.addEventListener('click', () => abrirModalPostagem(post));
  caixaG.appendChild(img);
  return caixaG;
}

// 🔹 Função para abrir o modal no estilo do postagem.js
function abrirModalPostagem(post) {
  const modal = document.createElement('div');
  modal.classList.add('modal');

  const conteudo = document.createElement('div');
  conteudo.classList.add('modal-conteudo');

  // 🔹 Fechar modal
  const fechar = document.createElement('span');
  fechar.classList.add('fechar');
  fechar.innerHTML = '&times;';
  fechar.addEventListener('click', () => modal.remove());

  // 🔸 Estrutura idêntica ao postagem.js
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
            <span class="nome">Rodrigo Junior</span>
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

  // Função “Ler mais”
  const lerMaisBtn = item.querySelector(".ler-mais");
  if (lerMaisBtn) {
    lerMaisBtn.addEventListener("click", () => {
      const p = item.querySelector(".comentario-post");
      p.classList.add("expandido");
      p.textContent = contentText;
      lerMaisBtn.remove();
    });
  }

  conteudo.appendChild(fechar);
  conteudo.appendChild(item);
  modal.appendChild(conteudo);

  document.body.appendChild(modal);

  // 🔹 Fecha modal ao clicar fora do conteúdo
  modal.addEventListener('click', e => {
    if (e.target === modal) modal.remove();
  });
}

// 🔹 Evento inicial
document.addEventListener('DOMContentLoaded', carregarPostsPerfil);
