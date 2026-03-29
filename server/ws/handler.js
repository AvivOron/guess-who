import {
  createSession, getSession, getSessionByPlayerId, joinSession,
  startGame, startTurn, nextTurn, addQuestion, answerQuestion,
  removePlayer, getPlayers
} from '../state/store.js';

// Map of socketId -> WebSocket connection
const connections = new Map();

function send(ws, type, payload) {
  if (ws.readyState === 1) {
    ws.send(JSON.stringify({ type, payload }));
  }
}

function broadcast(session, type, payload, excludeId = null) {
  for (const [playerId] of session.players) {
    if (playerId === excludeId) continue;
    const ws = connections.get(playerId);
    if (ws) send(ws, type, payload);
  }
}

function broadcastAll(session, type, payload) {
  broadcast(session, type, payload);
}

function broadcastTurnStarted(session) {
  const { currentCelebrity, currentTurnPlayerId } = session;
  const players = getPlayers(session);

  for (const [playerId] of session.players) {
    const ws = connections.get(playerId);
    if (!ws) continue;
    const isHotSeat = playerId === currentTurnPlayerId;
    send(ws, 'TURN_STARTED', {
      hotSeatPlayerId: currentTurnPlayerId,
      celebrity: isHotSeat ? null : {
        id: currentCelebrity.id,
        name: currentCelebrity.name,
        hint: currentCelebrity.hint,
        imageUrl: currentCelebrity.imageUrl,
      },
      players,
    });
  }
}

export function registerSocket(ws, socketId) {
  connections.set(socketId, ws);

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }
    const { type, payload = {} } = msg;

    switch (type) {
      case 'CREATE_SESSION': {
        const { playerName } = payload;
        if (!playerName?.trim()) return send(ws, 'ERROR', { message: 'נדרש שם שחקן' });
        const session = createSession(socketId, playerName.trim());
        send(ws, 'SESSION_CREATED', {
          sessionCode: session.code,
          playerId: socketId,
          players: getPlayers(session),
        });
        break;
      }

      case 'JOIN_SESSION': {
        const { code, playerName } = payload;
        if (!code?.trim() || !playerName?.trim()) {
          return send(ws, 'ERROR', { message: 'נדרש קוד וסשן ושם שחקן' });
        }
        const result = joinSession(code.trim().toUpperCase(), socketId, playerName.trim());
        if (result.error) return send(ws, 'ERROR', { message: result.error });

        const { session } = result;
        send(ws, 'SESSION_JOINED', {
          sessionCode: session.code,
          playerId: socketId,
          players: getPlayers(session),
          phase: session.phase,
        });
        broadcast(session, 'PLAYER_JOINED', {
          player: session.players.get(socketId),
          players: getPlayers(session),
        }, socketId);
        break;
      }

      case 'START_GAME': {
        const session = getSessionByPlayerId(socketId);
        if (!session) return send(ws, 'ERROR', { message: 'סשן לא נמצא' });
        if (session.initiatorId !== socketId) return send(ws, 'ERROR', { message: 'רק מארגן המשחק יכול להתחיל' });
        if (session.players.size < 2) return send(ws, 'ERROR', { message: 'נדרשים לפחות 2 שחקנים' });

        startGame(session.code);
        broadcastAll(session, 'GAME_STARTED', { turnOrder: session.turnOrder, players: getPlayers(session) });

        const turnResult = startTurn(session.code);
        if (turnResult) broadcastTurnStarted(turnResult.session);
        break;
      }

      case 'NEXT_TURN': {
        const session = getSessionByPlayerId(socketId);
        if (!session) return send(ws, 'ERROR', { message: 'סשן לא נמצא' });
        if (session.initiatorId !== socketId) return send(ws, 'ERROR', { message: 'רק מארגן המשחק יכול להמשיך' });

        const turnResult = nextTurn(session.code);
        if (turnResult) broadcastTurnStarted(turnResult.session);
        break;
      }

      case 'ASK_QUESTION': {
        const session = getSessionByPlayerId(socketId);
        if (!session) return;
        if (session.currentTurnPlayerId !== socketId) {
          return send(ws, 'ERROR', { message: 'רק השחקן הנוכחי יכול לשאול שאלה' });
        }
        const { text } = payload;
        if (!text?.trim()) return send(ws, 'ERROR', { message: 'שאלה ריקה' });

        const question = addQuestion(session.code, socketId, text.trim());
        broadcastAll(session, 'QUESTION_ASKED', {
          question,
          askerName: session.players.get(socketId)?.name,
        });
        break;
      }

      case 'ANSWER_QUESTION': {
        const session = getSessionByPlayerId(socketId);
        if (!session) return;
        if (session.currentTurnPlayerId === socketId) {
          return send(ws, 'ERROR', { message: 'אתה לא יכול לענות על שאלות שלך' });
        }
        const { questionId, answer } = payload;
        if (!['כן', 'לא', 'אולי'].includes(answer)) {
          return send(ws, 'ERROR', { message: 'תשובה לא חוקית' });
        }

        const question = answerQuestion(session.code, questionId, answer);
        if (!question) return send(ws, 'ERROR', { message: 'שאלה לא נמצאה' });

        broadcastAll(session, 'QUESTION_ANSWERED', { question });
        break;
      }

      case 'REVEAL_GUESS': {
        const session = getSessionByPlayerId(socketId);
        if (!session) return;
        // Initiator or hot-seat player can trigger reveal
        const { correct } = payload;
        broadcastAll(session, 'CELEBRITY_REVEALED', {
          celebrity: session.currentCelebrity,
          correct: !!correct,
          hotSeatPlayerId: session.currentTurnPlayerId,
          hotSeatPlayerName: session.players.get(session.currentTurnPlayerId)?.name,
        });
        break;
      }
    }
  });

  ws.on('close', () => {
    connections.delete(socketId);
    const result = removePlayer(socketId);
    if (!result || result.empty) return;

    const { session } = result;
    broadcastAll(session, 'PLAYER_LEFT', {
      playerId: socketId,
      players: getPlayers(session),
      newInitiatorId: session.initiatorId,
    });
  });
}
