
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
 * É recalculada chamando `updateAttackBoardPosition()` após cada jogada.
 */
let ATTACK_BOARD = initializeAttackBoard();

/**
 * Estado global do jogo de xadrez.
 * 
 * @property {("white"|"black")} currentPlayer - Jogador atual.
 * @property {Object|null} selectedPiece - Peça selecionada no momento.
 * @property {boolean} check - Indica se o rei do jogador atual está em xeque.
 * @property {boolean} checkmate - Indica se o jogador atual está em xeque-mate.
 * @property {Object} kingPositions - Posições atuais dos reis.
 * @property {number[]} kingPositions.white - Posição do rei branco [linha, coluna].
 * @property {number[]} kingPositions.black - Posição do rei preto [linha, coluna].
 * @property {Object|null} lastPawnDoubleMove - Último avanço duplo de peão (para en passant).
 * @property {number[]} enPassantPosition - Casas válidas para captura en passant.
 * @property {Object|null} promotionPending - Promoção pendente de peão (ou null).
 */
let GAME_STATE = {
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
    PAWN: { name: "Pawn", type: "pawn", symbol: "♟", img: "p.png" },
    ROOK: { name: "Rook", type: "rook", symbol: "♜", img: "r.png" },
    KNIGHT: { name: "Knight", type: "knight", symbol: "♞", img: "n.png" },
    BISHOP: { name: "Bishop", type: "bishop", symbol: "♝", img: "b.png" },
    QUEEN: { name: "Queen", type: "queen", symbol: "♕", img: "q.png" },
    KING: { name: "King", type: "king", symbol: "♚", img: "k.png" }
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
    addPieces(INITIAL_POSITIONS);
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
    const letters = "abcdefgh".split("");

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const cell = document.createElement("div");
            const { bg, text } = getBoardCellColors(row, col);

            cell.classList.add(
                "relative",
                "w-full",
                "h-full",
                "flex",
                "flex-col",
                "justify-center",
                "items-center",
                "cell",
                bg,
                text
            );
            cell.dataset.position = [row, col];
            cell.dataset.id = `${letters[col]}${8 - row}`;

            let coordnates = document.createElement("span");
            coordnates.textContent = `[${row}, ${col}]`;
            coordnates.classList.add("absolute", "top-1", "text-[0.4rem]", "sm:text-[0.6rem]", text);

            cell.appendChild(coordnates);

            if (row === 7) {
                const letter = document.createElement("span");
                letter.textContent = letters[col];
                letter.classList.add(
                    "absolute",
                    "text-[0.5rem]",
                    "sm:text-[0.9rem]",
                    "right-1",
                    "bottom-1",
                    text
                );
                cell.appendChild(letter);
            }

            if (col === 0) {
                const number = document.createElement("span");
                number.textContent = 8 - row;
                number.classList.add(
                    "absolute",
                    "text-[0.5rem]",
                    "sm:text-[0.7rem]",
                    "left-1",
                    "top-1",
                    text
                );
                cell.appendChild(number);
            }

            cell.addEventListener("click", (e) => {
                e.stopPropagation();
                cellClicked(e, [row, col]);
            });

            board.appendChild(cell);
        }
    }
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
function createPiecesWithFEN(positionsFEN) {
    const typeMap = {
        p: PIECE_TYPES.PAWN,
        r: PIECE_TYPES.ROOK,
        n: PIECE_TYPES.KNIGHT,
        b: PIECE_TYPES.BISHOP,
        q: PIECE_TYPES.QUEEN,
        k: PIECE_TYPES.KING
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
function addPieces(INITIAL_POSITIONS) {
    let pieces = createPiecesWithFEN(INITIAL_POSITIONS);

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
                    "sm:w-[4rem]",
                    "h-[3rem]",
                    "sm:h-[4rem]",
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
    const clickedPiece = getPiecePositionOnVirtualBoard(position);

    if (!clickedPiece && !GAME_STATE.selectedPiece) {
        openModal(`ℹ️ Nenhuma peça encontrada na posição clicada: ${position.join(",")}`);
        return;
    }

    if (clickedPiece && clickedPiece.color === GAME_STATE.currentPlayer) {
        GAME_STATE.selectedPiece = clickedPiece;
        highlightMovesForPiece(clickedPiece, position, VIRTUAL_BOARD);
        highlightSelectedCell(position);
        return;
    }

    if (GAME_STATE.selectedPiece) {
        const fromPosition = GAME_STATE.selectedPiece.positions[0];

        // Detecta se é roque
        if (
            GAME_STATE.selectedPiece.type === "king" && 
            Math.abs(position[1] - fromPosition[1]) === 2
        ) {
            executeCastle(fromPosition, position, GAME_STATE.selectedPiece.color);
            return;
        }

        // Movimento normal
        movePieceInVirtualBoard(fromPosition, position);
    }
};

/**
 * Move uma peça do tabuleiro virtual e atualiza o estado do jogo.
 * - Valida se existe uma peça na posição de origem.
 * - Verifica se o movimento é permitido pela regra do xadrez.
 * - Confirma se o movimento não deixa o rei do jogador em xeque.
 * - Executa o movimento e atualiza o DOM e o tabuleiro virtual.
 * - Verifica se o movimento coloca o rei adversário em xeque.
 *
 * @param {Array<number>} fromPosition - Posição inicial da peça [row, col].
 * @param {Array<number>} toPosition - Posição de destino da peça [row, col].
 * @returns {boolean} - Retorna true se o movimento foi realizado com sucesso; false caso contrário.
 */
function movePieceInVirtualBoard(fromPosition, toPosition) {
    const piece = getPiecePositionOnVirtualBoard(fromPosition);

    if (!piece) return false;

    const isValidMove = isValidateMove(fromPosition, toPosition, piece);

    if (!isValidMove) {
        openModal(`⛔${piece.symbol} Movimento ilegal!`);
        return;
    }

    if (!isMoveSafe(fromPosition, toPosition, GAME_STATE.currentPlayer)) {
        openModal(`⛔${piece.symbol} Movimento ilegal! Seu rei ficaria em xeque.`);

        clearSelectedPiece();
        clearMoveHighlights();

        return false;
    }

    executeMove(fromPosition, toPosition, piece);

    const opponentColor = piece.color === "white" ? "black" : "white";
    if (isKingInCheck(opponentColor)) {
        openModal(`🚨 Xeque no rei ${opponentColor}!`)
    }

    logVirtualBoard();
    return true;
};

/**
 * Executa o movimento de uma peça no tabuleiro.
 * - Atualiza movimentos especiais como "en passant" e "último movimento de peão duplo".
 * - Remove peças adversárias na posição de destino, se houver.
 * - Atualiza o DOM para refletir o movimento da peça.
 * - Atualiza o tabuleiro virtual (VIRTUAL_BOARD) com a nova posição da peça.
 * - Atualiza as possíveis casas de movimento da peça.
 * - Limpa a peça selecionada e alterna a vez do jogador.
 *
 * @param {Array<number>} fromPosition - Posição inicial da peça [row, col].
 * @param {Array<number>} toPosition - Posição final da peça [row, col].
 * @param {Object} piece - Objeto da peça que está sendo movida.
 * @returns {void}
 */
function executeMove(fromPosition, toPosition, piece) {
    const fromCell = document.querySelector(`[data-position="${fromPosition.join(",")}"]`);
    const toCell = document.querySelector(`[data-position="${toPosition.join(",")}"]`);

    setLastPawnDoubleMove(fromPosition, toPosition, piece);
    captureOpponentPiecesIfExists(toCell);
    removePawnEnPassant(toPosition);
    movePieceElement(fromCell, toCell, toPosition, piece);
    updateVirutualBoardPosition(fromPosition, toPosition, piece);
    clearMoveHighlights();
    clearSelectedPiece();
    toggleCurrentPlayer();
};

/**
 * Move a peça no DOM de uma célula para outra.
 * - Remove a imagem da peça da célula de origem.
 * - Adiciona a imagem da peça na célula de destino.
 * - Remove quaisquer destaques de possíveis movimentos no tabuleiro.
 *
 * @param {HTMLElement} fromCell - Célula de origem da peça.
 * @param {HTMLElement} toCell - Célula de destino da peça.
 * @param {Array<number>} toPosition - Posição final da peça [row, col].
 * @param {Object} piece - Objeto da peça que está sendo movida.
 * @returns {void}
 */
function movePieceElement(fromCell, toCell) {
    const pieceImg = fromCell.querySelector('img');
    fromCell.removeChild(pieceImg);
    toCell.appendChild(pieceImg);

    clearMoveHighlights();
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
 * @param {Array} board - Tabuleiro virtual usado para cálculos de movimento.
 * @returns {void}
 */
function highlightMovesForPiece(piece, position, board) {
    if (!SHOW_HIGHLIGHT) return;

    const newPossibleMoves = getPossibleMoves(position, piece);

    clearMoveHighlights(newPossibleMoves, board);

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
    GAME_STATE.selectedPiece = null;
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
 * @param {string} player - Cor do jogador ("white" ou "black").
 * @returns {boolean} Retorna true se o movimento não deixar o rei em xeque, false caso contrário.
 */
function isMoveSafe(fromPosition, toPosition, player) {
    const [fromRow, fromCol] = fromPosition;
    const [toRow, toCol] = toPosition;

    // Salva o estado original
    const originalPiece = VIRTUAL_BOARD[fromRow][fromCol];
    const capturedPiece = VIRTUAL_BOARD[toRow][toCol]; // Pode ser null

    // Simula o movimento
    VIRTUAL_BOARD[fromRow][fromCol] = null;
    VIRTUAL_BOARD[toRow][toCol] = originalPiece;

    // Se for o rei, atualiza a posição temporária
    if (originalPiece.type === "king") {
        GAME_STATE.kingPositions[player] = [toRow, toCol];
    }

    // Atualiza a matriz de ataque para a nova configuração do tabuleiro
    updateAttackBoardPosition();

    // Verifica se o próprio rei está em xeque
    const kingIsInCheck = isKingInCheck(player);

    // Restaura o estado original
    VIRTUAL_BOARD[fromRow][fromCol] = originalPiece;
    VIRTUAL_BOARD[toRow][toCol] = capturedPiece;

    if (originalPiece.type === "king") {
        GAME_STATE.kingPositions[player] = [fromRow, fromCol];
    }

    // Retorna `false` se o movimento colocar o rei em xeque
    return !kingIsInCheck;
};

/**
 * Move a peça no DOM de uma posição para outra, baseada nas posições do tabuleiro virtual.
 *
 * @param {number[]} fromPos - Posição inicial [linha, coluna].
 * @param {number[]} toPos - Posição de destino [linha, coluna].
 */
function movePieceInDOMByPosition(fromPos, toPos) {
    const fromCell = document.querySelector(`[data-position="${fromPos.join(",")}"]`);
    const toCell = document.querySelector(`[data-position="${toPos.join(",")}"]`);
    const piece = getPiecePositionOnVirtualBoard(toPos);
    movePieceElement(fromCell, toCell, toPos, piece);
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
    const [row, col] = fromPosition;
    const pawn = getPiecePositionOnVirtualBoard(fromPosition);

    if (!pawn || pawn.type !== 'pawn') return [];

    const isWhite = pawn.color === 'white';
    const direction = isWhite ? -1 : 1;
    const enPassantRow = isWhite ? 3 : 4;

    if (row !== enPassantRow) return [];

    const enPassantMoves = [];
    const adjacentColumns = [col - 1, col + 1]; // Colunas adjacentes

    adjacentColumns.forEach(adjCol => {
        if (isValidBoardPosition(row, adjCol)) {
            const adjacentPawn = getPiecePositionOnVirtualBoard([row, adjCol]);
            if (adjacentPawn && adjacentPawn.type === 'pawn' && adjacentPawn.color !== pawn.color) {
                // Verificar se o peão adversário está em lastPawnDoubleMove
                if (
                    GAME_STATE.lastPawnDoubleMove &&
                    GAME_STATE.lastPawnDoubleMove.positions.some(([r, c]) => r === row && c === adjCol)
                ) {
                    const diagonalRow = row + direction;
                    const diagonalCol = adjCol;
                    if (!hasPieceAtPosition([diagonalRow, diagonalCol])) {
                        enPassantMoves.push([diagonalRow, diagonalCol]);
                        GAME_STATE.enPassantPosition = [diagonalRow, diagonalCol];
                    }
                }
            }
        }
    });

    return enPassantMoves;
};

/**
 * Remove o peão adversário capturado via en passant, se o movimento for realizado.
 *
 * @param {number[]} toPosition - Posição de destino do peão que realizou o en passant [linha, coluna].
 */
function removePawnEnPassant(toPosition) {
    if (!GAME_STATE.lastPawnDoubleMove) return;

    const [toRow, toCol] = toPosition;
    const [emPassantRow, emPassantCol] = GAME_STATE.enPassantPosition;
    const existPawnEnPassant = GAME_STATE.lastPawnDoubleMove;

    if (existPawnEnPassant && toRow === emPassantRow && toCol === emPassantCol) {
        const emPassantCellSelector = `[data-position="${existPawnEnPassant.positions.join(",")}"]`;
        const emPassantCell = document.querySelector(emPassantCellSelector);
        const emPassantImg = emPassantCell?.querySelector('img');

        if (emPassantImg) {
            emPassantImg.remove();
        }
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
    const direction = color === 'white' ? -1 : 1;
    const initialRow = color === 'white' ? 6 : 1;

    if (row === initialRow && Math.abs(toRow - row) === 2 && col === toCol) {
        GAME_STATE.lastPawnDoubleMove = {
            name,
            color,
            positions: [[toRow, toCol]]
        };
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
    if (canCastle(position, [row, 6], piece.color)) moves.push([row, col]); // roque curto.
    if (canCastle(position, [row, 2], piece.color)) moves.push([row, col]); // roque longo.   

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
    // Atualiza matriz de ataque
    updateAttackBoardPosition();

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

    // Rei não pode estar em xeque
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
    const [fromRow, fromCol] = fromPosition;
    const row = fromRow; // usa a linha real do rei clicado
    const isKingside = toPosition[1] === 6;
    const rookColFrom = isKingside ? 7 : 0;
    const rookColTo = isKingside ? 5 : 3;

    const kingPiece = getPiecePositionOnVirtualBoard(fromPosition);
    const rookPiece = VIRTUAL_BOARD[row][rookColFrom];

    // Atualiza tabuleiro virtual
    updateVirutualBoardPosition(fromPosition, toPosition, kingPiece);
    updateVirutualBoardPosition([row, rookColFrom], [row, rookColTo], rookPiece);

    // Atualiza DOM
    movePieceInDOMByPosition(fromPosition, toPosition);
    movePieceInDOMByPosition([row, rookColFrom], [row, rookColTo]);

    // Atualiza posição do rei
    GAME_STATE.kingPositions[color] = [row, toPosition[1]];

    clearSelectedPiece();
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
    const [kr, kc] = GAME_STATE.kingPositions[color];
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
    if (!isKingInCheck(color)) return false;

    const kingPosition = GAME_STATE.kingPositions[color];
    const kingMoves = getKingMove(kingPosition);

    // Verifica se o rei tem movimentos seguros
    const hasSafeMoves = kingMoves.some(move => isMoveSafe(kingPosition, move, color));
    if (hasSafeMoves) return false;

    // Verifica se alguma peça pode bloquear o xeque
    const pieces = PIECES[color];
    for (let piece of pieces) {
        const possibleMoves = getPossibleMoves(piece.positions[0], piece);
        for (let move of possibleMoves) {
            if (isMoveSafe(piece.positions[0], move, color)) {
                return false;
            }
        }
    }

    return true;
};

/**
 * Verifica se o jogador da cor especificada está em empate por afogamento (stalemate).
 *
 * @param {"white"|"black"} color - Cor do jogador a verificar.
 * @return {boolean} - Retorna `true` se for stalemate, `false` caso contrário.
 */
function isStalemate(color) {
    if (isKingInCheck(color)) return false;

    const pieces = PIECES[color];
    for (let piece of pieces) {
        const possibleMoves = getPossibleMoves(piece.positions[0], piece);
        for (let move of possibleMoves) {
            if (isMoveSafe(piece.positions[0], move, color)) {
                return false;
            }
        }
    }

    return true;
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
    const initialPos = getInitialPositionFromFEN(kingChar);
    const [r, c] = GAME_STATE.kingPositions[color];
    return initialPos && r === initialPos[0] && c === initialPos[1];
};

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
 * Verifica se a peça em uma posição específica é da cor informada.
 * @param {number[]} position - Posição no tabuleiro [row, col].
 * @param {string} color - Cor a ser verificada ('white' ou 'black').
 * @return {boolean} - Retorna true se houver uma peça da cor especificada na posição.
 */
function isPieceOfColor(position, color) {
    const piece = getPiecePositionOnVirtualBoard(position);
    return piece ? piece.color === color : false;
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

// ------------------ VIRTUAL BOARD e ATTACK BOARD
/**
 * Imprime no console o estado atual do tabuleiro virtual de posições.
 * Útil para debug.
 * @return {void}
 * 
 */
function logVirtualBoard() {
    console.log("🔍 Matriz de jogadas atualizada:");
    console.log(VIRTUAL_BOARD);
};

/**
 * Atualiza o tabuleiro virtual de posições após um movimento de peça.
 * Também atualiza a posição do rei, se a peça movida for o rei.
 * @param {number[]} fromPosition - Posição inicial [linha, coluna].
 * @param {number[]} toPosition - Posição de destino [linha, coluna].
 * @param {Object} piece - Objeto da peça que está sendo movida.
 * @return {void}
 * 
 */
function updateVirutualBoardPosition(fromPosition, toPosition, piece) {
    const [fromRow, fromCol] = fromPosition;
    const [toRow, toCol] = toPosition;
    if (piece.type === "king") {
        GAME_STATE.kingPositions[piece.color] = [toRow, toCol];
    }
    VIRTUAL_BOARD[fromRow][fromCol] = null;
    VIRTUAL_BOARD[toRow][toCol] = piece;
    piece.positions = [[toRow, toCol]];
};

/**
 * Atualiza o tabuleiro virtual de ataques (ATTACK_BOARD) a partir do estado atual das peças no tabuleiro.
 * Cada célula do ATTACK_BOARD contém um Set com as cores que atacam essa posição.
 * @return {void}
 * 
 */
function updateAttackBoardPosition() {
    ATTACK_BOARD = initializeAttackBoard();

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = VIRTUAL_BOARD[r][c];
            if (!piece) continue;

            const attacks = getAttackingMoves([r, c], piece);
            attacks.forEach(([ar, ac]) => {
                ATTACK_BOARD[ar][ac].add(piece.color);
                // Debug opcional:
                // console.log(
                //     `Peça ${piece.type} (${piece.color}) ataca [${ar}, ${ac}]`
                // );
            });
        }
    }
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

// ------------------ FEEDBACK
const modalBackdrop = document.getElementById('modal-backdrop');
const modal = document.getElementById('modal');

const setMessage = (message) => {
    const modalMessage = document.querySelector('.modal-message');
    modalMessage.textContent = message;
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

window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});

// ------------------ TURNOS
/**
 * Alterna o turno do jogador atual entre "white" e "black".
 * Atualiza GAME_STATE.currentPlayer.
 * @return {void}
 *
 */
function toggleCurrentPlayer() {
    GAME_STATE.currentPlayer = GAME_STATE.currentPlayer === "white" ? "black" : "white";
    console.log(`Turno do jogador: ${GAME_STATE.currentPlayer}`);

    // Verifica se o jogo terminou em xeque-mate ou empate
};

// ----------------- INICIAR JOGO
startGame();
