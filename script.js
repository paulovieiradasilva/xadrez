
let VIRTUAL_BOARD = initializeVirtualBoard();
let ATTACK_BOARD = initializeAttackBoard();

let GAME_STATE = {
    currentPlayer: "white",
    selectedPiece: null,
    check: false,
    checkmate: false,
    kingPositions: {
        white: [],
        black: []
    },
    kingMoved: {
        white: false,
        black: false
    },
    rookMoved: {
        white: { 0: false, 7: false },
        black: { 0: false, 7: false }
    },
    lastPawnDoubleMove: null,
    enPassantPosition: [],
    promotionPending: null,
};
const INITIAL_POSITIONS = {
    white: [
        [[6, 0], [6, 1], [6, 2], [6, 3], [6, 4], [6, 5], [6, 6], [6, 7]], // Peões
        [[7, 0], [7, 7]], // Torres
        [[7, 1], [7, 6]], // Cavalos
        [[7, 2], [7, 5]], // Bispos
        [[7, 3]], // Rainha
        [[7, 4]]  // Rei
    ],
    black: [
        [[1, 0], [1, 1], [1, 2], [1, 3], [1, 4], [1, 5], [1, 6], [1, 7]], // Peões
        [[0, 0], [0, 7]], // Torres
        [[0, 1], [0, 6]], // Cavalos
        [[0, 2], [0, 5]], // Bispos
        [[0, 3]], // Rainha
        [[0, 4]]  // Rei
    ]
};
const PIECE_TYPES = {
    PAWN: { name: "Pawn", type: "pawn", symbol: "♟", img: "p.png" },
    ROOK: { name: "Rook", type: "rook", symbol: "♜", img: "r.png" },
    KNIGHT: { name: "Knight", type: "knight", symbol: "♞", img: "n.png" },
    BISHOP: { name: "Bishop", type: "bishop", symbol: "♝", img: "b.png" },
    QUEEN: { name: "Queen", type: "queen", symbol: "♕", img: "q.png" },
    KING: { name: "King", type: "king", symbol: "♚", img: "k.png" }
};
const PIECES = {
    white: createPieces("white", INITIAL_POSITIONS.white),
    black: createPieces("black", INITIAL_POSITIONS.black)
};

function startGame() {
    createBoard();
    addPieces();
}

function initializeVirtualBoard() {
    return Array(8).fill(null).map(() => Array(8).fill(null));
}

function initializeAttackBoard() {
    return Array(8).fill(null).map(() => Array(8).fill(false));
}

function createBoard() {
    const board = document.getElementById("board");
    const letters = "abcdefgh".split("");

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const cell = document.createElement("div");
            cell.classList.add(
                "relative",
                "w-20",
                "h-20",
                "flex",
                "flex-col",
                "justify-center",
                "items-center",
                "text-white",
                "cell"
            );
            cell.classList.add(getCellColor(row, col));
            cell.dataset.position = [row, col];
            cell.dataset.id = `${letters[col]}${8 - row}`;

            cell.textContent = `[${row}, ${col}]`;
            cell.style.fontSize = "10px";

            if (row === 7) {
                const letter = document.createElement("span");
                letter.textContent = letters[col];
                letter.classList.add(
                    "absolute",
                    "text-sm",
                    "right-1",
                    "bottom-1"
                );
                cell.appendChild(letter);
            }

            if (col === 0) {
                const number = document.createElement("span");
                number.textContent = 8 - row;
                number.classList.add(
                    "absolute",
                    "text-sm",
                    "left-1",
                    "top-1"
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
}

function addPieces() {
    const letters = "abcdefgh".split("");

    Object.entries(PIECES).forEach(([color, pieces]) => {
        pieces.forEach(piece => {
            const { name, pathImg, type, color, symbol } = piece;

            piece.positions.forEach((position) => {
                const cell = document.querySelector(`[data-position="${position.join(",")}"]`);
                if (cell) {
                    const img = document.createElement("img");
                    img.classList.add(
                        "flex",
                        "w-16",
                        "h-16",
                        "cursor-grab",
                        "active:cursor-grabbing"
                    );
                    img.dataset.id = position;
                    img.src = pathImg;
                    img.alt = name;

                    updateVirtualBoard(position, position, piece);

                    cell.appendChild(img);
                }
            });
        });
    });
}

function cellClicked(event, position) {
    const clickedPiece = getPiecePositionOnVirtualBoard(position);

    if (!clickedPiece && !GAME_STATE.selectedPiece) {
        console.log("Nenhuma peça selecionada e nenhuma peça encontrada na posição clicada.");
        return;
    }

    if (clickedPiece && clickedPiece.color === GAME_STATE.currentPlayer) {
        GAME_STATE.selectedPiece = clickedPiece;
        highligtPossibleMoves(clickedPiece, position, VIRTUAL_BOARD);
        highlightCell(position);
        return;
    }

    if (GAME_STATE.selectedPiece) {
        movePiece(GAME_STATE.selectedPiece.positions[0], position);
    }
}

function movePiece(fromPosition, toPosition) {
    const piece = getPiecePositionOnVirtualBoard(fromPosition);
    if (!piece) return false;

    const isValidMove = isValidateMove(fromPosition, toPosition, piece);
    if (!isValidMove) return false;

    if (!isMoveSafe(fromPosition, toPosition, GAME_STATE.currentPlayer)) {
        console.log("❌ Movimento ilegal! Isso deixaria o rei em xeque.");
        return false;
    }

    executeMove(fromPosition, toPosition, piece);

    const opponentColor = piece.color === "white" ? "black" : "white";
    if (isKingInCheck(opponentColor)) {
        console.log(`🚨 Xeque no rei ${opponentColor}!`);
    }

    getVirtualBoard();
    return true;
}

function executeMove(fromPosition, toPosition, piece) {
    const fromCell = document.querySelector(`[data-position="${fromPosition.join(",")}"]`);
    const toCell = document.querySelector(`[data-position="${toPosition.join(",")}"]`);

    setLastPawnDoubleMove(fromPosition, toPosition, piece);
    removeOpponentPiecesIfExists(toCell);
    removePawnEnPassant(toPosition);
    movePieceInDOM(fromCell, toCell, toPosition, piece);
    updateVirtualBoard(fromPosition, toPosition, piece);
    highligtPossibleMoves(piece, toPosition, VIRTUAL_BOARD);
    clearSelectedPiece();
    switchTurnPlayer();
}

function movePieceInDOM(fromCell, toCell, toPosition, piece) {
    const pieceImg = fromCell.querySelector('img');
    fromCell.removeChild(pieceImg);
    toCell.appendChild(pieceImg);

    removeHighlightMoves([], VIRTUAL_BOARD);
}

function isMoveSafe(fromPosition, toPosition, player) {
    const [fromRow, fromCol] = fromPosition;
    const [toRow, toCol] = toPosition;

    // 1️⃣ Salva o estado original
    const originalPiece = VIRTUAL_BOARD[fromRow][fromCol];
    const capturedPiece = VIRTUAL_BOARD[toRow][toCol]; // Pode ser null

    // 2️⃣ Simula o movimento
    VIRTUAL_BOARD[fromRow][fromCol] = null;
    VIRTUAL_BOARD[toRow][toCol] = originalPiece;

    // 3️⃣ Se for o rei, atualiza a posição temporária
    if (originalPiece.type === "king") {
        GAME_STATE.kingPositions[player] = [toRow, toCol];
    }

    // 4️⃣ Atualiza a matriz de ataque para a nova configuração do tabuleiro
    // updateAttackMatrix();

    // 5️⃣ Verifica se o próprio rei está em xeque
    const kingIsInCheck = isKingInCheck(player);

    // 6️⃣ Restaura o estado original
    VIRTUAL_BOARD[fromRow][fromCol] = originalPiece;
    VIRTUAL_BOARD[toRow][toCol] = capturedPiece;

    if (originalPiece.type === "king") {
        GAME_STATE.kingPositions[player] = [fromRow, fromCol];
    }

    // 7️⃣ Retorna `false` se o movimento colocar o rei em xeque
    return !kingIsInCheck;
}

function removeOpponentPiecesIfExists(toCell) {
    const targetImg = toCell.querySelector('img');
    if (targetImg) targetImg.remove();
}

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
}

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
}

// Função auxiliar para peças deslizantes (torre, bispo, rainha)
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
}

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
}

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
}

function removePawnEnPassant(toPosition) {
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
}

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
}

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
}

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
}

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
}

function getQueenMove(position) {
    const moves = [
        ...getRookMove(position),
        ...getBishopMove(position)
    ];

    return moves;
}

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

    return moves;
}

function canCastle(fromPosition, toPosition, color) {
    const row = color === "white" ? 7 : 0;

    if (!isKingInInitialPosition(color)) {
        console.log("❌ Roque negado: Rei já se moveu.");
        return false;
    }

    const isKingside = toPosition[1] === 6;
    const isQueenside = toPosition[1] === 2;
    if (!isKingside && !isQueenside) {
        console.log("❌ Roque negado: Destino não é uma casa válida para o roque.");
        return false;
    }

    const rookCol = isKingside ? 7 : 0;
    if (!isRookInInitialPosition(color, isKingside ? "kingside" : "queenside")) {
        console.log("❌ Roque negado: Torre já se moveu ou não está na posição inicial.");
        return false;
    }

    const intermediateCols = isKingside ? [5, 6] : [1, 2, 3];
    const attackCols = isKingside ? [4, 5, 6] : [2, 3, 4];

    for (let col of intermediateCols) {
        if (VIRTUAL_BOARD[row][col]) {
            console.log(`❌ Roque negado: Casa [${row}, ${col}] bloqueada.`);
            return false;
        }
    }

    if (isKingInCheck(color)) {
        console.log("❌ Roque negado: Rei está em xeque.");
        return false;
    }

    for (let col of attackCols) {
        if (ATTACK_BOARD[row][col]) {
            console.log(`❌ Roque negado: Casa [${row}, ${col}] está sob ataque.`);
            return false;
        }
    }

    console.log("✅ Roque permitido!");
    return true;
}

function executeCastle(fromPosition, toPosition, color) {
    const row = color === "white" ? 7 : 0;
    const isKingside = toPosition[1] === 6;
    const isQueenside = toPosition[1] === 2;

    if (!isKingside && !isQueenside) return;

    const rookColFrom = isKingside ? 7 : 0;
    const rookColTo = isKingside ? 5 : 3;

    // Atualiza o tabuleiro virtual
    const kingPiece = VIRTUAL_BOARD[row][4];
    const rookPiece = VIRTUAL_BOARD[row][rookColFrom];

    VIRTUAL_BOARD[row][4] = null;
    VIRTUAL_BOARD[row][rookColFrom] = null;
    VIRTUAL_BOARD[row][toPosition[1]] = kingPiece;
    VIRTUAL_BOARD[row][rookColTo] = rookPiece;

    // Atualiza a posição do rei no estado do jogo
    GAME_STATE.kingPositions[color] = [row, toPosition[1]];

    // Atualiza o DOM
    movePieceInDOM([row, 4], toPosition);
    movePieceInDOM([row, rookColFrom], [row, rookColTo]);

    // Troca a vez do jogador
    switchTurnPlayer();
}

function updateAttackBoard() {
    ATTACK_BOARD = Array(8).fill(null).map(() => Array(8).fill(false));

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            let piece = VIRTUAL_BOARD[row][col];

            if (piece) {
                let possibleMoves = getPossibleMoves([row, col], piece);

                possibleMoves.forEach(([x, y]) => {
                    const targetPiece = VIRTUAL_BOARD[x][y];

                    if (!targetPiece || targetPiece.color !== piece.color) {
                        ATTACK_BOARD[x][y] = true; // Marca a casa como atacada
                        console.log(`🔴 Peça ${piece.type} (${piece.color}) atacando [${x}, ${y}]`);
                    }
                });
            }
        }
    }

    console.log("🔍 Matriz de ataque atualizada:");
    console.log(ATTACK_BOARD);
}

function isKingInCheck(color) {
    const kingPosition = GAME_STATE.kingPositions[color];
    const [kingRow, kingCol] = kingPosition;

    console.log(`🔍 Verificando xeque para o rei ${color} na posição`, kingPosition);
    console.log("🚨 Casa do rei está atacada?", ATTACK_BOARD[kingRow][kingCol]);

    // Verifica se a posição do rei está marcada como atacada
    return ATTACK_BOARD[kingRow][kingCol];
}

const isKingInInitialPosition = (color) => {
    return GAME_STATE.kingPositions[color][0] === INITIAL_POSITIONS[color][5][0][0] &&
        GAME_STATE.kingPositions[color][1] === INITIAL_POSITIONS[color][5][0][1];
};

const isRookInInitialPosition = (color, side) => {
    const rookCol = side === "kingside" ? 7 : 0;
    const rookPosition = VIRTUAL_BOARD[INITIAL_POSITIONS[color][1][side === "kingside" ? 1 : 0][0]][rookCol];

    return rookPosition && rookPosition.type === "rook" && rookPosition.color === color;
};

function isValidateMove(fromPosition, toPosition, piece) {
    const [toRow, toCol] = toPosition;
    const possibleMoves = getPossibleMoves(fromPosition, piece);

    // Verifica se o movimento é válido
    const isValidMove = possibleMoves.some(
        ([row, col]) => row === toRow && col === toCol
    );

    if (!isValidMove) return false;

    return true; // Movimento válido
}

function isValidBoardPosition(row, col) {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
}

function hasPieceAtPosition(position) {
    const [row, col] = position;
    if (!isValidBoardPosition(row, col)) return false;
    const piece = VIRTUAL_BOARD[row][col];
    return piece !== null; // Verifica se existe peça na posição
}

function isSameColorPiece(position, color) {
    const piece = getPiecePositionOnVirtualBoard(position);
    return piece ? piece.color === color : false;
}

function getPiecePositionOnVirtualBoard(position) {
    const [row, col] = position;
    if (!isValidBoardPosition(row, col)) return false;
    return VIRTUAL_BOARD[row][col];
}

function updateVirtualBoard(fromPosition, toPosition, piece) {
    const [fromRow, fromCol] = fromPosition;
    const [toRow, toCol] = toPosition;
    if (piece.type === "king") {
        GAME_STATE.kingPositions[piece.color] = [toRow, toCol];
    }
    VIRTUAL_BOARD[fromRow][fromCol] = null;
    VIRTUAL_BOARD[toRow][toCol] = piece;
    piece.positions = [[toRow, toCol]];
}

function getVirtualBoard() {
    console.log("🔍 Matriz de jogadas atualizada:");
    console.log(VIRTUAL_BOARD);
}

function createPieces(color, positions) {
    const pieceKeys = Object.keys(PIECE_TYPES);

    return Object.entries(positions).flatMap(([index, posArray], i) =>
        posArray.map(position => ({
            name: PIECE_TYPES[pieceKeys[i]].name,
            type: PIECE_TYPES[pieceKeys[i]].type,
            positions: [position], // Cada peça tem uma posição inicial
            symbol: PIECE_TYPES[pieceKeys[i]].symbol,
            color,
            pathImg: `./img/pieces/${color}/${PIECE_TYPES[pieceKeys[i]].img}`
        }))
    );
}

function switchTurnPlayer() {
    GAME_STATE.currentPlayer = GAME_STATE.currentPlayer === "white" ? "black" : "white";
    console.log(`Turno do jogador: ${GAME_STATE.currentPlayer}`);

    // Verifica se o jogo terminou em xeque-mate ou empate
}

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
}

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
}

function highligtPossibleMoves(piece, position, board) {
    const newPossibleMoves = getPossibleMoves(position, piece);

    removeHighlightMoves(newPossibleMoves, board);

    newPossibleMoves.forEach((move) => {
        const cell = document.querySelector(`[data-position="${move.join(",")}"]`);
        if (cell) {
            const circle = document.createElement("div");
            circle.classList.add(
                "moves-circle",
                "absolute",
                "w-3",
                "h-3",
                "bg-yellow-500",
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
}

function removeHighlightMoves(moves, board) {
    const circles = document.querySelectorAll(".moves-circle");
    if (circles) {
        circles.forEach((circle) => {
            circle.remove();
        });
    }
}

function highlightCell(position) {
    const [row, col] = position;
    const cells = document.querySelectorAll(".cell");
    cells.forEach((cell) => {
        cell.classList.toggle(
            "bg-[#F59E0B]",
            cell.dataset.position === `${row},${col}`
        );
    });
}

function getCellColor(row, col) {
    return (row + col) % 2 === 0 ? "bg-[#EBECD0]" : "bg-[#739552]";
}

function clearSelectedPiece() {
    GAME_STATE.selectedPiece = null;
}

// Start the game
startGame();
