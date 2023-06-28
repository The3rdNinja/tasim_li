import time
from flask import Flask, jsonify, request
from flask_cors import CORS
import pygame
from threading import Thread
from urllib.parse import unquote

# Mapping between option values and display text
option_text_map = {
    'value-2': 'option1',
    'value-3': 'option2',
    'value-4': 'option3',
    'value-5': 'option4',
    'value-6': 'option5',
    'value-7': 'option6',
    'value-8': 'option7',
    'value-9': 'option8',
    'value-10': 'option9',
    'value-11': 'option10',
    'value-12': 'option11',
    'value-13': 'option12',
    'value-14': 'option13',
    'value-15': 'option14',
    'value-16': 'option15',
    'value-17': 'option16',
    'value-18': 'option17',
    'value-19': 'option18',
    'value-20': 'option19',
    'value-21': 'option20',
}

app = Flask(__name__)
CORS(app)

counters = {}
total_votes = 0

timeout = []

with open('songs.txt', 'r') as file:
    lines = file.readlines()
    for line in lines:
        if 'timeout' in line:
            line = line.strip().split(':')
            timeout.append(line[1])
print(timeout)


def timer():
    global cooldown_time  # Declare the variable as global to modify its value
    global blocked
    for cooldown_time in timeout:
        blocked = []  # Initialize the blocked list
        cooldown_time = int(cooldown_time)
        while cooldown_time > 0:
            time.sleep(1)
            print("Time left:", cooldown_time)
            cooldown_time -= 1


@app.route('/counters', methods=['GET'])
def get_counters():
    print(all_names)
    return jsonify({'counters': counters, 'names': all_names})


@app.route('/submit', methods=['POST'])
def submit_tasks():
    option = request.args.get('option')
    ip = request.args.get('ip')
    print("the ip is: ", ip)

    if option is not None and ip not in blocked:
        counters[option] = counters.get(option, 0) + 1

        if ip not in blocked:
            blocked.append(ip)
        else:
            return jsonify(message='IP address already blocked')

        print(blocked)
        print_status()
        return jsonify(message='Option submitted successfully')
    elif ip in blocked:
        print("blocked!")
        return jsonify(message='you cannot vote twice. you will have to wait to the next vote!'), 400
    else:
        return jsonify(message='Option value is missing'), 400


@app.route('/send-message', methods=['POST'])
def get_message():
    message = request.args.get('message')
    ip = request.args.get('ip')
    if message is not None:
        # Decode the message from URL encoding
        message = unquote(message)
        print("Received message:", message)
        print("Connected IP:", ip)

        return jsonify(message='got your message!: ' + message)

    else:
        return jsonify(message='Message value is missing'), 400


@app.route('/timeout', methods=['GET'])
def get_timeout():
    # Return the cooldown time
    response = {'timeout': cooldown_time}
    return jsonify(response)


def print_status():
    global total_votes
    total_votes = sum(counters.values())
    print("Current Status:")
    for option, count in counters.items():
        print(f"{option} - {count} vote{'s' if count != 1 else ''}")

    print(f"Total Votes: {total_votes}")


def run_flask_server():
    app.run()


def get_names():
    global names, all_names
    names = []
    with open('songs.txt', 'r') as file:
        lines = file.readlines()
        times = 0
        for i in lines:
            times += 1
            if times > len(lines):
                break
            if "timeout" not in i:
                print(i.strip())
                names.append(i.strip())
            else:
                all_names = []
                all_names.append(names)
                names = []

        print(names)


def run_pygame_window():
    pygame.init()
    size = width, height = 400, 400
    screen = pygame.display.set_mode(size)

    # Define colors
    white = (255, 255, 255)
    black = (0, 0, 0)
    blue = (0, 0, 255)
    gray = (200, 200, 200)

    # Define fonts
    font = pygame.font.Font(None, 24)
    title_font = pygame.font.Font(None, 32)

    while True:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:  # Handle window close event
                pygame.quit()
                exit()

        screen.fill(white)  # Fill the screen with white color

        # Render the voting status text
        title_text = "Voting Status"
        title_text_surface = title_font.render(title_text, True, black)
        title_text_rect = title_text_surface.get_rect(center=(width // 2, 50))
        screen.blit(title_text_surface, title_text_rect)

        # Render the total votes
        total_votes_text = f"Total Votes: {total_votes}"
        total_votes_surface = font.render(total_votes_text, True, black)
        total_votes_rect = total_votes_surface.get_rect(topleft=(40, 100))
        screen.blit(total_votes_surface, total_votes_rect)

        # Render the vote counts and percentages for each option
        pos_y = 160
        for option, count in counters.items():
            option_text = option_text_map.get(option, option)  # Get the corresponding display text for the option
            percentage = (count / total_votes) * 100
            vote_text = f"{option_text}: {count} vote{'s' if count != 1 else ''} ({percentage:.1f}%)"
            vote_text_surface = font.render(vote_text, True, black)
            vote_text_rect = vote_text_surface.get_rect(topleft=(40, pos_y))
            screen.blit(vote_text_surface, vote_text_rect)
            pos_y += 40

        pygame.draw.rect(screen, gray, (20, 90, 360, pos_y - 100), 2)  # Draw a rectangle as a border

        pygame.display.flip()

        pygame.time.delay(1000)  # Delay for 1000 milliseconds (1 second) between screen updates


if __name__ == '__main__':
    get_names()
    flask_thread = Thread(target=run_flask_server)
    pygame_thread = Thread(target=run_pygame_window)
    timer_thread = Thread(target=timer)

    flask_thread.start()
    timer_thread.start()
    pygame_thread.start()

    flask_thread.join()
    timer_thread.join()
    pygame_thread.join()
