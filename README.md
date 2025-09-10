# xadrez# Projeto de Xadrez

Este é um projeto de jogo de xadrez desenvolvido para ser executado diretamente no navegador. Ele oferece uma interface interativa para jogar xadrez, com movimentação de peças e regras básicas do jogo implementadas.

## Funcionalidades

- Tabuleiro de xadrez interativo.
- Movimentação de peças de xadrez (peões, torres, cavalos, bispos, rainhas e reis).
- Validação de lances (incluindo movimentos especiais como roque e *en passant*).
- Captura de peças.
- Detecção de xeque.
- Interface visual simples e responsiva.

## Tecnologias Utilizadas

- **HTML5**: Estrutura básica da página web.
- **CSS3**: Estilização do tabuleiro e das peças, utilizando [Tailwind CSS](https://tailwindcss.com/) via CDN para um desenvolvimento rápido e responsivo.
- **JavaScript**: Lógica principal do jogo, incluindo a manipulação do tabuleiro virtual, regras de movimentação das peças, detecção de xeque e interações do usuário.

## Como Rodar o Projeto Localmente

Para executar este projeto em sua máquina local, siga os passos abaixo:

1.  **Clone o repositório** (se ainda não o fez):
    ```bash
    git clone <URL_DO_SEU_REPOSITORIO>
    ```
    (Substitua `<URL_DO_SEU_REPOSITORIO>` pelo URL real do seu repositório Git.)

2.  **Navegue até o diretório do projeto**:
    ```bash
    cd xadrez
    ```

3.  **Abra o arquivo `index.html` no seu navegador web preferido.**
    Você pode fazer isso arrastando o arquivo `index.html` para a janela do navegador ou clicando duas vezes nele.

O jogo será carregado e você poderá começar a jogar.

## Estrutura do Projeto

- `index.html`: O arquivo HTML principal que contém a estrutura do tabuleiro.
- `script.js`: O arquivo JavaScript que contém toda a lógica do jogo.
- `img/`: Pasta que contém as imagens das peças de xadrez.
- `.gitignore`: Arquivo para ignorar arquivos e diretórios específicos do controle de versão do Git.

## Contribuição

Contribuições são bem-vindas! Se você deseja melhorar este projeto, sinta-se à vontade para:

1.  Fazer um fork do repositório.
2.  Criar uma nova branch (`git checkout -b feature/sua-feature`).
3.  Fazer suas alterações e commitar (`git commit -m 'Adiciona nova feature'`).
4.  Enviar para a branch original (`git push origin feature/sua-feature`).
5.  Abrir um Pull Request.

## Licença

Este projeto está licenciado sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes. (Assumindo licença MIT, se houver outra, por favor, atualize.)

---