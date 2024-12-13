import telebot
from telebot.types import InlineKeyboardMarkup, InlineKeyboardButton

# Замените 'YOUR_BOT_TOKEN' на токен вашего бота
TOKEN = '7747561969:AAGfzx5aGtFNLDwfbIG93__LTOBnw3nJl9I'
bot = telebot.TeleBot(TOKEN)

# Состояние игры
class GameState:
    def __init__(self):
        self.board = self.create_board()
        self.current_player = '⚫'  # Начинают черные
        self.selected_piece = None
        self.games = {}  # Словарь для хранения состояний игр разных пользователей

    def create_board(self):
        board = [[' ' for _ in range(8)] for _ in range(8)]
        # Расставляем черные шашки
        for i in range(3):
            for j in range(8):
                if (i + j) % 2 == 1:
                    board[i][j] = '⚫'
        # Расставляем белые шашки
        for i in range(5, 8):
            for j in range(8):
                if (i + j) % 2 == 1:
                    board[i][j] = '⚪'
        return board

game_state = GameState()

def create_board_markup(board, chat_id):
    markup = InlineKeyboardMarkup()
    for i in range(8):
        row = []
        for j in range(8):
            cell = board[i][j]
            if cell == ' ':
                symbol = '⬛' if (i + j) % 2 == 1 else '⬜'
            else:
                symbol = cell
            callback_data = f'{i},{j}'
            row.append(InlineKeyboardButton(symbol, callback_data=callback_data))
        markup.row(*row)
    return markup

@bot.message_handler(commands=['start'])
def start_game(message):
    markup = telebot.types.InlineKeyboardMarkup()
    markup.add(telebot.types.InlineKeyboardButton(
        text="Играть в шашки", 
        web_app={"url": "https://github.com/Gmilitdinov/telegram-checkers/"}
    ))
    bot.send_message(
        message.chat.id,
        "Добро пожаловать в игру шашки! Нажмите кнопку ниже, чтобы начать игру:",
        reply_markup=markup
    )

@bot.callback_query_handler(func=lambda call: True)
def handle_move(call):
    chat_id = call.message.chat.id
    if chat_id not in game_state.games:
        game_state.games[chat_id] = GameState()
    
    current_game = game_state.games[chat_id]
    i, j = map(int, call.data.split(','))
    
    if current_game.selected_piece is None:
        # Выбор шашки
        if current_game.board[i][j] == current_game.current_player:
            current_game.selected_piece = (i, j)
            bot.answer_callback_query(call.id, "Шашка выбрана")
        else:
            bot.answer_callback_query(call.id, "Выберите свою шашку!")
    else:
        # Ход шашкой
        start_i, start_j = current_game.selected_piece
        if is_valid_move(current_game.board, start_i, start_j, i, j, current_game.current_player):
            make_move(current_game.board, start_i, start_j, i, j)
            current_game.current_player = '⚪' if current_game.current_player == '⚫' else '⚫'
            current_game.selected_piece = None
            bot.edit_message_reply_markup(
                chat_id,
                call.message.message_id,
                reply_markup=create_board_markup(current_game.board, chat_id)
            )
        else:
            current_game.selected_piece = None
            bot.answer_callback_query(call.id, "Недопустимый ход!")

def is_valid_move(board, start_i, start_j, end_i, end_j, player):
    # Проверка правильности хода
    if not (0 <= end_i < 8 and 0 <= end_j < 8):
        return False
    
    if board[end_i][end_j] != ' ':
        return False
    
    di = end_i - start_i
    dj = end_j - start_j
    
    # Простой ход
    if abs(di) == 1 and abs(dj) == 1:
        if player == '⚫' and di > 0:
            return True
        if player == '⚪' and di < 0:
            return True
    
    # Ход с взятием
    if abs(di) == 2 and abs(dj) == 2:
        mid_i = (start_i + end_i) // 2
        mid_j = (start_j + end_j) // 2
        if board[mid_i][mid_j] != ' ' and board[mid_i][mid_j] != player:
            return True
    
    return False

def make_move(board, start_i, start_j, end_i, end_j):
    # Выполнение хода
    board[end_i][end_j] = board[start_i][start_j]
    board[start_i][start_j] = ' '
    
    # Если это было взятие, удаляем побитую шашку
    if abs(end_i - start_i) == 2:
        mid_i = (start_i + end_i) // 2
        mid_j = (start_j + end_j) // 2
        board[mid_i][mid_j] = ' '

if __name__ == "__main__":
    bot.polling(none_stop=True) 