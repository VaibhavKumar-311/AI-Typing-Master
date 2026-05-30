import urllib.request
import urllib.error
import time

def test_endpoint(url, name):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        response = urllib.request.urlopen(req)
        status = response.getcode()
        html = response.read().decode('utf-8')
        if status == 200:
            print(f"PASS: {name} ({url})")
            if 'Error' in html or 'Exception' in html:
                print(f"  WARNING: Potential error text found in {name} HTML.")
        else:
            print(f"FAIL: {name} returned status {status}")
    except urllib.error.HTTPError as e:
        print(f"FAIL: {name} HTTP Error: {e.code} - {e.reason}")
    except Exception as e:
        print(f"FAIL: {name} Exception: {str(e)}")

# Wait for server to start
time.sleep(3)

print("Starting HTTP tests...")
endpoints = [
    ("http://127.0.0.1:8000/", "Home"),
    ("http://127.0.0.1:8000/accounts/login/", "Login"),
    ("http://127.0.0.1:8000/accounts/register/", "Register"),
    ("http://127.0.0.1:8000/leaderboards/", "Leaderboards"),
    ("http://127.0.0.1:8000/analytics/", "Analytics Dashboard"),
    ("http://127.0.0.1:8000/health/", "Health Check API"),
    ("http://127.0.0.1:8000/games/falling-words/", "Falling Words"),
    ("http://127.0.0.1:8000/games/zombie-typing/", "Zombie Typing"),
    ("http://127.0.0.1:8000/games/racing-typing/", "Racing Typing"),
    ("http://127.0.0.1:8000/games/space-shooter/", "Space Shooter"),
    ("http://127.0.0.1:8000/practice/studio/", "Practice Studio"),
    ("http://127.0.0.1:8000/static/css/output.css", "Tailwind CSS"),
    ("http://127.0.0.1:8000/static/css/themes.css", "Themes CSS"),
    ("http://127.0.0.1:8000/static/js/themeManager.js", "Theme Manager JS"),
]

for url, name in endpoints:
    test_endpoint(url, name)
