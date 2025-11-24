// explorar.js

// 🔹 Dados dos posts (podem ser expandidos depois)
const dadosPosts = {
  adm1: {
    nome: "Durval Medeiros Rocha",
    fotoPerfil: "./assetsConnect/explorar/perfil1.jpg", 
    cargo: "Professor",
    escola: "UNICAMP",
    descricao: ""
  },

  agro2: {
    nome: "Epaminondas Ribeiro",
    fotoPerfil: "./assetsConnect/explorar/perfil2.avif",
    cargo: "Professor",
    escola: "UFMG",
    descricao: "..."
  },
  saude3: {
    nome: "Jessica Cunha Fernandes",
    fotoPerfil: "./assetsConnect/explorar/perfil4.jpg",
    cargo: "Aluna",
    escola: "Fatec Americana",
    descricao: ""
  },
  enge2: {
    nome: "Melissa Almeida Costa",
    fotoPerfil: "./assetsConnect/",
    cargo: "Aluna",
    escola: "USP",
    descricao: ""
  },
  ds1: {
    nome: "Thalyta Yasmin Silva",
    fotoPerfil: "./assetsConnect/explorar/perfil3.jpg",
    cargo: "Aluna",
    escola: "Fatec Adamantina",
    descricao: ""
  },
  saude1: {
    nome: "Julia Fernandes Soares",
    fotoPerfil: "./assetsConnect/",
    cargo: "Aluna",
    escola: "UFRJ",
    descricao: ""
  },
  adm3: {
    nome: "Luana Bomfim Santos",
    fotoPerfil: "./assetsConnect/",
    cargo: "Professora",
    escola: "USP",
    descricao: ""
  },
  adm6: {
    nome: "Jessica Meireles",
    fotoPerfil: "./assetsConnect/",
    cargo: "Aluna",
    escola: "FASUPI",
    descricao: ""
  },
  adm2: {
    nome: "Fernanda Ribeiro Cunha",
    fotoPerfil: "./assetsConnect/",
    cargo: "Aluna",
    escola: "UFSC",
    descricao: ""
  },
  agro1: {
    nome: "Antonio Matheus",
    fotoPerfil: "./assetsConnect/",
    cargo: "Professor",
    escola: "UNIFOR",
    descricao: ""
  },
  ds3: {
    nome: "Mike de Carvalho",
    fotoPerfil: "./assetsConnect/",
    cargo: "Aluno",
    escola: "FGV",
    descricao: ""
  },
  ds2: {
    nome: "Rebeca Andrade",
    fotoPerfil: "./assetsConnect/",
    cargo: "Aluna",
    escola: "UFGS",
    descricao: ""
  },
  cozinha1: {
    nome: "Marcelho Hipolito",
    fotoPerfil: "./assetsConnect/",
    cargo: "Aluna",
    escola: "SENAI",
    descricao: ""
  },
  enge1: {
    nome: "Geovana Ribeiro",
    fotoPerfil: "./assetsConnect/",
    cargo: "Aluna",
    escola: "Etec Adolpho Berezin",
    descricao: ""
  },
  cozinha2: {
    nome: "Julia Pinheiro Santos",
    fotoPerfil: "./assetsConnect/aluna2.jpg",
    cargo: "Professor",
    escola: "SENAI",
    descricao: ""
  },

};

// 🔹 Dados padrão idênticos ao perfil
function criarDados(id) {
  return {
    nome: "Maria Andrade",
    fotoPerfil: "./assetsConnect/aluna1.jpg",
    cargo: "Estudante",
    escola: "Etec de Itanhaém",
    descricao: `Conteúdo referente ao post ${id}.`,
    createdAt: new Date().toISOString()
  };
}



// 🔹 CLICK NAS IMAGENS
document.querySelectorAll(".caixa, .caixaG").forEach(img => {
  img.addEventListener("click", () => {
    const id = img.getAttribute("data-id");
    if (!dadosPosts[id]) return;

    const post = {
      imageUrl: img.src,
      content: dadosPosts[id].descricao,
      createdAt: dadosPosts[id].createdAt,
      nome: dadosPosts[id].nome,
      fotoPerfil: dadosPosts[id].fotoPerfil,
      cargo: dadosPosts[id].cargo,
      escola: dadosPosts[id].escola
    };

    abrirModalExplorar(post);
  });
});




// 🔹 MODAL IDÊNTICO AO perfil.js 🔥🔥🔥
function abrirModalExplorar(post) {
  const modal = document.createElement("div");
  modal.classList.add("modal");

  const conteudo = document.createElement("div");
  conteudo.classList.add("modal-conteudo");

  // botão fechar
  const fechar = document.createElement("span");
  fechar.classList.add("fechar");
  fechar.innerHTML = "&times;";
  fechar.addEventListener("click", () => modal.remove());

  // estrutura do post — IGUAL perfil.js
  const item = document.createElement("div");
  item.classList.add("postagem");

  const contentText = post.content || "";
  const truncated = contentText.length > 150 ? contentText.substring(0, 150) + "..." : contentText;

  item.innerHTML = `
    <div class="perfilPost">
      <img src="${post.fotoPerfil}" class="fotoPost">
      <div class="infosPost">
        <div class="cabecalho">
          <div class="nome-bloco">
            <div class="linha"></div>
            <span class="nome">${post.nome}</span>
            <div class="detalhes">
              <span>${post.cargo}</span>
              <span>${post.escola}</span>
            </div>
          </div>
            <span class="tempo">· ${Math.floor(Math.random() * 59) + 1} min</span>
        </div>
      </div>
    </div>

    <img src="${post.imageUrl}" class="imagem">

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


  // 🔸 Ler mais (igual perfil.js)
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

  modal.addEventListener("click", e => {
    if (e.target === modal) modal.remove();
  });
}
