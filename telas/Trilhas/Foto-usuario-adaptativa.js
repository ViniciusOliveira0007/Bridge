/**
 * Gerenciador de Perfil de Usuário
 * Script unificado para gerenciar foto de perfil e dados do usuário em todas as páginas
 */

const UserProfileManager = {
    API_URL: 'http://localhost:3000/api',
    URL_PADRAO: './imagens-diario/foto_de_perfil.png',
    
    /**
     * Inicializa o gerenciador de perfil
     */
    async init() {
        // Verificar login
        const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
        
        if (!usuarioLogado || !usuarioLogado.id) {
            alert('Você precisa fazer login primeiro!');
            window.location.href = '/home.html';
            return;
        }

        // Carregar dados do usuário
        await this.carregarDadosUsuario(usuarioLogado.id);
        
        // Configurar dropdowns
        this.configurarDropdowns();
    },

    /**
     * Carrega os dados do usuário da API
     */
    async carregarDadosUsuario(userId) {
        try {
            const response = await fetch(`${this.API_URL}/users/${userId}`);
            const data = await response.json();
            
            if (data.success && data.user) {
                this.atualizarInterface(data.user);
                
                // Atualizar localStorage
                localStorage.setItem('usuarioLogado', JSON.stringify(data.user));
            }
        } catch (error) {
            console.error('Erro ao carregar dados do usuário:', error);
            // Em caso de erro, usar dados do localStorage
            const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
            if (usuarioLogado) {
                this.atualizarInterface(usuarioLogado);
            }
        }
    },

    /**
     * Atualiza a interface com os dados do usuário
     */
    atualizarInterface(user) {
        // Atualizar nome do usuário
        const nomeUsuarioPerfil = document.getElementById('nomeUsuarioPerfil');
        const saudacao = document.getElementById('saudacao');
        
        if (nomeUsuarioPerfil) {
            nomeUsuarioPerfil.textContent = `Olá, ${user.name || 'Usuário'}`;
        }
        
        if (saudacao) {
            saudacao.textContent = `Bem-vindo ${user.name || 'Usuário'}!`;
        }

        // Atualizar fotos de perfil
        const fotoUrl = user.perfilUrl ? `http://localhost:3000${user.perfilUrl}` : this.URL_PADRAO;
        
        // Atualizar todas as imagens de perfil na página
        const fotoPerfil = document.querySelector('.foto-de-perfil');
        const fotoPerfilMini = document.querySelector('.perfil-mini');
        const fotoPerfilDiario = document.getElementById('fotoPerfilDiario');
        
        if (fotoPerfil) fotoPerfil.src = fotoUrl;
        if (fotoPerfilMini) fotoPerfilMini.src = fotoUrl;
        if (fotoPerfilDiario) fotoPerfilDiario.src = fotoUrl;
    },

    /**
     * Configura os dropdowns de navegação
     */
    configurarDropdowns() {
        const dropdownNotif = document.getElementById('dropdownNotif');
        const dropdownConfig = document.getElementById('dropdownConfig');
        const dropdownPerfil = document.getElementById('dropdownPerfil');
        const btnNotif = document.querySelector('.btn-notificao-nav');
        const btnConfig = document.querySelector('.btn-config');
        const btnPerfil = document.querySelector('.foto-de-perfil');
        
        // Funções para fechar dropdowns
        const fecharDropdownNotif = () => dropdownNotif?.classList.remove('ativo');
        const fecharDropdownConfig = () => dropdownConfig?.classList.remove('ativo');
        const fecharDropdownPerfil = () => dropdownPerfil?.classList.remove('ativo');
        
        // Event listeners para abrir dropdowns
        btnNotif?.addEventListener('click', () => {
            fecharDropdownConfig();
            fecharDropdownPerfil();
            dropdownNotif?.classList.toggle('ativo');
        });
        
        btnConfig?.addEventListener('click', () => {
            fecharDropdownNotif();
            fecharDropdownPerfil();
            dropdownConfig?.classList.toggle('ativo');
        });
        
        btnPerfil?.addEventListener('click', () => {
            fecharDropdownNotif();
            fecharDropdownConfig();
            dropdownPerfil?.classList.toggle('ativo');
        });
        
        // Event listeners para ações dos dropdowns
        document.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', function() {
                const action = this.getAttribute('data-action');
                switch(action) {
                    case 'fechar-notif': 
                        fecharDropdownNotif(); 
                        break;
                    case 'fechar-config': 
                        fecharDropdownConfig(); 
                        break;
                    case 'fechar-perfil': 
                        fecharDropdownPerfil(); 
                        break;
                    case 'sair-da-conta':
                        if (confirm('Tem certeza que deseja sair da conta?')) {
                            localStorage.removeItem('usuarioLogado');
                            window.location.href = '/home.html';
                        }
                        fecharDropdownPerfil();
                        break;
                    default:
                        alert(`Funcionalidade '${action.replace('abrir-', '')}' será implementada`);
                        fecharDropdownConfig(); 
                        fecharDropdownPerfil();
                        break;
                }
            });
        });
        
        // Fechar dropdowns ao clicar fora
        document.addEventListener('click', (event) => {
            if (!dropdownNotif?.contains(event.target) && event.target !== btnNotif &&
                !dropdownConfig?.contains(event.target) && event.target !== btnConfig &&
                !dropdownPerfil?.contains(event.target) && event.target !== btnPerfil) {
                fecharDropdownNotif();
                fecharDropdownConfig();
                fecharDropdownPerfil();
            }
        });
    }
};

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    UserProfileManager.init();
});