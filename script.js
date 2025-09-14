
/**
 * Representa o tabuleiro virtual do jogo.
 * 
 * Estrutura: matriz 8x8 onde cada célula pode conter:
 * - null (casa vazia)
 * - objeto peça { name, type, positions, color, symbol, pathImg }
 * 
 * É atualizado a cada movimento para refletir o estado atual da partida.
 */
let VIRTUAL_BOARD = initializeVirtualBoard();

/**
 * Representa a matriz de ataque.
 * 
 * Estrutura: matriz 8x8 de Sets, onde cada célula indica
 * quais cores atacam aquela posição (ex: {"white"}, {"black"}, ou {"white","black"}).
 * 
 */
let ATTACK_BOARD = initializeAttackBoard();

/**
 * Representação do tabuleiro inicial em FEN expandido.
 * Cada linha é uma string de 8 caracteres:
 * - Maiúsculas = peças brancas
 * - Minúsculas = peças pretas
 * - "." = casa vazia
 */
const INITIAL_POSITIONS = [
    "rnbqkbnr", // linha 0 (pretas)
    "pppppppp", // linha 1
    "........", // linha 2
    "........", // linha 3
    "........", // linha 4
    "........", // linha 5
    "PPPPPPPP", // linha 6
    "RNBQKBNR"  // linha 7 (brancas)
];

/**
 * Definições dos tipos de peças:
 * - name: Nome da peça
 * - type: Identificador interno
 * - symbol: Unicode do xadrez
 * - img: Arquivo de imagem
 */
const PIECE_TYPES = {
    PAWN: { name: "Peão", type: "pawn", symbol: "♟", img: "p.png" },
    ROOK: { name: "Torre", type: "rook", symbol: "♜", img: "r.png" },
    KNIGHT: { name: "Cavalo", type: "knight", symbol: "♞", img: "n.png" },
    BISHOP: { name: "Bispo", type: "bishop", symbol: "♝", img: "b.png" },
    QUEEN: { name: "Rainha", type: "queen", symbol: "♕", img: "q.png" },
    KING: { name: "Rei", type: "king", symbol: "♚", img: "k.png" }
};

/**
 * Define se as casas devem ser destacadas ou não.
 */
let SHOW_HIGHLIGHT = true;

// ----------------- INICIALIZAÇÃO
/**
 * Inicia o jogo:
 * - Cria o tabuleiro
 * - Posiciona as peças iniciais
 */
function startGame() {
    createBoard();
    addPieces();
    updateTurnInUI();
};

/**
 * Cria o tabuleiro lógico (8x8) vazio.
 * Cada célula começa como null.
 * 
 * @return {Array<Array<null>>} Matriz 8x8 representando o tabuleiro virtual.
 */
function initializeVirtualBoard() {
    return Array(8).fill(null).map(() => Array(8).fill(null));
};

/**
 * Cria a matriz de ataques (8x8).
 * Cada célula contém um Set() com cores que atacam aquela casa.
 * 
 * @return {Array<Array<Set>>} Matriz 8x8 com conjuntos de atacantes por célula.
 */
function initializeAttackBoard() {
    return Array(8).fill(null).map(() => Array(8).fill(null).map(() => new Set()));

};

// ----------------- CRIAÇÃO DO TABULEIRO
/**
 * Cria o tabuleiro de xadrez no DOM (8x8).
 * - Cada célula é um <div> com classes de estilo e posição.
 * - Adiciona identificadores como [row,col] e notação de xadrez (a1..h8).
 * - Inclui rótulos de letras (a–h) e números (1–8) nas bordas.
 * - Conecta cada célula ao evento `cellClicked`.
 * 
 * @return {void}
 */
function createBoard() {
    const board = document.getElementById("board");
    
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const cell = createCell(row, col);
            board.appendChild(cell);
        }
    }
};

/**
 * Cria uma célula do tabuleiro (div) com estilos e posição.
 * - Adiciona classes CSS para estilo e posição.
 * - Adiciona identificadores como [row,col] e notação de xadrez (a1..h8).
 * - Inclui rótulos de letras (a–h) e números (1–8) nas bordas.
 * - Conecta cada célula ao evento `cellClicked`.
 * 
 * @param {number} row - Linha da célula (0–7).
 * @param {number} col - Coluna da célula (0–7).
 * @returns {HTMLDivElement} Célula do tabuleiro criada.
 */
function createCell(row, col) {
    const { bg, text } = getBoardCellColors(row, col);
    const letters = "abcdefgh".split("");

    const cell = document.createElement("div");
    cell.classList.add(
        "relative", "w-full", "h-full", "flex", "flex-col",
        "justify-center", "items-center", "cell", bg, text
    );
    cell.dataset.position = [row, col];
    cell.dataset.id = letters[col] + (8 - row);

    // --- Append centralizado ---
    [
        createCoordElement(row, col, text),
        createLetterElement(row, col, letters, text),
        createNumberElement(row, col, text)
    ]
    .filter(Boolean) // remove nulls
    .forEach(el => cell.appendChild(el));

    // Clique
    cell.addEventListener("click", (e) => {
        e.stopPropagation();
        cellClicked(e, [row, col]);
    });

    return cell;
};

/**
 * Cria um elemento <span> com o texto em formato [linha, coluna]
 * que representa a posição da célula no tabuleiro.
 * - Adiciona classes CSS para posicionar o elemento no canto superior esquerdo e definir o tamanho da fonte.
 * - Adiciona o elemento à célula.
 * 
 * @param {number} row - Linha da célula (0–7).
 * @param {number} col - Coluna da célula (0–7).
 * @param {string} extraClass - Classe CSS adicional para o elemento <span>.
 * 
 * @returns {HTMLSpanElement} Elemento <span> criado.
 */
function createCoordElement(row, col, extraClass) {
    const span = document.createElement("span");
    span.textContent = `[${row}, ${col}]`;
    span.classList.add("absolute", "top-1", "text-[0.4rem]", "sm:text-[0.6rem]", extraClass);
    return span;
};

/**
 * Cria um elemento <span> com o texto em formato [letra] que representa
 * a coluna da célula no tabuleiro.
 * - Adiciona classes CSS para posicionar o elemento no canto inferior direito e definir o tamanho da fonte.
 * - Adiciona o elemento à célula.
 * - Retorna null se a linha for diferente de 7.
 * 
 * @param {number} row - Linha da célula (0–7).
 * @param {number} col - Coluna da célula (0–7).
 * @param {string[]} letters - Array com as letras do alfabeto (a–h).
 * @param {string} extraClass - Classe CSS adicional para o elemento <span>.
 * 
 * @returns {HTMLSpanElement | null} Elemento <span> criado ou null se a linha for diferente de 7.
 */
function createLetterElement(row, col, letters, extraClass) {
    if (row !== 7) return null;
    const span = document.createElement("span");
    span.textContent = letters[col];
    span.classList.add("absolute", "text-[0.5rem]", "sm:text-[0.9rem]", "right-1", "bottom-1", extraClass);
    return span;
};

/**
 * Cria um elemento <span> com o texto em formato [número] que representa
 * a linha da célula no tabuleiro.
 * - Adiciona classes CSS para posicionar o elemento no canto superior esquerdo e definir o tamanho da fonte.
 * - Adiciona o elemento à célula.
 * - Retorna null se a coluna for diferente de 0.
 * 
 * @param {number} row - Linha da célula (0–7).
 * @param {number} col - Coluna da célula (0–7).
 * @param {string} extraClass - Classe CSS adicional para o elemento <span>.
 * 
 * @returns {HTMLSpanElement | null} Elemento <span> criado ou null se a coluna for diferente de 0.
 */
function createNumberElement(row, col, extraClass) {
    if (col !== 0) return null;
    const span = document.createElement("span");
    span.textContent = 8 - row;
    span.classList.add("absolute", "text-[0.5rem]", "sm:text-[0.7rem]", "left-1", "top-1", extraClass);
    return span;
};

// ----------------- PEÇAS
/**
 * Cria peças de xadrez a partir de uma matriz FEN expandida (8x8).
 * - Maiúsculas = peças brancas, minúsculas = pretas, "." = vazio.
 * - Retorna no formato compatível com `addPieces`.
 *
 * @param {string[]} positionsFEN - Array de 8 strings representando o tabuleiro.
 * @returns {Object[]} Lista de peças com {name, type, symbol, color, positions, pathImg}.
 *
 */
function createPiecesWithFEN(positionsFEN, pieceTypes) {
    const typeMap = {
        p: pieceTypes.PAWN,
        r: pieceTypes.ROOK,
        n: pieceTypes.KNIGHT,
        b: pieceTypes.BISHOP,
        q: pieceTypes.QUEEN,
        k: pieceTypes.KING
    };

    const pieces = [];

    positionsFEN.forEach((row, r) => {
        row.split("").forEach((char, c) => {
            if (char === ".") return;

            const isWhite = char === char.toUpperCase();
            const type = typeMap[char.toLowerCase()];

            pieces.push({
                ...type,
                color: isWhite ? "white" : "black",
                positions: [[r, c]], // compatível com addPieces
                symbol: type.symbol,
                pathImg: `./img/pieces/${isWhite ? "white" : "black"}/${type.img}`
            });
        });
    });

    return pieces;
};

/**
 * Adiciona as peças ao tabuleiro do DOM e atualiza o tabuleiro virtual.
 * - Funciona com `PIECES` tradicional (white/black) ou FEN (`PIECES.all`).
 * - Para cada peça:
 *   - Cria a imagem correspondente
 *   - Atualiza a posição no tabuleiro virtual via `updateVirutualBoardPosition`
 *
 * @return {void}
 */
function addPieces() {
    let pieces = createPiecesWithFEN(INITIAL_POSITIONS, PIECE_TYPES);

    if (!pieces.length) return;

    pieces.forEach(piece => {
        const { name, pathImg, type, color, symbol } = piece;

        piece.positions.forEach((position) => {
            const cell = document.querySelector(`[data-position="${position.join(",")}"]`);
            if (cell) {
                const img = document.createElement("img");
                img.classList.add(
                    "absolute",
                    "bottom-0",
                    "flex",
                    "w-[3rem]",
                    "sm:w-[3.5rem]",
                    "h-[3rem]",
                    "sm:h-[3.5rem]",
                    "object-contain",
                    "cursor-grab",
                    "active:cursor-grabbing"
                );
                img.dataset.id = position;
                img.src = pathImg;
                img.alt = name;

                updateVirutualBoardPosition(position, position, piece);

                cell.appendChild(img);
            }
        });
    });
};

// ----------------- CLICKS E MOVIMENTOS
/**
 * Trata o clique em uma célula do tabuleiro.
 * - Se não houver peça selecionada e a célula estiver vazia, apenas loga uma mensagem.
 * - Se houver uma peça do jogador atual, seleciona a peça e destaca os possíveis movimentos.
 * - Se houver uma peça selecionada e a célula clicada for válida:
 *   - Detecta se é roque e executa `executeCastle`.
 *   - Caso contrário, executa movimento normal via `movePiece`.
 *
 * @param {Event} event - Evento de clique.
 * @param {Array<number>} position - Posição da célula clicada [row, col].
 */
function cellClicked(event, position) {
    event.stopPropagation();
    const clickedPiece = getPiecePositionOnVirtualBoard(position);
    const selectedPiece = GameState.get("selectedPiece");
    const currentPlayer = GameState.get("currentPlayer");

    // --- Nenhuma peça clicada e nenhuma selecionada ---
    if (!clickedPiece && !selectedPiece) {
        return;
    }

    // --- Clique em peça do jogador atual (seleção) ---
    if (clickedPiece && clickedPiece.color === currentPlayer) {
        GameState.set({ selectedPiece: clickedPiece });
        highlightMovesForPiece(clickedPiece, position);
        highlightSelectedCell(position);
        return;
    }

    // --- Tentativa de jogada com peça já selecionada ---
    if (selectedPiece) {
        const fromPosition = selectedPiece.positions[0];
        const toPosition = position;

        // --- Movimento normal ---
        validateMove(fromPosition, toPosition);
    }
};


/**
 * Valida e executa um movimento de peça no tabuleiro.
 * - Verifica se o movimento é válido via `isValidateMove`.
 * - Verifica se o movimento deixa o rei em xeque via `isMoveSafe`.
 * - Se for o rei, verifica se o movimento é um roque via `canCastle`.
 * - Se for um peão, verifica se o movimento é uma captura En Passant via `handleEnPassant`.
 * - Se for um peão que alcanou o fim do tabuleiro, abre um prompt para escolha da peça.
 * - Caso contrário, executa o movimento via `executeMove`.
 *
 * @param {number[]} fromPosition - Posição inicial [linha, coluna] da peça.
 * @param {number[]} toPosition - Posição de destino [linha, coluna].
 * 
 * @returns {void}
 */
function validateMove(fromPosition, toPosition) {
    const piece = getPiecePositionOnVirtualBoard(fromPosition);
    const currentPlayer = GameState.get("currentPlayer");

    if (!piece) return;

    const isValidMove = isValidateMove(fromPosition, toPosition, piece);

    if (!isValidMove) {
        openModal(`⛔${piece.symbol}(${piece.name}) Movimento ilegal para!`);
        return;
    }

    if (!isMoveSafe(fromPosition, toPosition, currentPlayer)) {
        openModal(`⛔${piece.symbol} Movimento ilegal! Seu rei ficaria em xeque.`);

        clearSelectedPiece();
        clearMoveHighlights();

        return;
    }

    if (piece.type === "king" && Math.abs(toPosition[1] - fromPosition[1]) === 2) {
        if (isKingInInitialPosition(piece.color) &&
            canCastle(fromPosition, toPosition, piece.color)) {
            executeCastle(fromPosition, toPosition, piece.color);
        } else {
            openModal("❌ Roque inválido!");
        }
        return;
    }

    if (piece.type === 'pawn') {
        handleEnPassant(fromPosition, toPosition);

        if (promptPawnPromotion(fromPosition, toPosition, piece.color)) {
            // ⚠️ interrompe o fluxo para esperar escolha da peça
            return;
        }
    }

    executeMove(fromPosition, toPosition, piece);
};


/**
 * Executa um movimento de peça no tabuleiro.
 * - Atualiza o estado do jogo para armazenar o último movimento duplo de um peão.
 * - Captura as peças oponentes que estiverem na cela de destino.
 * - Atualiza o DOM para representar o movimento.
 * - Atualiza o tabuleiro virtual para representar o movimento.
 * - Atualiza a posição do rei.
 * - Atualiza o tabuleiro de ataque.
 * - Verifica se o rei de oponente ficou em xeque.
 * - Atualiza a UI e controle de jogo.
 *
 * @param {number[]} fromPosition - Posição atual da peça [linha, coluna].
 * @param {number[]} toPosition - Posição de destino da peça [linha, coluna].
 * 
 * @param {Object} piece - Peça a ser movida.
 */
function executeMove(fromPosition, toPosition, piece) {
    const fromSelector = `[data-position="${fromPosition.join(",")}"]`;
    const toSelector = `[data-position="${toPosition.join(",")}"]`;
    const fromCell = document.querySelector(fromSelector);
    const toCell = document.querySelector(toSelector);
    const opponentColor = piece.color === "white" ? "black" : "white";

    // 1. Regras de movimento
    setLastPawnDoubleMove(fromPosition, toPosition, piece);
    captureOpponentPiecesIfExists(toCell);

    // 2. Atualiza DOM
    movePieceElement(fromCell, toCell);

    // 3. Atualiza tabuleiro virtual
    updateVirutualBoardPosition(fromPosition, toPosition, piece);

    // 4. Atualiza posição do rei.
    setKingPosition(piece, toPosition);

    // 5. Atualiza tabuleiro de ataque
    // TODO ~ Implementar tabuleiro de ataque

    // 6. Verifica se o rei de oponente ficou em xeque
    if (isKingInCheck(opponentColor)) {
        openModal(`🚨 Xeque no rei ${opponentColor}!`)
    }

    // 7. UI e controle de jogo
    clearMoveHighlights();
    clearSelectedPiece();
    toggleCurrentPlayer();
};

/**
 * Move a peça no DOM de uma célula para outra.
 * - Remove a imagem da peça da célula de origem.
 * - Adiciona a imagem na célula de destino.
 *
 * @param {HTMLElement} fromCell - Célula de origem.
 * @param {HTMLElement} toCell - Célula de destino.
 */
function movePieceElement(fromCell, toCell) {
    const pieceImg = fromCell.querySelector("img");
    if (!pieceImg) return;

    fromCell.removeChild(pieceImg);
    toCell.appendChild(pieceImg);
};

/**
 * Remove a peça adversária da célula de destino, se houver.
 *
 * @param {HTMLElement} toCell - Célula de destino que pode conter uma peça adversária.
 * @returns {void}
 */
function captureOpponentPiecesIfExists(toCell) {
    const targetImg = toCell.querySelector('img');
    if (targetImg) targetImg.remove();
};

/**
 * Destaca visualmente no tabuleiro os movimentos possíveis de uma peça.
 *
 * @param {Object} piece - Objeto da peça a ser movida.
 * @param {number[]} position - Posição atual da peça [linha, coluna].
 * @returns {void}
 */
function highlightMovesForPiece(piece, position) {
    if (!SHOW_HIGHLIGHT) return;

    const newPossibleMoves = getPossibleMoves(position, piece);

    clearMoveHighlights();

    newPossibleMoves.forEach((move) => {
        const cell = document.querySelector(`[data-position="${move.join(",")}"]`);
        if (cell) {
            const circle = document.createElement("div");
            circle.classList.add(
                "moves-circle",
                "absolute",
                "w-3",
                "h-3",
                "bg-indigo-500",
                "rounded-full",
                "absolute",
                "top-1/2",
                "left-1/2",
                "transform",
                "-translate-x-1/2",
                "-translate-y-1/2",
                "opacity-80"
            );
            cell.appendChild(circle);
        }
    });
};

/**
 * Remove todos os destaques visuais de movimentos possíveis no tabuleiro.
 *
 * @returns {void}
 */
function clearMoveHighlights() {
    const circles = document.querySelectorAll(".moves-circle");
    if (circles) {
        circles.forEach((circle) => {
            circle.remove();
        });
    }
};

/**
 * Destaca a célula selecionada no tabuleiro, removendo o destaque das demais.
 *
 * @param {Array} position - Posição da célula [linha, coluna].
 * @returns {void}
 */
function highlightSelectedCell(position) {
    const [row, col] = position;
    const cells = document.querySelectorAll(".cell");

    cells.forEach((cell) => {
        cell.classList.toggle(
            "bg-[#F59E0B]",
            cell.dataset.position === `${row},${col}`
        );
    });
};

/**
 * Limpa a peça atualmente selecionada no estado do jogo.
 *
 * @returns {void}
 */
function clearSelectedPiece() {
    GameState.set({ selectedPiece: null });
};

/**
 * Retorna todos os movimentos possíveis de uma peça a partir de uma posição.
 *
 * @param {number[]} position - Posição atual da peça [linha, coluna].
 * @param {Object} piece - Objeto da peça contendo tipo, cor, etc.
 * @returns {number[][]} Array de posições possíveis [linha, coluna].
 */
function getPossibleMoves(position, piece) {
    switch (piece.type) {
        case 'pawn':
            return getPawnMove(position);
            break;
        case 'rook':
            return getRookMove(position);
            break;
        case 'knight':
            return getKnightMove(position);
            break;
        case 'bishop':
            return getBishopMove(position);
            break;
        case 'queen':
            return getQueenMove(position);
            break;
        case 'king':
            return getKingMove(position);
            break;
        default:
            return [];
    }
};

/**
 * Retorna todas as casas que uma peça pode atacar a partir de uma posição.
 * Diferente de getPossibleMoves, inclui apenas posições atacáveis, não se importando
 * se o movimento seria legal para o rei.
 *
 * @param {number[]} position - Posição atual da peça [linha, coluna].
 * @param {Object} piece - Objeto da peça contendo tipo e cor.
 * @returns {number[][]} Array de posições atacáveis [linha, coluna].
 */
function getAttackingMoves(position, piece) {
    let [row, col] = position;
    let color = piece.color;
    let type = piece.type;
    let attackingMoves = [];

    if (type === "pawn") {
        let direction = color === "white" ? -1 : 1;
        let attackPositions = [
            [row + direction, col - 1],
            [row + direction, col + 1]
        ];
        attackPositions.forEach(([x, y]) => {
            if (isValidBoardPosition(x, y)) {
                attackingMoves.push([x, y]);
            }
        });
    } else if (type === "rook") {
        attackingMoves.push(...getSlidingMoves(position, [[1, 0], [-1, 0], [0, 1], [0, -1]]));
    } else if (type === "bishop") {
        attackingMoves.push(...getSlidingMoves(position, [[1, 1], [-1, -1], [1, -1], [-1, 1]]));
    } else if (type === "queen") {
        attackingMoves.push(...getSlidingMoves(position, [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]));
    } else if (type === "knight") {
        let knightMoves = [
            [row - 2, col - 1], [row - 2, col + 1],
            [row + 2, col - 1], [row + 2, col + 1],
            [row - 1, col - 2], [row - 1, col + 2],
            [row + 1, col - 2], [row + 1, col + 2]
        ];
        knightMoves.forEach(([x, y]) => {
            if (isValidBoardPosition(x, y)) {
                attackingMoves.push([x, y]);
            }
        });
    } else if (type === "king") {
        let kingMoves = [
            [row - 1, col], [row + 1, col], [row, col - 1], [row, col + 1],
            [row - 1, col - 1], [row - 1, col + 1], [row + 1, col - 1], [row + 1, col + 1]
        ];
        kingMoves.forEach(([x, y]) => {
            if (isValidBoardPosition(x, y)) {
                attackingMoves.push([x, y]);
            }
        });
    }

    return attackingMoves;
};

/**
 * Verifica se um movimento específico é válido para uma peça.
 *
 * @param {number[]} fromPosition - Posição inicial [linha, coluna].
 * @param {number[]} toPosition - Posição de destino [linha, coluna].
 * @param {Object} piece - Objeto da peça contendo tipo, cor e posições.
 * @returns {boolean} Retorna true se o movimento é permitido, false caso contrário.
 */
function isValidateMove(fromPosition, toPosition, piece) {
    const [toRow, toCol] = toPosition;
    const possibleMoves = getPossibleMoves(fromPosition, piece);

    // Verifica se o movimento é válido
    const isValidMove = possibleMoves.some(
        ([row, col]) => row === toRow && col === toCol
    );

    if (!isValidMove) return false;

    return true; // Movimento válido
};

/**
 * Verifica se mover uma peça de uma posição para outra deixaria o rei do jogador em segurança.
 *
 * @param {number[]} fromPosition - Posição inicial [linha, coluna] da peça.
 * @param {number[]} toPosition - Posição de destino [linha, coluna].
 * @param {string} color - Cor do jogador ("white" ou "black").
 * @returns {boolean} Retorna true se o movimento não deixar o rei em xeque, false caso contrário.
 */
function isMoveSafe(fromPosition, toPosition, color) {
    const [fromRow, fromCol] = fromPosition;
    const [toRow, toCol] = toPosition;

    // Salva o estado original
    const originalPiece = VIRTUAL_BOARD[fromRow][fromCol];
    const capturedPiece = VIRTUAL_BOARD[toRow][toCol]; // Pode ser null
    const originalKingPosition = GameState.get(`kingPositions.${color}`).slice();

    // Simula o movimento
    VIRTUAL_BOARD[fromRow][fromCol] = null;
    VIRTUAL_BOARD[toRow][toCol] = originalPiece;

    // Se for o rei, atualiza a posição temporária
    if (originalPiece.type === "king") {
        const newKingPositions = { ...GameState.get("kingPositions") };
        newKingPositions[color] = [toRow, toCol];
        GameState.set({ kingPositions: newKingPositions });
    }

    // Verifica se o próprio rei está em xeque
    const kingIsInCheck = isKingInCheck(color);

    // Restaura o estado original
    VIRTUAL_BOARD[fromRow][fromCol] = originalPiece;
    VIRTUAL_BOARD[toRow][toCol] = capturedPiece;

    if (originalPiece.type === "king") {
        const restoredKingPositions = { ...GameState.get("kingPositions") };
        restoredKingPositions[color] = originalKingPosition;
        GameState.set({ kingPositions: restoredKingPositions });
    }

    // Retorna `false` se o movimento colocar o rei em xeque
    return !kingIsInCheck;
};

// ----------------- FUNÇÕES DE MOVIMENTO
/**
 * Retorna os movimentos válidos de um peão a partir de sua posição atual.
 * Inclui movimento simples, duplo inicial, capturas diagonais e en passant.
 *
 * @param {number[]} position - Posição atual do peão [linha, coluna].
 * @returns {number[][]} Lista de posições possíveis para o peão.
 */
function getPawnMove(position) {
    const [row, col] = position;
    const { color } = getPiecePositionOnVirtualBoard(position);
    const moves = [];
    const direction = color === 'white' ? -1 : 1;

    // Movimento simples para frente
    if (!hasPieceAtPosition([row + direction, col])) {
        moves.push([row + direction, col]);

        // Movimento duplo inicial
        const initialRow = color === 'white' ? 6 : 1;
        if (row === initialRow && !hasPieceAtPosition([row + (2 * direction), col])) {
            moves.push([row + (2 * direction), col]);
        }
    }

    // Capturas diagonais
    const diagonals = [[row + direction, col - 1], [row + direction, col + 1]];
    diagonals.forEach(([r, c]) => {
        if (isValidBoardPosition(r, c)) {
            const targetPiece = getPiecePositionOnVirtualBoard([r, c]);
            if (targetPiece && targetPiece.color !== color) {
                moves.push([r, c]);
            }
        }
    });

    // Verificar captura en passant
    const enPassantMoves = canEnPassant(position);
    moves.push(...enPassantMoves);

    return moves;
};

/**
 * Verifica se o peão pode realizar o movimento en passant.
 *
 * @param {number[]} fromPosition - Posição atual do peão [linha, coluna].
 * @returns {number[][]} Lista de posições válidas para en passant.
 */
function canEnPassant(fromPosition) {
    const pawn = getPiecePositionOnVirtualBoard(fromPosition);
    if (!pawn || pawn.type !== 'pawn') return [];

    const lastPawnDoubleMove = GameState.get('lastPawnDoubleMove');
    if (!lastPawnDoubleMove) return [];

    const [row, col] = fromPosition;
    const direction = pawn.color === 'white' ? -1 : 1;
    const enPassantRow = pawn.color === 'white' ? 3 : 4;
    if (row !== enPassantRow) return [];

    const moves = [];

    // Colunas adjacentes
    [col - 1, col + 1].forEach(adjCol => {
        if (!isValidBoardPosition(row, adjCol)) return;
        const adjacentPawn = getPiecePositionOnVirtualBoard([row, adjCol]);
        if (
            adjacentPawn &&
            adjacentPawn.type === 'pawn' &&
            adjacentPawn.color !== pawn.color &&
            lastPawnDoubleMove.positions.some(([r, c]) => r === row && c === adjCol)
        ) {
            // Casa de destino da captura
            const destRow = row + direction;
            const destCol = adjCol;
            moves.push([destRow, destCol]);
        }
    });

    return moves;
};

/**
 * Remove o peão adversário capturado via en passant, se o movimento for realizado.
 *
 * @param {number[]} toPosition - Posição de destino do peão que realizou o en passant [linha, coluna].
 */
function removePawnEnPassant(toPosition) {
    const currentPlayer = GameState.get('currentPlayer');
    const direction = currentPlayer === 'white' ? -1 : 1;
    const lastPawnDoubleMove = GameState.get('lastPawnDoubleMove');

    if (!lastPawnDoubleMove) return;

    const [toRow, toCol] = toPosition;
    const capturedRow = toRow - direction;
    const capturedCol = toCol;

    // Verifica se o peão capturado é realmente o que se moveu duas casas
    if (
        lastPawnDoubleMove.positions
            .some(([r, c]) => r === capturedRow && c === capturedCol)
    ) {
        // Remove do DOM
        const capturedCellSelector = `[data-position="${capturedRow},${capturedCol}"]`;
        const capturedCell = document.querySelector(capturedCellSelector);

        const capturedImg = capturedCell?.querySelector('img');
        if (capturedImg) capturedImg.remove();

        // Remove do tabuleiro virtual
        VIRTUAL_BOARD[capturedRow][capturedCol] = null;

        // Limpa o estado do en passant
        GameState.set({
            lastPawnDoubleMove: null,
            enPassantPosition: []
        });
    }
};

/**
 * Atualiza o estado do jogo para armazenar o último movimento duplo de um peão.
 * Isso é necessário para habilitar a captura en passant.
 *
 * @param {number[]} fromPosition - Posição inicial do peão [linha, coluna].
 * @param {number[]} toPosition - Posição final do peão [linha, coluna].
 * @param {Object} piece - Objeto representando o peão que se moveu.
 */
function setLastPawnDoubleMove(fromPosition, toPosition, piece) {
    if (piece.type !== "pawn") return;

    const [row, col] = fromPosition;
    const [toRow, toCol] = toPosition;
    const { name, color, positions } = piece;
    const initialRow = color === 'white' ? 6 : 1;

    if (row === initialRow && Math.abs(toRow - row) === 2 && col === toCol) {
        GameState.set({
            lastPawnDoubleMove: {
                name,
                color,
                positions: [[toRow, toCol]]
            }
        });
        GameState.set({ enPassantPosition: [toRow, toCol] });
    }
};

/**
 * Calcula todos os movimentos válidos de uma torre a partir de uma posição no tabuleiro.
 *
 * A torre se move em linha reta, tanto na horizontal quanto na vertical,
 * até encontrar outra peça. Captura peças adversárias e para ao encontrar qualquer peça.
 *
 * @param {number[]} position - Posição atual da torre [linha, coluna].
 * @returns {number[][]} Array de posições válidas para a torre.
 */
function getRookMove(position) {
    const [row, col] = position;
    const piece = getPiecePositionOnVirtualBoard(position);
    const moves = [];

    // Direções: horizontal e vertical
    const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];

    directions.forEach(([dRow, dCol]) => {
        let currentRow = row + dRow;
        let currentCol = col + dCol;

        while (isValidBoardPosition(currentRow, currentCol)) {
            const targetPiece = getPiecePositionOnVirtualBoard([currentRow, currentCol]);

            if (!targetPiece) {
                moves.push([currentRow, currentCol]);
            } else {
                if (targetPiece.color !== piece.color) {
                    moves.push([currentRow, currentCol]);
                }
                break;
            }

            currentRow += dRow;
            currentCol += dCol;
        }
    });

    return moves;
};

/**
 * Calcula todos os movimentos válidos de um cavalo a partir de uma posição no tabuleiro.
 *
 * O cavalo se move em "L" (duas casas em uma direção e uma na perpendicular),
 * pulando sobre outras peças. Captura peças adversárias.
 *
 * @param {number[]} position - Posição atual do cavalo [linha, coluna].
 * @returns {number[][]} Array de posições válidas para o cavalo.
 */
function getKnightMove(position) {
    const [row, col] = position;
    const piece = getPiecePositionOnVirtualBoard(position);
    const moves = [];

    const knightMoves = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1]
    ];

    knightMoves.forEach(([dRow, dCol]) => {
        const newRow = row + dRow;
        const newCol = col + dCol;

        if (isValidBoardPosition(newRow, newCol)) {
            const targetPiece = getPiecePositionOnVirtualBoard([newRow, newCol]);
            if (!targetPiece || targetPiece.color !== piece.color) {
                moves.push([newRow, newCol]);
            }
        }
    });

    return moves;
};

/**
 * Calcula todos os movimentos válidos de um bispo a partir de uma posição no tabuleiro.
 *
 * O bispo se move em diagonais, parando se encontrar uma peça aliada
 * ou capturando uma peça adversária.
 *
 * @param {number[]} position - Posição atual do bispo [linha, coluna].
 * @returns {number[][]} Array de posições válidas para o bispo.
 */
function getBishopMove(position) {
    const [row, col] = position;
    const piece = getPiecePositionOnVirtualBoard(position);
    const moves = [];

    // Direções diagonais
    const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];

    directions.forEach(([dRow, dCol]) => {
        let currentRow = row + dRow;
        let currentCol = col + dCol;

        while (isValidBoardPosition(currentRow, currentCol)) {
            const targetPiece = getPiecePositionOnVirtualBoard([currentRow, currentCol]);

            if (!targetPiece) {
                moves.push([currentRow, currentCol]);
            } else {
                if (targetPiece.color !== piece.color) {
                    moves.push([currentRow, currentCol]);
                }
                break;
            }

            currentRow += dRow;
            currentCol += dCol;
        }
    });

    return moves;
};

/**
 * Calcula todos os movimentos válidos da rainha a partir de uma posição no tabuleiro.
 *
 * A rainha combina os movimentos da torre (horizontal e vertical) e do bispo (diagonais).
 *
 * @param {number[]} position - Posição atual da rainha [linha, coluna].
 * @returns {number[][]} Array de posições válidas para a rainha.
 */
function getQueenMove(position) {
    const moves = [
        ...getRookMove(position),
        ...getBishopMove(position)
    ];

    return moves;
};

/**
 * Calcula todos os movimentos válidos do rei a partir de uma posição no tabuleiro,
 * incluindo movimentos normais de uma casa e possíveis roques (curto e longo).
 *
 * @param {number[]} position - Posição atual do rei [linha, coluna].
 * @returns {number[][]} Array de posições válidas para o rei.
 */
function getKingMove(position) {
    const [row, col] = position;
    const piece = getPiecePositionOnVirtualBoard(position);
    const moves = [];

    // Todas as direções possíveis para o rei
    const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1], [0, 1],
        [1, -1], [1, 0], [1, 1]
    ];

    directions.forEach(([dRow, dCol]) => {
        const newRow = row + dRow;
        const newCol = col + dCol;

        if (isValidBoardPosition(newRow, newCol)) {
            const targetPiece = getPiecePositionOnVirtualBoard([newRow, newCol]);
            if (!targetPiece || targetPiece.color !== piece.color) {
                moves.push([newRow, newCol]);
            }
        }
    });

    // --- Verificar roque ---
    if (canCastle(position, [row, 6], piece.color)) moves.push([row, 6]); // roque curto.
    if (canCastle(position, [row, 2], piece.color)) moves.push([row, 2]); // roque longo.   

    return moves;
};

/**
 * Verifica se o rei de determinada cor pode realizar o roque (curto ou longo)
 * a partir de sua posição atual até a posição de destino.
 *
 * @param {number[]} fromPosition - Posição atual do rei [linha, coluna].
 * @param {number[]} toPosition - Posição de destino do rei [linha, coluna].
 * @param {"white"|"black"} color - Cor do rei.
 * @returns {boolean} Retorna true se o roque for permitido, false caso contrário.
 */
function canCastle(fromPosition, toPosition, color) {
    const [fromRow, fromCol] = fromPosition;
    const row = color === "white" ? 7 : 0;

    // Determina se é roque curto ou longo
    const isKingside = toPosition[1] > fromCol;

    // Só permite se o rei está na posição inicial
    if (!isKingInInitialPosition(color)) return false;

    // Verifica se a torre correspondente está na posição inicial
    const side = isKingside ? "kingside" : "queenside";
    if (!isRookInInitialPosition(color, side)) return false;

    // Verifica se há peças entre rei e torre
    const intermediateCols = isKingside ? [fromCol + 1, fromCol + 2] : [fromCol - 3, fromCol - 2, fromCol - 1];
    const pathClear = intermediateCols.every(col => !VIRTUAL_BOARD[row][col]);

    if (!pathClear) return false;

    if (isKingInCheck(color)) return false;

    // Casas que o rei atravessará não podem estar atacadas
    const kingPathCols = isKingside ? [fromCol, fromCol + 1, fromCol + 2] : [fromCol, fromCol - 1, fromCol - 2];
    const opponentColor = color === "white" ? "black" : "white";
    const safePath = kingPathCols.every(col => !ATTACK_BOARD[row][col].has(opponentColor));

    if (!safePath) return false;

    return true;
};

/**
 * Executa o movimento de roque (curto ou longo) no tabuleiro virtual e no DOM.
 *
 * @param {number[]} fromPosition - Posição atual do rei [linha, coluna].
 * @param {number[]} toPosition - Posição de destino do rei [linha, coluna].
 * @param {"white"|"black"} color - Cor do rei.
 */
function executeCastle(fromPosition, toPosition, color) {
    const [row, fromCol] = fromPosition;
    const isKingside = toPosition[1] === 6;

    // Colunas da torre
    const rookColFrom = isKingside ? 7 : 0;
    const rookColTo = isKingside ? 5 : 3;

    // Peças do tabuleiro virtual
    const kingPiece = getPiecePositionOnVirtualBoard(fromPosition);
    const rookPiece = VIRTUAL_BOARD[row][rookColFrom];

    // --- Atualiza tabuleiro virtual ---
    updateVirtualBoardPosition(fromPosition, toPosition, kingPiece);           // rei
    updateVirtualBoardPosition([row, rookColFrom], [row, rookColTo], rookPiece); // torre

    // --- Função utilitária para pegar célula DOM ---
    const getCellByPosition = pos => document.querySelector(`[data-position="${pos.join(",")}"]`);

    // --- Atualiza DOM: rei e torre ---
    [
        { from: fromPosition, to: toPosition },
        { from: [row, rookColFrom], to: [row, rookColTo] }
    ].forEach(({ from, to }) => {
        const fromCell = getCellByPosition(from);
        const toCell = getCellByPosition(to);
        if (fromCell && toCell) movePieceElement(fromCell, toCell);
    });

    // --- Atualiza posição do rei no GameState ---
    const newKingPositions = { ...GameState.get("kingPositions") };
    newKingPositions[color] = [row, toPosition[1]];
    GameState.set({ kingPositions: newKingPositions });

    // --- UI e controle de jogo ---
    clearSelectedPiece();
    clearMoveHighlights();
    toggleCurrentPlayer();
};

/**
 * Retorna todas as casas possíveis que uma peça deslizante (torre, bispo, rainha)
 * pode alcançar em determinadas direções, considerando bloqueios de peças.
 *
 * @param {number[]} position - Posição inicial da peça [linha, coluna].
 * @param {number[][]} directions - Array de vetores [dx, dy] representando as direções de movimento.
 * @return {number[][]} moves - Array de posições válidas [linha, coluna].
 */
function getSlidingMoves(position, directions) {
    let [row, col] = position;
    let moves = [];

    for (let [dx, dy] of directions) {
        let x = row + dx;
        let y = col + dy;

        while (isValidBoardPosition(x, y)) {
            moves.push([x, y]);
            if (VIRTUAL_BOARD[x][y]) break; // Para ao encontrar uma peça
            x += dx;
            y += dy;
        }
    }
    return moves;
};

// ----------------- AUXILIARES
/**
 * Verifica se o rei de determinada cor está em xeque.
 *
 * @param {"white"|"black"} color - Cor do rei a verificar.
 * @return {boolean} - Retorna `true` se o rei estiver em xeque, `false` caso contrário.
 */
function isKingInCheck(color) {
    const [kr, kc] = GameState.get("kingPositions")[color];
    const opponent = color === "white" ? "black" : "white";
    return ATTACK_BOARD[kr][kc].has(opponent);
};

/**
 * Verifica se o jogador da cor especificada está em xeque-mate.
 *
 * @param {"white"|"black"} color - Cor do jogador a verificar.
 * @return {boolean} - Retorna `true` se o jogador estiver em xeque-mate, `false` caso contrário.
 */
function isCheckmate(color) {
    // TODO ~ Implementar xeque-mate
};

/**
 * Verifica se o jogador da cor especificada está em empate por afogamento (stalemate).
 *
 * @param {"white"|"black"} color - Cor do jogador a verificar.
 * @return {boolean} - Retorna `true` se for stalemate, `false` caso contrário.
 */
function isStalemate(color) {
    // TODO ~ Implementar empate por afogamento
};

/**
 * Retorna a posição inicial de uma peça específica a partir da FEN.
 * @param {"K"|"k"|"R"|"r"} pieceChar - Caractere da peça na FEN.
 * @return {[number, number]|null} Posição [linha, coluna] ou null se não encontrado
 */
function getInitialPositionFromFEN(pieceChar) {
    for (let r = 0; r < INITIAL_POSITIONS.length; r++) {
        const row = INITIAL_POSITIONS[r];
        for (let c = 0; c < 8; c++) {
            if (row[c] === pieceChar) return [r, c];
        }
    }
    return null;
};

/**
 * Verifica se o rei da cor especificada está na posição inicial.
 * @param {"white"|"black"} color
 * @return {boolean}
 */
function isKingInInitialPosition(color) {
    const kingChar = color === "white" ? "K" : "k";
    const initialPositionKing = getInitialPositionFromFEN(kingChar);
    const kingPosition = GameState.get("kingPositions")[color];
    return initialPositionKing[0] === kingPosition[0] && initialPositionKing[1] === kingPosition[1];
};

/**
 * Atualiza a posição do rei de uma cor no estado do jogo.
 *
 * @param {"white"|"black"} color - Cor do rei a ser atualizado.
 * @param {[number, number]} position - Nova posição do rei [linha, coluna].
 */
function setKingPosition(piece, position) {
    const { color, type } = piece;
    if (type !== "king") return;

    const newKingPositions = { ...GameState.get("kingPositions") };
    newKingPositions[color] = position;
    GameState.set({ kingPositions: newKingPositions });
}

/**
 * Verifica se a torre da cor e lado especificados está na posição inicial.
 * @param {"white"|"black"} color
 * @param {"kingside"|"queenside"} side
 * @return {boolean}
 */
function isRookInInitialPosition(color, side) {
    const rookChar = color === "white" ? "R" : "r";
    // Pegamos todas as torres
    const positions = [];
    for (let r = 0; r < INITIAL_POSITIONS.length; r++) {
        const row = INITIAL_POSITIONS[r];
        for (let c = 0; c < 8; c++) {
            if (row[c] === rookChar) positions.push([r, c]);
        }
    }
    if (positions.length !== 2) return false;

    const rookPos = side === "kingside" ? positions[1] : positions[0];
    const piece = VIRTUAL_BOARD[rookPos[0]][rookPos[1]];
    return piece && piece.type === "rook" && piece.color === color;
};

/**
 * Verifica se uma posição [row, col] está dentro do tabuleiro (8x8).
 * @param {number} row - Linha da posição.
 * @param {number} col - Coluna da posição.
 * @return {boolean} - Retorna true se a posição for válida.
 */
function isValidBoardPosition(row, col) {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
};

/**
 * Verifica se existe uma peça em uma posição específica do tabuleiro.
 * @param {number[]} position - Posição no tabuleiro [row, col].
 * @return {boolean} - Retorna true se houver uma peça na posição.
 */
function hasPieceAtPosition(position) {
    const [row, col] = position;
    if (!isValidBoardPosition(row, col)) return false;
    const piece = VIRTUAL_BOARD[row][col];
    return piece !== null; // Verifica se existe peça na posição
};

/**
 * Substitui a peça em uma posição do tabuleiro (promoção de peão, por exemplo).
 *
 * @param {number[]} position - [linha, coluna]
 * @param {object} newPieceTemplate - Objeto do PIECE_TYPES (queen, rook, bishop, knight)
 * @param {string} color - Cor da peça ("white" ou "black")
 */
function replacePieceAtPosition(position, newPieceTemplate, color) {
    const [row, col] = position;

    // 1. Monta o objeto da nova peça
    const newPiece = {
        ...newPieceTemplate,
        color,
        positions: [[row, col]],
        pathImg: `./img/pieces/${color}/${newPieceTemplate.img}`
    };

    // 2. Atualiza no tabuleiro virtual
    VIRTUAL_BOARD[row][col] = newPiece;

    // 3. Atualiza no DOM
    const cell = document.querySelector(`[data-position="${row},${col}"]`);
    if (cell) {
        cell.innerHTML = ""; // remove imagem antiga (peão)
        const img = document.createElement("img");
        img.src = newPiece.pathImg;
        img.alt = newPiece.name;
        img.dataset.type = newPiece.type;
        img.dataset.color = newPiece.color;
        cell.appendChild(img);
    }
};

/**
 * Retorna as classes CSS de cor para uma célula do tabuleiro.
 * - Define a cor de fundo (`bg`) da célula.
 * - Define a cor de contraste (`text`) para letras e números.
 *
 * @param {number} row - Linha da célula (0–7).
 * @param {number} col - Coluna da célula (0–7).
 * @returns {{bg: string, text: string}} Objeto com classes CSS para fundo e texto.
 */
function getBoardCellColors(row, col) {
    const isLight = (row + col) % 2 === 0;
    return {
        bg: isLight ? "bg-[#EBECD0]" : "bg-[#739552]",
        text: isLight ? "text-[#739552]" : "text-[#EBECD0]"
    };
};

/**
 * Verifica se o peão realizou um movimento de en passant e remove o peão capturado.
 * @param {number[]} fromPosition - Posição inicial do peão
 * @param {number[]} toPosition - Posição de destino do peão
 * 
 * @returns {void}
 */
function handleEnPassant(fromPosition, toPosition) {
    const enPassantMoves = canEnPassant(fromPosition);

    if (enPassantMoves.some(([r, c]) => r === toPosition[0] && c === toPosition[1])) {
        removePawnEnPassant(toPosition);
    }
};

/**
 * Promove um peão que alcanou o fim do tabuleiro para uma peça escolhida.
 * - Executa o movimento promovendo a peça.
 * - Substitui a peça no tabuleiro virtual.
 * - Verifica se o rei oponente ficou em xeque.
 *
 * @param {string} pieceKey - Chave da peça a ser promovida.
 * @param {number[]} fromPosition - Posição inicial do peão [linha, coluna].
 * @param {number[]} toPosition - Posição de destino do peão [linha, coluna].
 * 
 * @returns {void}
 */
function promotePawn(pieceKey, fromPosition, toPosition) {

    const color = GameState.get("currentPlayer");
    const pieceTarget = PIECE_TYPES[pieceKey];

    if (!pieceTarget) return;

    // Executa o movimento promovendo a peça
    executeMove(fromPosition, toPosition, { ...pieceTarget, color });

    // Substitui peão pela peça escolhida
    replacePieceAtPosition(toPosition, pieceTarget, color);

    // Finaliza o movimento
    closeModal();

    // Verifica se o rei oponente ficou em xeque
    if (isKingInCheck(color)) {
        openModal(`🚨 Xeque no rei ${opponentColor}!`);
    }
};

/**
 * Verifica se o peão chegou à última linha e abre modal para promoção.
 * @param {number[]} fromPosition - Posição inicial do peão
 * @param {number[]} toPosition - Posição de destino do peão
 * @param {string} color - Cor do peão
 * 
 * @returns {boolean} true se abriu o modal de promoção, false caso contrário
 */
function promptPawnPromotion(fromPosition, toPosition) {
    if (toPosition[0] !== 0 && toPosition[0] !== 7) return false;

    let symbolsHtml = '';
    Object.entries(PIECE_TYPES)
        .filter(([, piece]) => !['pawn', 'king'].includes(piece.type))
        .forEach(([key, piece]) => {
            symbolsHtml += `
                <span onclick="promotePawn('${key}', ${JSON.stringify(fromPosition)}, ${JSON.stringify(toPosition)})" 
                      style="cursor: pointer; font-size: 25px; margin: 5px; padding: 5px; border: 2px solid transparent; border-radius: 5px;"
                      onmouseover="this.style.borderColor='gold'"
                      onmouseout="this.style.borderColor='transparent'"
                      title="${piece.name}">
                    ${piece.symbol}
                </span>
            `;
        });

    openModal(`
        <h3>Escolha a peça para promover | ♕♖♗♘</h3>
        <div class="flex gap-2 justify-center items-center">
            ${symbolsHtml}
        </div>
    `);

    return true; // indica que o fluxo precisa pausar até a escolha da peça
};


// ------------------ VIRTUAL BOARD e ATTACK BOARD
/**
 * Imprime no console o estado atual do tabuleiro virtual de posições.
 * Útil para debug.
 * @return {void}
 * 
 */
function logVirtualBoard() {
    console.log("🔍 Matriz de jogadas atualizada:", VIRTUAL_BOARD);
};

/**
 * Atualiza o tabuleiro virtual de posições após um movimento de peça.
 * @param {number[]} fromPosition - Posição inicial [linha, coluna].
 * @param {number[]} toPosition - Posição de destino [linha, coluna].
 * @param {Object} piece - Objeto da peça que está sendo movida.
 * @return {void}
 * 
 */
function updateVirutualBoardPosition(fromPosition, toPosition, piece) {
    const [fromRow, fromCol] = fromPosition;
    const [toRow, toCol] = toPosition;
    VIRTUAL_BOARD[fromRow][fromCol] = null;
    VIRTUAL_BOARD[toRow][toCol] = piece;
    piece.positions = [[toRow, toCol]];
};

/**
 * Retorna a peça presente em uma posição específica do tabuleiro de peças (VIRTUAL_BOARD).
 * @param {number[]} position - Posição no tabuleiro [row, col].
 * @return {Object|null|false} - A peça na posição ou false se a posição for inválida.
 */
function getPiecePositionOnVirtualBoard(position) {
    const [row, col] = position;
    if (!isValidBoardPosition(row, col)) return false;
    return VIRTUAL_BOARD[row][col];
}

// ------------------ MODAL FEEDBACK
const modalBackdrop = document.getElementById('modal-backdrop');
const modal = document.getElementById('modal');

const setMessage = (message) => {
    const modalMessage = document.querySelector('.modal-message');
    modalMessage.innerHTML = message;
};

const openModal = (mensagem) => {
    modalBackdrop.classList.remove('hidden');
    modal.classList.remove('hidden');
    setMessage(mensagem);
};

const closeModal = () => {
    modalBackdrop.classList.add('hidden')
    modal.classList.add('hidden');
};

const updateTurnInUI = () => {
    const currentPlayer = GameState.get("currentPlayer");
    const turnoEl = document.getElementById('turno');
    turnoEl.textContent = `
        ${currentPlayer === "white" ? "⚪ Brancas" : "⚫ Pretas"}
    `;
};

window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});

// ------------------ TURNOS
/**
 * Alterna o turno do jogador atual entre "white" e "black".
 * Atualiza o estado do jogo para o novo turno.
 * @return {void}
 *
 */
function toggleCurrentPlayer() {
    GameState.set({
        currentPlayer: GameState.get("currentPlayer") === "white"
            ? "black"
            : "white"
    });
    updateTurnInUI();
};

// ------------------ GAME STATE
/**
 * @module GameState
 * 
 * Store de estado global para o jogo de xadrez.
 * Permite manipular e acessar o estado de forma encapsulada, 
 * sem acessar a variável global diretamente.
 * 
 * Funcionalidades:
 * - getState(): retorna o estado completo
 * - get(path): retorna uma propriedade específica (suporta paths aninhados)
 * - set(updates): atualiza propriedades do estado
 * - reset(): reinicia o estado para valores iniciais
 * - subscribe(fn): registra callbacks para mudanças de estado
 * 
 * Exemplo de uso:
 * const currentPlayer = GameState.get("currentPlayer");
 * GameState.set({ check: true });
 * const unsubscribe = GameState.subscribe(state => console.log(state));
 * GameState.reset();
 * unsubscribe();
 */
const GameState = (function () {
    // Estado interno
    let state = {
        currentPlayer: "white",
        selectedPiece: null,
        check: false,
        checkmate: false,
        kingPositions: {
            white: [7, 4],
            black: [0, 4]
        },
        lastPawnDoubleMove: null,
        enPassantPosition: [],
        promotionPending: null,
    };

    // Lista de listeners para mudanças de estado
    const listeners = [];

    return {
        // Retorna o estado completo
        getState: () => ({ ...state }),

        // Retorna propriedade específica (suporta paths aninhados)
        get: (path) => {
            const keys = path.split(".");
            return keys.reduce((acc, key) => (acc ? acc[key] : undefined), state);
        },

        // Atualiza o estado (merge) e notifica listeners
        set: (updates) => {
            state = { ...state, ...updates };
            listeners.forEach((fn) => fn(state));
        },

        // Resetar estado inicial
        reset: () => {
            state = {
                currentPlayer: "white",
                selectedPiece: null,
                check: false,
                checkmate: false,
                kingPositions: {
                    white: [7, 4],
                    black: [0, 4]
                },
                lastPawnDoubleMove: null,
                enPassantPosition: [],
                promotionPending: null,
            };
            listeners.forEach((fn) => fn(state));
        },

        // Registrar callback para mudanças de estado
        subscribe: (fn) => {
            listeners.push(fn);
            // Retorna função para remover o listener
            return () => {
                const index = listeners.indexOf(fn);
                if (index > -1) listeners.splice(index, 1);
            };
        }
    };
})();


// ------------------ RESTART
/**
 * Reinicia o jogo de xadrez, limpando o tabuleiro e restaurando o estado inicial.
 * - Limpa todas as peças do DOM
 * - Reinicializa as variáveis de estado
 * - Recria o tabuleiro com as peças na posição inicial
 */
function restartGame() {
    document.getElementById("board").innerHTML = "";

    VIRTUAL_BOARD = initializeVirtualBoard();
    ATTACK_BOARD = initializeAttackBoard();

    GameState.reset();
    startGame();
}

const restartButton = document.getElementById('restart-button');
restartButton.addEventListener('click', () => restartGame());

// ----------------- INICIAR JOGO
startGame();
